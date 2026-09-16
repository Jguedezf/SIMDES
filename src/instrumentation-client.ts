import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  // No envía nada si no hay DSN configurado (dev local sin cuenta de Sentry) — no rompe el arranque del cliente.
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
