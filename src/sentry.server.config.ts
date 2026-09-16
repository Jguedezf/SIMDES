import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  // No envía nada si no hay DSN configurado (dev local sin cuenta de Sentry) — no rompe el arranque del servidor.
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
})
