'use client'

import { useState } from 'react'
import MapaContenedoresWrapper from './mapa-contenedores-wrapper'
import ModalConfirmacion from './modal-confirmacion'
import Toast, { type ToastTipo } from './toast'
import { crearClienteNavegador } from '@/lib/supabase-navegador'
import { obtenerDireccion } from '@/lib/geocodificar'
import type { ContenedorMapa } from './mapa-contenedores'

type Props = {
  contenedores: ContenedorMapa[]
  editable: boolean
}

// Envuelve el mapa de solo-lectura para agregar la reubicación por arrastre
// (solo Administrador, punto A del feedback de Johanna del 12/09). No usa
// router.refresh() tras guardar — eso reconstruía el mapa completo y
// causaba el salto/parpadeo que Johanna reportó; el marcador ya queda
// donde se soltó (Leaflet lo posiciona), así que no hace falta.
export default function MapaPanel({ contenedores, editable }: Props) {
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState<{ mensaje: string; tipo: ToastTipo } | null>(null)
  const [confirmacion, setConfirmacion] = useState<{ mensaje: string } | null>(null)

  async function manejarReubicar(idsContenedores: string[], lat: number, lng: number): Promise<boolean> {
    setGuardando(true)
    const supabase = crearClienteNavegador()
    const { error } = await supabase
      .from('contenedores')
      .update({ latitud: lat, longitud: lng })
      .in('id', idsContenedores)

    if (error) {
      setGuardando(false)
      setToast({ mensaje: `No se pudo reubicar: ${error.message}`, tipo: 'error' })
      return false
    }

    const direccion = await obtenerDireccion(lat, lng)
    // El nombre de ubicación es "mejor esfuerzo" — si Nominatim no resuelve
    // nada, se deja el nombre anterior tal cual en vez de borrarlo con null.
    if (direccion) {
      await supabase.from('contenedores').update({ nombre_ubicacion: direccion }).in('id', idsContenedores)
    }
    setGuardando(false)
    setConfirmacion({
      mensaje: direccion
        ? `El punto quedó fijado en: ${direccion}.`
        : `El punto quedó fijado en las coordenadas ${lat}, ${lng} (no se pudo resolver una dirección legible).`,
    })
    return true
  }

  return (
    <>
      {editable && (
        <p className="text-xs text-brand-muted mb-2">
          Arrastra un punto para reubicarlo — se mueven los contenedores de ese punto juntos.
        </p>
      )}
      <MapaContenedoresWrapper contenedores={contenedores} editable={editable} onReubicar={manejarReubicar} />
      {guardando && <p className="text-xs text-brand-emerald mt-2">Guardando nueva ubicación…</p>}

      <ModalConfirmacion
        abierto={confirmacion !== null}
        titulo="Punto fijado"
        descripcion={confirmacion?.mensaje ?? ''}
        textoConfirmar="Entendido"
        onConfirmar={() => setConfirmacion(null)}
      />

      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={() => setToast(null)} />}
    </>
  )
}
