import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { obtenerPerfil } from '@/lib/auth'
import Navbar from '@/components/navbar'
import FondoPantalla from '@/components/fondo-pantalla'
import { nivelClaseTailwind, NIVEL_UMBRAL_ALTO } from '@/lib/nivel'
import { ZONA_ETIQUETA, TIPO_ETIQUETA, type TipoResiduo, type ZonaTipo } from '@/lib/codigo-contenedor'

type Contenedor = {
  id: string
  codigo: string
  tipo_residuo: TipoResiduo
  zona_tipo: ZonaTipo
  capacidad_litros: number
  estado: string
  eliminado_en: string | null
  numero_punto: number
  nombre_ubicacion: string | null
  latitud: number | string | null
  longitud: number | string | null
}

const TIPOS = ['plastico', 'papel', 'vidrio', 'organico'] as const
const ESTADOS = ['activo', 'mantenimiento', 'fuera_de_servicio'] as const
const ZONAS = ['via_publica', 'comercial'] as const
const PATRON_PUNTO = /^\d{1,3}$/

const estadoEtiqueta: Record<string, string> = {
  activo: 'Activo', mantenimiento: 'En mantenimiento', fuera_de_servicio: 'Fuera de servicio',
}

type BusquedaParams = {
  tipo?: string; estado?: string; zona?: string; eliminados?: string; nivel?: string; punto?: string
}

