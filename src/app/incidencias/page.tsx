import Link from 'next/link'
import { exigirRol } from '@/lib/auth'
import { crearClienteServidor } from '@/lib/supabase-servidor'
import Navbar from '@/components/navbar'
import FondoPantalla from '@/components/fondo-pantalla'
import {
  SEVERIDADES, ESTADOS_INCIDENCIA, SEVERIDAD_ETIQUETA, ESTADO_INCIDENCIA_ETIQUETA,
  SEVERIDAD_CLASE, ESTADO_INCIDENCIA_CLASE, FACTOR_CALIDAD_ETIQUETA,
  type Severidad, type EstadoIncidencia, type FactorCalidad,
} from '@/lib/incidencias'

type Incidencia = {
  id: string
  titulo: string
  modulo: string | null
  severidad: Severidad
  factor_calidad: FactorCalidad | null
  estado: EstadoIncidencia
  reportado_por: string
  asignado_a: string | null
  creado_en: string
}

type BusquedaParams = { estado?: string; severidad?: string }

export default async function ListadoIncidenciasPage({
  searchParams,
}: {
  searchParams: Promise<BusquedaParams>
}) {
  // Registro interno de calidad del software — solo Administrador, no es un
  // artefacto de gestión operativa de residuos (a diferencia de alertas).
  await exigirRol('administrador')
  const sp = await searchParams
  const supabase = await crearClienteServidor()

  const estado = ESTADOS_INCIDENCIA.find((e) => e === sp.estado)
  const severidad = SEVERIDADES.find((s) => s === sp.severidad)

  let consulta = supabase
    .from('incidencias_software')
    .select('id, titulo, modulo, severidad, factor_calidad, estado, reportado_por, asignado_a, creado_en')
    .order('creado_en', { ascending: false })

  if (estado) consulta = consulta.eq('estado', estado)
  if (severidad) consulta = consulta.eq('severidad', severidad)

  const [{ data: incidencias }, { data: perfiles }] = await Promise.all([
    consulta,
    supabase.from('perfiles').select('id, nombre').eq('rol', 'administrador'),
  ])

  const nombrePorId = new Map<string, string>()
  perfiles?.forEach((p) => nombrePorId.set(p.id, p.nombre ?? 'Administrador'))

  const filas = (incidencias ?? []) as Incidencia[]
  const hayFiltros = Boolean(estado || severidad)

  return (
    <main className="min-h-screen relative">
      <FondoPantalla nombre="incidencias" alt="Fondo del listado de incidencias" />
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Incidencias de software</h1>
            <p className="text-brand-muted text-sm">
              {filas.length} registro{filas.length === 1 ? '' : 's'} — registro interno de defectos, no visible para Directiva/Cuadrilla
            </p>
          </div>
          <Link
            href="/incidencias/nueva"
            className="text-sm font-semibold text-brand-bg bg-brand-emerald hover:brightness-110 transition px-4 py-2 rounded-lg"
          >
            + Reportar incidencia
          </Link>
        </div>

        <form method="get" className="flex flex-wrap items-end gap-3 mb-5">
          <div>
            <label className="block text-xs font-semibold text-brand-muted mb-1">Estado</label>
            <select name="estado" defaultValue={estado ?? ''} className="border border-brand-border bg-brand-surface rounded-lg px-2 py-1.5 text-sm text-foreground">
              <option value="">Todos</option>
              {ESTADOS_INCIDENCIA.map((e) => <option key={e} value={e}>{ESTADO_INCIDENCIA_ETIQUETA[e]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-muted mb-1">Severidad</label>
            <select name="severidad" defaultValue={severidad ?? ''} className="border border-brand-border bg-brand-surface rounded-lg px-2 py-1.5 text-sm text-foreground">
              <option value="">Todas</option>
              {SEVERIDADES.map((s) => <option key={s} value={s}>{SEVERIDAD_ETIQUETA[s]}</option>)}
            </select>
          </div>
          <button type="submit" className="text-sm font-semibold text-brand-bg bg-brand-emerald hover:brightness-110 transition px-4 py-1.5 rounded-lg">
            Filtrar
          </button>
          {hayFiltros && (
            <Link href="/incidencias" className="text-sm text-brand-muted hover:text-brand-emerald">
              Limpiar filtros
            </Link>
          )}
        </form>

        <div className="tarjeta-vidrio tarjeta-entrada overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-brand-muted border-b border-brand-border">
                <th className="py-3 px-4 font-semibold">Título</th>
                <th className="py-3 px-4 font-semibold">Módulo</th>
                <th className="py-3 px-4 font-semibold">Factor de calidad</th>
                <th className="py-3 px-4 font-semibold">Severidad</th>
                <th className="py-3 px-4 font-semibold">Estado</th>
                <th className="py-3 px-4 font-semibold">Asignado a</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((i) => (
                <tr key={i.id} className="border-b border-brand-border last:border-0 hover:bg-white/5">
                  <td className="py-3 px-4">
                    <Link href={`/incidencia/${i.id}`} className="font-semibold text-foreground hover:text-brand-emerald">
                      {i.titulo}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-brand-muted">{i.modulo ?? '—'}</td>
                  <td className="py-3 px-4 text-brand-muted">{i.factor_calidad ? FACTOR_CALIDAD_ETIQUETA[i.factor_calidad] : '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${SEVERIDAD_CLASE[i.severidad]}`}>
                      {SEVERIDAD_ETIQUETA[i.severidad]}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${ESTADO_INCIDENCIA_CLASE[i.estado]}`}>
                      {ESTADO_INCIDENCIA_ETIQUETA[i.estado]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-brand-muted">
                    {i.asignado_a ? (nombrePorId.get(i.asignado_a) ?? 'Administrador') : 'Sin asignar'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filas.length && <p className="text-brand-muted text-sm p-6 text-center">Ninguna incidencia coincide con este filtro.</p>}
        </div>
      </div>
    </main>
  )
}
