export const NIVEL_UMBRAL_ALTO = 85
export const NIVEL_UMBRAL_MEDIO = 50

export function nivelClaseTailwind(nivel: number | null) {
  if (nivel === null) return 'bg-gray-300 text-gray-700'
  if (nivel >= NIVEL_UMBRAL_ALTO) return 'bg-red-500 text-white'
  if (nivel >= NIVEL_UMBRAL_MEDIO) return 'bg-yellow-400 text-gray-900'
  return 'bg-green-500 text-white'
}

export function nivelColorHex(nivel: number | null) {
  if (nivel === null) return '#d1d5db'
  if (nivel >= NIVEL_UMBRAL_ALTO) return '#ef4444'
  if (nivel >= NIVEL_UMBRAL_MEDIO) return '#facc15'
  return '#22c55e'
}
