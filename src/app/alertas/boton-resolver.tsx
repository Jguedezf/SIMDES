'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearClienteNavegador } from '@/lib/supabase-navegador'
import ModalConfirmacion from '@/components/modal-confirmacion'

export default function BotonResolverAlerta({ alertaId }: { alertaId: string }) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function resolver() {
    setGuardando(true)
    setError('')

    const supabase = crearClienteNavegador()
    const { error } = await supabase
      .from('alertas')
      .update({ estado: 'resuelta', resuelto_en: new Date().toISOString() })
      .eq('id', alertaId)

    if (error) {
      setError(
        error.code === '42501'
          ? 'No tienes permiso para resolver esta alerta.'
          : `No se pudo actualizar: ${error.message}`
      )
      setGuardando(false)
      setConfirmando(false)
      return
    }

    router.refresh()
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setConfirmando(true)}
        className="text-xs font-semibold text-brand-emerald border border-brand-emerald/40 rounded-lg px-2.5 py-1 hover:bg-brand-emerald/10 transition"
      >
        Marcar resuelta
      </button>
      {error && <p className="text-xs text-brand-coral mt-1">{error}</p>}

      <ModalConfirmacion
        abierto={confirmando}
        titulo="¿Marcar alerta como resuelta?"
        descripcion="Confirma que el contenedor ya fue atendido en el terreno. Esta acción queda registrada con la hora actual."
        textoConfirmar="Sí, marcar resuelta"
        cargando={guardando}
        onConfirmar={resolver}
        onCancelar={() => setConfirmando(false)}
      />
    </div>
  )
}
