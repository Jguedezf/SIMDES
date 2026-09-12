'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import MapaContenedoresWrapper from './mapa-contenedores-wrapper'
import Toast, { type ToastTipo } from './toast'
import { crearClienteNavegador } from '@/lib/supabase-navegador'
import type { ContenedorMapa } from './mapa-contenedores'

type Props = {
  contenedores: ContenedorMapa[]
  editable: boolean
}

// Envuelve el mapa de solo-lectura para agregar la reubicación por arrastre
// (solo Administrador, punto A del feedback de Johanna del 12/09): guarda
// la nueva coordenada de los N contenedores del punto arrastrado y refresca
// los datos del servidor al terminar.
export default function MapaPanel({ contenedores, editable }: Props) {
  const router = useRouter()
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState<{ mensaje: string; tipo: ToastTipo } | null>(null)

  async function manejarReubicar(idsContenedores: string[], lat: number, lng: number) {
    setGuardando(true)
    const supabase = crearClienteNavegador()
    const { error } = await supabase
      .from('contenedores')
      .update({ latitud: lat, longitud: lng })
      .in('id', idsContenedores)
    setGuardando(false)

    if (error) {
      setToast({ mensaje: `No se pudo reubicar: ${error.message}`, tipo: 'error' })
    } else {
      setToast({ mensaje: 'Punto reubicado correctamente.', tipo: 'exito' })
      router.refresh()
    }
  }

  return (
    <>
      {editable && (
        <p className="text-xs text-brand-muted mb-2">
          Arrastra un punto para reubicarlo — se mueven los {contenedores.length ? 'contenedores de ese punto' : 'contenedores'} juntos.
        </p>
      )}
      <MapaContenedoresWrapper contenedores={contenedores} editable={editable} onReubicar={manejarReubicar} />
      {guardando && <p className="text-xs text-brand-emerald mt-2">Guardando nueva ubicación…</p>}
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={() => setToast(null)} />}
    </>
  )
}
