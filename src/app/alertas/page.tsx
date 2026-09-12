import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { obtenerPerfil } from '@/lib/auth'
import BotonResolverAlerta from './boton-resolver'

type Alerta = {
  id: string
  mensaje: string | null
  canal: string
  estado: string
  creado_en: string
  contenedor_id: string
  cuadrilla_id: string | null
  contenedores: { codigo: string } | null
  cuadrillas: { nombre: string } | null
}

const estadoColor: Record<string, string> = {
  pendiente: 'bg-red-100 text-red-800',
  enviada: 'bg-yellow-100 text-yellow-800',
  resuelta: 'bg-green-100 text-green-800',
}

export default async function AlertasPage() {
  const perfil = await obtenerPerfil()

  const { data: alertas } = (await supabase
    .from('alertas')
    .select('id, mensaje, canal, estado, creado_en, contenedor_id, cuadrilla_id, contenedores(codigo), cuadrillas(nombre)')
    .order('creado_en', { ascending: false })
    .limit(50)) as { data: Alerta[] | null }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm text-blue-600 hover:underline">← Volver al panel</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">Panel de Alertas</h1>

        <div className="space-y-3">
          {alertas?.map((a) => (
            <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">{a.contenedores?.codigo ?? a.contenedor_id}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${estadoColor[a.estado] ?? 'bg-gray-100 text-gray-700'}`}>
                  {a.estado}
                </span>
              </div>
              <p className="text-sm text-gray-600">{a.mensaje}</p>
              <p className="text-xs text-gray-400 mt-2">
                {a.canal} · {a.cuadrillas?.nombre ?? 'Sin cuadrilla'} · {new Date(a.creado_en).toLocaleString('es-VE')}
              </p>
              {a.estado !== 'resuelta' &&
                (perfil?.rol === 'administrador' ||
                  (perfil?.rol === 'cuadrilla' && perfil.cuadrilla_id === a.cuadrilla_id)) && (
                  <BotonResolverAlerta alertaId={a.id} />
                )}
            </div>
          ))}
        </div>

        {!alertas?.length && <p className="text-gray-400 text-center mt-10">No hay alertas registradas todavía.</p>}
      </div>
    </main>
  )
}