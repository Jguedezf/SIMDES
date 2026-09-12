import { supabase } from '@/lib/supabase'
import { nivelClaseTailwind } from '@/lib/nivel'
import MapaContenedoresWrapper from '@/components/mapa-contenedores-wrapper'
import Link from 'next/link'
import { obtenerPerfil } from '@/lib/auth'
import { cerrarSesion } from '@/app/login/actions'

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
  const perfil = await obtenerPerfil()

  const { data: contenedores } = await supabase
    .from('contenedores')
    .select('id, codigo, tipo_residuo, capacidad_litros, estado, latitud, longitud')
    .order('codigo')

  const { data: lecturas } = await supabase
    .from('lecturas_sensor')
    .select('contenedor_id, nivel_pct, timestamp')
    .order('timestamp', { ascending: false })

  const ultimaLecturaPorContenedor = new Map<string, number>()
  lecturas?.forEach((l: Lectura) => {
    if (!ultimaLecturaPorContenedor.has(l.contenedor_id)) {
      ultimaLecturaPorContenedor.set(l.contenedor_id, l.nivel_pct)
    }
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

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="SIMDES" className="h-14 w-auto shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Panel de Contenedores</h1>
              <p className="text-gray-500">Estado actual de llenado por contenedor</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {perfil?.rol === 'administrador' && (
              <Link href="/contenedores/nuevo" className="text-sm font-semibold text-blue-600 hover:underline">
                + Registrar contenedor
              </Link>
            )}
            {(perfil?.rol === 'administrador' || perfil?.rol === 'directiva') && (
              <Link href="/reportes" className="text-sm font-semibold text-blue-600 hover:underline">
                Reportes →
              </Link>
            )}
            <Link href="/alertas" className="text-sm font-semibold text-blue-600 hover:underline">
              Ver alertas →
            </Link>
            <Link href="/sensor" className="text-sm font-semibold text-blue-600 hover:underline">
              Especificaciones del sensor
            </Link>
            {perfil ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{perfil.email} · {perfil.rol}</span>
                <form action={cerrarSesion}>
                  <button type="submit" className="font-semibold text-blue-600 hover:underline">
                    Cerrar sesión
                  </button>
                </form>
              </div>
            ) : (
              <Link href="/login" className="text-sm font-semibold text-blue-600 hover:underline">
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Mapa de contenedores</h2>
          {contenedoresMapa.length ? (
            <MapaContenedoresWrapper contenedores={contenedoresMapa} />
          ) : (
            <p className="text-gray-400 text-sm">Ningún contenedor tiene coordenadas registradas todavía.</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contenedores?.map((c: Contenedor) => {
            const nivel = ultimaLecturaPorContenedor.get(c.id) ?? null
            return (
              <Link
                key={c.id}
                href={`/contenedor/${c.id}`}
                className="block bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-900">{c.codigo}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${nivelClaseTailwind(nivel)}`}>
                    {nivel !== null ? `${nivel}%` : 'Sin datos'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 capitalize">{c.tipo_residuo}</p>
                <p className="text-sm text-gray-500">{c.capacidad_litros} L · {c.estado}</p>
              </Link>
            )
          })}
        </div>

        {!contenedores?.length && (
          <p className="text-gray-400 text-center mt-10">No hay contenedores registrados todavía.</p>
        )}
      </div>
    </main>
  )
}