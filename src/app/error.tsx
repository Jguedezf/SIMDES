'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function ErrorBoundary({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="tarjeta-vidrio p-6 max-w-sm text-center">
        <h2 className="text-lg font-bold text-foreground mb-1">Algo salió mal</h2>
        <p className="text-sm text-brand-muted mb-5">
          El error ya fue registrado automáticamente. Puedes intentar de nuevo.
        </p>
        <button
          onClick={() => retry()}
          className="boton-pill bg-brand-emerald text-brand-bg text-sm font-semibold px-5 py-2 hover:brightness-110"
        >
          Intentar de nuevo
        </button>
      </div>
    </main>
  )
}
