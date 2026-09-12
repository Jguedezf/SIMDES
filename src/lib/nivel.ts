export const NIVEL_UMBRAL_ALTO = 85
export const NIVEL_UMBRAL_MEDIO = 50

export function nivelClaseTailwind(nivel: number | null) {
  if (nivel === null) return 'bg-brand-border text-brand-muted'
  if (nivel >= NIVEL_UMBRAL_ALTO) return 'bg-brand-coral text-white'
  if (nivel >= NIVEL_UMBRAL_MEDIO) return 'bg-brand-amber text-brand-bg'
  return 'bg-brand-emerald text-brand-bg'
}

export function nivelColorHex(nivel: number | null) {
  if (nivel === null) return '#4B4B6B'
  if (nivel >= NIVEL_UMBRAL_ALTO) return '#EF4444'
  if (nivel >= NIVEL_UMBRAL_MEDIO) return '#F59E0B'
  return '#00D4AA'
}
