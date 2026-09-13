import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { obtenerPerfil } from '@/lib/auth'
import Navbar from '@/components/navbar'
import DetalleContenedorCliente, { type Contenedor, type Lectura, type Prediccion } from './detalle-cliente'

export default async function DetalleContenedorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const perfil = await obtenerPerfil()

  // Las 3 consultas son independientes entre sí — se piden en paralelo en vez
  // de una tras otra (waterfall), que era como estaba antes en el cliente.
  const [{ data: contenedor }, { data: lecturas }, { data: prediccion }] = await Promise.all([
    supabase
      .from('contenedores')
      .select('id, codigo, tipo_residuo, capacidad_litros, estado, zona_tipo, eliminado_en')
      .eq('id', id)
      .single(),
    supabase
      .from('lecturas_sensor')
      .select('nivel_pct, timestamp')
      .eq('contenedor_id', id)
      .order('timestamp', { ascending: true })
      .limit(20),
    supabase
      .from('predicciones')
      .select('nivel_riesgo, horas_estimadas_saturacion, modelo_ia, generado_en')
      .eq('contenedor_id', id)
      .order('generado_en', { ascending: false })
      .limit(1)
      .single(),
  ])

  if (!contenedor) notFound()

  return (
    <>
      <Navbar />
      <DetalleContenedorCliente
        contenedorInicial={contenedor as Contenedor}
        lecturasIniciales={(lecturas ?? []) as Lectura[]}
        prediccionInicial={(prediccion as Prediccion | null) ?? null}
        esAdministrador={perfil?.rol === 'administrador'}
      />
    </>
  )
}
