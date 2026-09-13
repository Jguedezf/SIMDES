import { notFound } from 'next/navigation'
import { exigirRol } from '@/lib/auth'
import { crearClienteServidor } from '@/lib/supabase-servidor'
import Navbar from '@/components/navbar'
import FondoPantalla from '@/components/fondo-pantalla'
import DetalleIncidenciaCliente, { type Incidencia } from './detalle-cliente'

export default async function DetalleIncidenciaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const perfil = await exigirRol('administrador')
  const supabase = await crearClienteServidor()

  const [{ data: incidencia }, { data: perfiles }] = await Promise.all([
    supabase
      .from('incidencias_software')
      .select('id, titulo, descripcion, pasos_reproducir, modulo, severidad, factor_calidad, estado, reportado_por, asignado_a, resuelto_por, resolucion, creado_en, resuelto_en')
      .eq('id', id)
      .single(),
    supabase.from('perfiles').select('id, nombre').eq('rol', 'administrador'),
  ])

  if (!incidencia) notFound()

  const nombrePorId: Record<string, string> = {}
  perfiles?.forEach((p) => { nombrePorId[p.id] = p.nombre ?? 'Administrador' })

  return (
    <div className="relative">
      <FondoPantalla nombre="incidencias" alt="Fondo del detalle de incidencia" />
      <Navbar />
      <DetalleIncidenciaCliente
        incidenciaInicial={incidencia as Incidencia}
        nombrePorId={nombrePorId}
        miId={perfil.id}
      />
    </div>
  )
}