export default async function ListadoContenedoresPage({
  searchParams,
}: {
  searchParams: Promise<BusquedaParams>
}) {
  const [perfil, sp] = await Promise.all([obtenerPerfil(), searchParams])
  const esAdministrador = perfil?.rol === 'administrador'
  const verEliminados = esAdministrador && sp.eliminados === '1'

  let consulta = supabase
    .from('contenedores')
    .select('id, codigo, tipo_residuo, zona_tipo, capacidad_litros, estado, eliminado_en, numero_punto, nombre_ubicacion, latitud, longitud')
    .order('codigo')

  // Los filtros vienen de la URL (query params) — no son datos de confianza
  // aunque el <select> del formulario solo ofrezca estas opciones, cualquiera
  // puede escribir la URL a mano. Se valida contra la lista real antes de
  // usarlos en la consulta, en vez de pasarlos tal cual.
  const tipo = TIPOS.find((t) => t === sp.tipo)
  const estado = ESTADOS.find((e) => e === sp.estado)
  const zona = ZONAS.find((z) => z === sp.zona)
  const nivelCritico = sp.nivel === 'critico'
  const punto = sp.punto && PATRON_PUNTO.test(sp.punto) ? Number(sp.punto) : undefined

  if (!verEliminados) consulta = consulta.is('eliminado_en', null)
  if (tipo) consulta = consulta.eq('tipo_residuo', tipo)
  if (estado) consulta = consulta.eq('estado', estado)
  if (zona) consulta = consulta.eq('zona_tipo', zona)
  if (punto !== undefined) consulta = consulta.eq('numero_punto', punto)

  const [{ data: contenedores }, { data: lecturas }] = await Promise.all([
    consulta,
    supabase.from('ultima_lectura_por_contenedor').select('contenedor_id, nivel_pct'),
  ])

  const nivelPorContenedor = new Map<string, number>()
  lecturas?.forEach((l) => nivelPorContenedor.set(l.contenedor_id, l.nivel_pct))

  // "En nivel crítico" (link desde el dashboard) se filtra aquí, en memoria,
  // porque depende del join con ultima_lectura_por_contenedor — no es una
  // columna propia de `contenedores` que se pueda pasar a Supabase arriba.
  const filasSinNivel = (contenedores ?? []) as Contenedor[]
  const filas = nivelCritico
    ? filasSinNivel.filter((c) => (nivelPorContenedor.get(c.id) ?? 0) >= NIVEL_UMBRAL_ALTO)
    : filasSinNivel
  const hayFiltros = Boolean(tipo || estado || zona || nivelCritico || punto !== undefined)
  const isla = punto !== undefined ? filas[0] : undefined

  return (
    <main className="min-h-screen relative">
      <FondoPantalla nombre="contenedores" alt="Fondo del listado de contenedores" />
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contenedores</h1>
            <p className="text-brand-muted text-sm">
              {filas.length} registro{filas.length === 1 ? '' : 's'}
              {nivelCritico && (
                <>
                  {' — '}
                  <Link href="/contenedores" className="text-brand-coral font-semibold hover:underline">
                    filtrando por nivel crítico (≥{NIVEL_UMBRAL_ALTO}%) ✕
                  </Link>
                </>
              )}
            </p>
          </div>
          {esAdministrador && (
            <Link
              href="/contenedores/nuevo"
              className="text-sm font-semibold text-brand-bg bg-brand-emerald hover:brightness-110 transition px-4 py-2 rounded-lg"
            >
              + Registrar punto limpio
            </Link>
          )}
        </div>

        {punto !== undefined && (
          <div className="tarjeta-vidrio p-4 mb-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-semibold text-foreground">
                Isla PL-{String(punto).padStart(3, '0')}
                {isla?.nombre_ubicacion ? ` — ${isla.nombre_ubicacion}` : ''}
              </p>
              {isla?.latitud !== undefined && isla?.longitud !== undefined && (
                <p className="text-xs text-brand-muted font-mono">
                  {Number(isla.latitud).toFixed(6)}, {Number(isla.longitud).toFixed(6)}
                </p>
              )}
            </div>
            <Link href="/contenedores" className="text-sm text-brand-muted hover:text-brand-emerald">
              Ver todos los contenedores →
            </Link>
          </div>
        )}

        <form method="get" className="flex flex-wrap items-end gap-3 mb-5">
          <div>
            <label className="block text-xs font-semibold text-brand-muted mb-1">Tipo</label>
            <select name="tipo" defaultValue={tipo ?? ''} className="border border-brand-border bg-brand-surface rounded-lg px-2 py-1.5 text-sm text-foreground">
              <option value="">Todos</option>
              {TIPOS.map((t) => <option key={t} value={t}>{TIPO_ETIQUETA[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-muted mb-1">Estado</label>
            <select name="estado" defaultValue={estado ?? ''} className="border border-brand-border bg-brand-surface rounded-lg px-2 py-1.5 text-sm text-foreground">
              <option value="">Todos</option>
              {ESTADOS.map((e) => <option key={e} value={e}>{estadoEtiqueta[e]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-muted mb-1">Zona</label>
            <select name="zona" defaultValue={zona ?? ''} className="border border-brand-border bg-brand-surface rounded-lg px-2 py-1.5 text-sm text-foreground">
              <option value="">Todas</option>
              {ZONAS.map((z) => <option key={z} value={z}>{ZONA_ETIQUETA[z]}</option>)}
            </select>
          </div>
          {verEliminados && <input type="hidden" name="eliminados" value="1" />}
          <button type="submit" className="text-sm font-semibold text-brand-bg bg-brand-emerald hover:brightness-110 transition px-4 py-1.5 rounded-lg">
            Filtrar
          </button>
          {hayFiltros && (
            <Link href={verEliminados ? '/contenedores?eliminados=1' : '/contenedores'} className="text-sm text-brand-muted hover:text-brand-emerald">
              Limpiar filtros
            </Link>
          )}
        </form>

        <div className="tarjeta-vidrio tarjeta-entrada overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-brand-muted border-b border-brand-border">
                <th className="py-3 px-4 font-semibold whitespace-nowrap">Código</th>
                <th className="py-3 px-4 font-semibold">Tipo</th>
                <th className="py-3 px-4 font-semibold">Ubicación</th>
                <th className="py-3 px-4 font-semibold">Zona</th>
                <th className="py-3 px-4 font-semibold text-right">Capacidad</th>
                <th className="py-3 px-4 font-semibold text-right">Última lectura</th>
                <th className="py-3 px-4 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((c) => {
                const nivel = nivelPorContenedor.get(c.id) ?? null
                return (
                  <tr key={c.id} className="border-b border-brand-border last:border-0 hover:bg-white/5">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Link href={`/contenedor/${c.id}`} className="font-semibold text-foreground hover:text-brand-emerald font-mono">
                        {c.codigo}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-brand-muted">{TIPO_ETIQUETA[c.tipo_residuo] ?? c.tipo_residuo}</td>
                    <td className="py-3 px-4 text-brand-muted">
                      <Link href={`/contenedores?punto=${String(c.numero_punto).padStart(3, '0')}`} className="hover:text-brand-emerald">
                        {c.nombre_ubicacion ?? `Isla PL-${String(c.numero_punto).padStart(3, '0')}`}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-brand-muted">{ZONA_ETIQUETA[c.zona_tipo]}</td>
                    <td className="py-3 px-4 text-brand-muted text-right">{c.capacidad_litros} L</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${nivelClaseTailwind(nivel)}`}>
                        {nivel !== null ? `${nivel}%` : 'Sin datos'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-brand-muted">
                      {estadoEtiqueta[c.estado] ?? c.estado}
                      {c.eliminado_en && <span className="text-brand-coral font-semibold"> · Eliminado</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!filas.length && <p className="text-brand-muted text-sm p-6 text-center">Ningún contenedor coincide con este filtro.</p>}
        </div>

        {esAdministrador && (
          <p className="text-xs text-brand-muted mt-4">
            {verEliminados ? (
              <Link href="/contenedores" className="hover:text-brand-emerald">Ocultar contenedores eliminados</Link>
            ) : (
              <Link href="/contenedores?eliminados=1" className="hover:text-brand-emerald">Ver también contenedores eliminados →</Link>
            )}
          </p>
        )}
      </div>
    </main>
  )
}
