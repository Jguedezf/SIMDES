import { supabase } from '@/lib/supabase'
import { nivelClaseTailwind } from '@/lib/nivel'
import MapaPanel from '@/components/mapa-panel'
import Link from 'next/link'
import { obtenerPerfil } from '@/lib/auth'
import Navbar from '@/components/navbar'
import HeroLanding from '@/components/hero-landing'
import { TIPO_ETIQUETA, type TipoResiduo } from '@/lib/codigo-contenedor'

type Contenedor = {
  id: string
  codigo: string
  tipo_residuo: string
  capacidad_litros: number
  estado: string
  latitud: number | string | null
  longitud: number | string | null
  numero_punto: number
  nombre_ubicacion: string | null
}

type Lectura = {
  contenedor_id: string
  nivel_pct: number
  timestamp: string
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ acceso?: string }> }) {
  const sp = await searchParams
  // Perfil + las 2 consultas de datos son independientes entre sí — se piden
  // en paralelo en vez de esperar cada una por turno (waterfall).
  const [perfil, { data: contenedores }, { data: lecturas }] = await Promise.all([
    obtenerPerfil(),
    supabase
      .from('contenedores')
      .select('id, codigo, tipo_residuo, capacidad_litros, estado, latitud, longitud, numero_punto, nombre_ubicacion')
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
      numero_punto: c.numero_punto,
      nombre_ubicacion: c.nombre_ubicacion,
    }))

  // Antes se contaba por coincidencia exacta de lat/lng (frágil: dependía de
  // que las 4 filas de una isla tuvieran los mismos decimales). Ahora se
  // cuenta por `numero_punto`, la columna explícita que identifica la isla.
  const puntosUnicos = new Set(contenedoresMapa.map((c) => c.numero_punto)).size
  // Bug real encontrado el 13/09 cruzando "En nivel crítico" contra el
  // filtro ?nivel=critico de /contenedores (9 vs 8): esto tomaba TODOS los
  // niveles de la vista ultima_lectura_por_contenedor sin importar si el
  // contenedor seguía existiendo o estaba eliminado lógicamente — un
  // contenedor eliminado con una lectura crítica vieja seguía sumando al
  // conteo del dashboard aunque ya no apareciera en ningún listado. Ahora
  // se cruza contra `contenedores` (ya filtrado por eliminado_en is null),
  // el mismo conjunto que ya se usa para "Puntos monitoreados".
  const nivelesConocidos = (contenedores ?? [])
    .map((c: Contenedor) => ultimaLecturaPorContenedor.get(c.id))
    .filter((n): n is number => n !== undefined)
  const criticos = nivelesConocidos.filter((n) => n >= 85).length
  const promedio = nivelesConocidos.length
    ? Math.round(nivelesConocidos.reduce((suma, n) => suma + n, 0) / nivelesConocidos.length)
    : null

  return (
    <main className="min-h-screen">
      <Navbar />

      {!perfil && <HeroLanding puntosMonitoreados={puntosUnicos} nivelPromedio={promedio} />}

      <div className="max-w-6xl mx-auto px-6 py-8">
        {sp.acceso === 'denegado' && (
          <p role="alert" className="mb-4 rounded-xl border border-brand-amber/40 bg-brand-amber/10 px-4 py-3 text-sm text-brand-amber">
            Tu rol no tiene acceso a esa pantalla.
          </p>
        )}
        {/* Antes eran 3 <div> estáticos, desconectados de todo — feedback de
            Johanna (13/09): quiere que cada una "se separe" a su propia
            vista, no un número fijo. Cada una lleva a un destino coherente
            con lo que cuenta (no todas al mismo listado genérico):
            "Puntos monitoreados" es la ancla al mapa (un marcador por punto,
            el análogo real de "puntos" — /contenedores lista contenedores
            individuales, una granularidad distinta); "En nivel crítico"
            lleva al filtro real ?nivel=critico en /contenedores; "Nivel
            promedio" lleva a /reportes, donde ese promedio se ve como
            tendencia histórica, no como un registro suelto. */}
        <div className="tarjeta-vidrio tarjeta-entrada mb-6 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-brand-border overflow-hidden">
          <a href="#mapa" className="p-5 pb-4 sm:pb-5 transition hover:bg-white/5">
            <p className="text-sm text-brand-muted mb-1">Puntos monitoreados</p>
            <p className="text-3xl font-bold text-foreground">{puntosUnicos}</p>
          </a>
          <Link href="/contenedores?nivel=critico" className="p-5 py-4 sm:py-5 transition hover:bg-white/5">
            <p className="text-sm text-brand-muted mb-1">En nivel crítico (≥85%)</p>
            <p className={`text-3xl font-bold ${criticos > 0 ? 'text-brand-coral' : 'text-foreground'}`}>{criticos}</p>
          </Link>
          {perfil?.rol === 'administrador' || perfil?.rol === 'directiva' ? (
            <Link href="/reportes" className="p-5 pt-4 sm:pt-5 transition hover:bg-white/5">
              <p className="text-sm text-brand-muted mb-1">Nivel promedio de llenado</p>
              <p className="text-3xl font-bold text-foreground">{promedio !== null ? `${promedio}%` : '—'}</p>
            </Link>
          ) : (
            <div className="p-5 pt-4 sm:pt-5">
              <p className="text-sm text-brand-muted mb-1">Nivel promedio de llenado</p>
              <p className="text-3xl font-bold text-foreground">{promedio !== null ? `${promedio}%` : '—'}</p>
            </div>
          )}
        </div>

        <div id="mapa" className="tarjeta-vidrio tarjeta-interactiva tarjeta-entrada p-5 mb-6 scroll-mt-20" style={{ animationDelay: '60ms' }}>
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
                <p className="text-sm text-brand-muted">{TIPO_ETIQUETA[c.tipo_residuo as TipoResiduo] ?? c.tipo_residuo}</p>
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