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

const estadoClase: Record<string, string> = {
  pendiente: 'bg-brand-coral/15 text-brand-coral',
  enviada: 'bg-brand-amber/15 text-brand-amber',
  resuelta: 'bg-brand-emerald/15 text-brand-emerald',
}

export default async function AlertasPage() {
  const perfil = await obtenerPerfil()

  const { data: alertas } = (await supabase
    .from('alertas')
    .select('id, mensaje, canal, estado, creado_en, contenedor_id, cuadrilla_id, contenedores(codigo), cuadrillas(nombre)')
    .order('creado_en', { ascending: false })
    .limit(50)) as { data: Alerta[] | null }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm text-brand-emerald hover:underline">← Volver al panel</Link>
        <h1 className="text-2xl font-bold text-foreground mt-2 mb-6">Panel de Alertas</h1>

        <div className="space-y-3">
          {alertas?.map((a) => (
            <div key={a.id} className="tarjeta-interactiva tarjeta-vidrio p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground font-mono">{a.contenedores?.codigo ?? a.contenedor_id}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${estadoClase[a.estado] ?? 'bg-brand-border text-brand-muted'}`}>
                  {a.estado}
                </span>
              </div>
              <p className="text-sm text-brand-muted">{a.mensaje}</p>
              <p className="text-xs text-brand-muted/70 mt-2">
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

        {!alertas?.length && <p className="text-brand-muted text-center mt-10">No hay alertas registradas todavía.</p>}
      </div>
    </main>
  )
}
