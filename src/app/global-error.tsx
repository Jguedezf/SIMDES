'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

// global-error reemplaza el layout raíz cuando se activa, por eso define su
// propio <html>/<body> y usa estilos inline en vez de las clases de Tailwind
// del layout normal (globals.css no se garantiza cargado en este punto).
export default function GlobalError({
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
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0D0D0D',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
          padding: '1.5rem',
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Ocurrió un error inesperado
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            El equipo ya fue notificado automáticamente. Puedes intentar de nuevo o volver más tarde.
          </p>
          <button
            onClick={() => retry()}
            style={{
              background: '#00D4AA',
              color: '#0D0D0D',
              border: 'none',
              borderRadius: '999px',
              padding: '0.625rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  )
}
