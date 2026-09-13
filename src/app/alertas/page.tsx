import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { obtenerPerfil } from '@/lib/auth'
import Navbar from '@/components/navbar'
import FondoPantalla from '@/components/fondo-pantalla'
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

const ESTADOS_ALERTA = ['pendiente', 'enviada', 'resuelta'] as const
const estadoEtiqueta: Record<string, string> = { pendiente: 'Pendientes', enviada: 'Enviadas', resuelta: 'Resueltas' }

type BusquedaParams = { estado?: string }

export default async function AlertasPage({ searchParams }: { searchParams: Promise<BusquedaParams> }) {
  const [perfil, sp] = await Promise.all([obtenerPerfil(), searchParams])

  // El filtro viene de la URL — se valida contra la lista real antes de
  // usarlo, mismo patrón ya usado en /contenedores (no es dato de confianza
  // solo porque el link que lo generó ofrezca únicamente estos 3 valores).
  const estado = ESTADOS_ALERTA.find((e) => e === sp.estado)

  let consulta = supabase
    .from('alertas')
    .select('id, mensaje, canal, estado, creado_en, contenedor_id, cuadrilla_id, contenedores(codigo), cuadrillas(nombre)')
    .order('creado_en', { ascending: false })
    .limit(50)
  if (estado) consulta = consulta.eq('estado', estado)

  const { data: alertas } = (await consulta) as { data: Alerta[] | null }

  return (
    <main className="min-h-screen relative">
      <FondoPantalla nombre="alertas" alt="Fondo del panel de alertas" />
      <Navbar />
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <h1 className="text-2xl font-bold text-foreground">Panel de Alertas</h1>
          {estado && (
            <Link href="/alertas" className="text-xs font-semibold text-brand-muted hover:text-brand-emerald px-3 py-1.5 rounded-full border border-brand-border">
              Quitar filtro: {estadoEtiqueta[estado]} ✕
            </Link>
          )}
        </div>

        <div className="space-y-3">
          {alertas?.map((a, i) => (
            <div
              key={a.id}
              className="tarjeta-vidrio tarjeta-interactiva tarjeta-entrada p-4"
              style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}
            >
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

        {!alertas?.length && (
          <p className="text-brand-muted text-center mt-10">
            {estado ? `No hay alertas ${estadoEtiqueta[estado].toLowerCase()} todavía.` : 'No hay alertas registradas todavía.'}
          </p>
        )}
      </div>
    </main>
  )
}
