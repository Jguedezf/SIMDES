'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearClienteNavegador } from '@/lib/supabase-navegador'
import ModalConfirmacion from '@/components/modal-confirmacion'

// Solo Administrador y Directiva. La autorización real la impone la función
// `reabrir_alerta` en la base de datos (SECURITY DEFINER con chequeo de rol);
// este botón únicamente evita mostrar la opción a quien no puede usarla.
export default function BotonReabrirAlerta({ alertaId }: { alertaId: string }) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function reabrir() {
    setGuardando(true)
    setError('')
    const supabase = crearClienteNavegador()
    const { error } = await supabase.rpc('reabrir_alerta', { alerta_id: alertaId })
    if (error) {
      setError(error.code === '42501' ? 'No tienes permiso para reabrir esta alerta.' : `No se pudo reabrir: ${error.message}`)
      setGuardando(false)
      setConfirmando(false)
      return
    }
    setGuardando(false)
    setConfirmando(false)
    router.refresh()
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setConfirmando(true)}
        className="boton-pill text-xs font-semibold text-brand-amber border border-brand-amber/40 px-3 py-1 hover:bg-brand-amber/10"
      >
        Reabrir alerta
      </button>
      {error && <p className="text-xs text-brand-coral mt-1">{error}</p>}
      <ModalConfirmacion
        abierto={confirmando}
        titulo="¿Reabrir esta alerta?"
        descripcion="La alerta volverá al estado pendiente y se borrará su hora de resolución. Úsalo solo si se marcó como resuelta por error."
        textoConfirmar="Sí, reabrir"
        cargando={guardando}
        onConfirmar={reabrir}
        onCancelar={() => setConfirmando(false)}
      />
    </div>
  )
}
