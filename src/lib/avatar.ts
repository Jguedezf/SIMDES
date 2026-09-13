// Compartido entre /perfil y el navbar (13/09) — antes cada uno tenía su
// propia copia de esta lógica; extraído para no duplicarla por segunda vez.
export const ROL_COLOR_AVATAR: Record<string, string> = {
  administrador: 'bg-brand-violet',
  directiva: 'bg-brand-emerald',
  cuadrilla: 'bg-brand-amber',
}

export function iniciales(nombre: string | null, rol: string) {
  const partes = (nombre ?? '').trim().split(/\s+/).filter(Boolean)
  if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase()
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return rol.slice(0, 2).toUpperCase()
}
