'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearClienteNavegador } from '@/lib/supabase-navegador'

export default function BotonResolverAlerta({ alertaId }: { alertaId: string }) {
  const router = useRouter()
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
      return
    }

    router.refresh()
  }

  return (
    <div className="mt-2">
      <button
        onClick={resolver}
        disabled={guardando}
        className="text-xs font-semibold text-green-700 border border-green-300 rounded-lg px-2.5 py-1 hover:bg-green-50 disabled:opacity-50"
      >
        {guardando ? 'Guardando...' : 'Marcar resuelta'}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
