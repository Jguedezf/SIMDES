import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Contenedor = {
  id: string
  codigo: string
  tipo_residuo: string
  capacidad_litros: number
  estado: string
}

type Lectura = {
  contenedor_id: string
  nivel_pct: number
  timestamp: string
}

function nivelColor(nivel: number | null) {
  if (nivel === null) return 'bg-gray-300 text-gray-700'
  if (nivel >= 85) return 'bg-red-500 text-white'
  if (nivel >= 50) return 'bg-yellow-400 text-gray-900'
  return 'bg-green-500 text-white'
}

export default async function DashboardPage() {
  const { data: contenedores } = await supabase
    .from('contenedores')
    .select('id, codigo, tipo_residuo, capacidad_litros, estado')
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

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">SIMDES — Panel de Contenedores</h1>
            <p className="text-gray-500">Estado actual de llenado por contenedor</p>
          </div>
          <Link href="/alertas" className="text-sm font-semibold text-blue-600 hover:underline">
            Ver alertas →
          </Link>
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
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${nivelColor(nivel)}`}>
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