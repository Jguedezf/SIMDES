'use client'

import { useEffect } from 'react'

export type ToastTipo = 'exito' | 'error'

type Props = {
  mensaje: string
  tipo?: ToastTipo
  onCerrar: () => void
  duracionMs?: number
}

// Notificación no bloqueante para confirmar que una acción terminó (ej.
// "PDF generado") — punto de feedback de exportación del 12/09, reutilizable
// para cualquier otra confirmación breve.
export default function Toast({ mensaje, tipo = 'exito', onCerrar, duracionMs = 3500 }: Props) {
  useEffect(() => {
    const id = setTimeout(onCerrar, duracionMs)
    return () => clearTimeout(id)
  }, [onCerrar, duracionMs])

  return (
    <div className="fixed bottom-5 right-5 z-50 toast-entrada">
      <div
        className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 shadow-2xl text-sm font-medium ${
          tipo === 'exito'
            ? 'bg-brand-surface border-brand-emerald/40 text-foreground'
            : 'bg-brand-surface border-brand-coral/40 text-foreground'
        }`}
      >
        <span aria-hidden className={tipo === 'exito' ? 'text-brand-emerald' : 'text-brand-coral'}>
          {tipo === 'exito' ? '✓' : '⚠'}
        </span>
        {mensaje}
      </div>
    </div>
  )
}
