import { supabase } from '@/lib/supabase'
import { nivelClaseTailwind } from '@/lib/nivel'
import MapaPanel from '@/components/mapa-panel'
import Link from 'next/link'
import { obtenerPerfil } from '@/lib/auth'
import Navbar from '@/components/navbar'
import HeroLanding from '@/components/hero-landing'

type Contenedor = {
  id: string
  codigo: string
  tipo_residuo: string
  capacidad_litros: number
  estado: string
  latitud: number | string | null
  longitud: number | string | null
}

type Lectura = {
  contenedor_id: string
  nivel_pct: number
  timestamp: string
}

export default async function DashboardPage() {
  // Perfil + las 2 consultas de datos son independientes entre sí — se piden
  // en paralelo en vez de esperar cada una por turno (waterfall).
  const [perfil, { data: contenedores }, { data: lecturas }] = await Promise.all([
    obtenerPerfil(),
    supabase
      .from('contenedores')
      .select('id, codigo, tipo_residuo, capacidad_litros, estado, latitud, longitud')
      .is('eliminado_en', null)
      .order('codigo'),
    // Vista con la última lectura por contenedor (DISTINCT ON en el servidor)
    // en vez de traer TODA la tabla lecturas_sensor y quedarnos con la primera
    // por contenedor en JS — esa consulta crecía sin límite en cada carga.
    supabase.from('ultima_lectura_por_contenedor').select('contenedor_id, nivel_pct, timestamp'),
  ])

  const ultimaLecturaPorContenedor = new Map<string, number>()
  lecturas?.forEach((l: Lectura) => {
    ultimaLecturaPorContenedor.set(l.contenedor_id, l.nivel_pct)
  })

  const contenedoresMapa = (contenedores ?? [])
    .filter((c: Contenedor) => c.latitud !== null && c.longitud !== null)
    .map((c: Contenedor) => ({
      id: c.id,
      codigo: c.codigo,
      tipo_residuo: c.tipo_residuo,
      capacidad_litros: c.capacidad_litros,
      latitud: Number(c.latitud),
      longitud: Number(c.longitud),
      nivel: ultimaLecturaPorContenedor.get(c.id) ?? null,
    }))

  const puntosUnicos = new Set(contenedoresMapa.map((c) => `${c.latitud.toFixed(6)},${c.longitud.toFixed(6)}`)).size
  const nivelesConocidos = Array.from(ultimaLecturaPorContenedor.values())
  const criticos = nivelesConocidos.filter((n) => n >= 85).length
  const promedio = nivelesConocidos.length
    ? Math.round(nivelesConocidos.reduce((suma, n) => suma + n, 0) / nivelesConocidos.length)
    : null

  return (
    <main className="min-h-screen">
      <Navbar />

      {!perfil && <HeroLanding puntosMonitoreados={puntosUnicos} nivelPromedio={promedio} />}

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="tarjeta-vidrio tarjeta-interactiva tarjeta-entrada p-5 mb-6 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-brand-border">
          <div className="pb-4 sm:pb-0 sm:pr-5">
            <p className="text-sm text-brand-muted mb-1">Puntos monitoreados</p>
            <p className="text-3xl font-bold text-foreground">{puntosUnicos}</p>
          </div>
          <div className="py-4 sm:py-0 sm:px-5">
            <p className="text-sm text-brand-muted mb-1">En nivel crítico (≥85%)</p>
            <p className={`text-3xl font-bold ${criticos > 0 ? 'text-brand-coral' : 'text-foreground'}`}>{criticos}</p>
          </div>
          <div className="pt-4 sm:pt-0 sm:pl-5">
            <p className="text-sm text-brand-muted mb-1">Nivel promedio de llenado</p>
            <p className="text-3xl font-bold text-foreground">{promedio !== null ? `${promedio}%` : '—'}</p>
          </div>
        </div>

        <div className="tarjeta-vidrio tarjeta-interactiva tarjeta-entrada p-5 mb-6" style={{ animationDelay: '60ms' }}>
          <h2 className="font-semibold text-foreground mb-4">Mapa de contenedores</h2>
          {contenedoresMapa.length ? (
            <div className="overflow-hidden rounded-xl border border-brand-border">
              <MapaPanel contenedores={contenedoresMapa} editable={perfil?.rol === 'administrador'} />
            </div>
          ) : (
            <p className="text-brand-muted text-sm">Ningún contenedor tiene coordenadas registradas todavía.</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contenedores?.map((c: Contenedor, i: number) => {
            const nivel = ultimaLecturaPorContenedor.get(c.id) ?? null
            return (
              <Link
                key={c.id}
                href={`/contenedor/${c.id}`}
                className="group block tarjeta-vidrio tarjeta-interactiva tarjeta-entrada p-5"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-foreground group-hover:text-brand-emerald transition-colors">{c.codigo}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${nivelClaseTailwind(nivel)}`}>
                    {nivel !== null ? `${nivel}%` : 'Sin datos'}
                  </span>
                </div>
                <p className="text-sm text-brand-muted capitalize">{c.tipo_residuo}</p>
                <p className="text-sm text-brand-muted">{c.capacidad_litros} L · {c.estado}</p>
              </Link>
            )
          })}
        </div>

        {!contenedores?.length && (
          <p className="text-brand-muted text-center mt-10">No hay contenedores registrados todavía.</p>
        )}
      </div>
    </main>
  )
}