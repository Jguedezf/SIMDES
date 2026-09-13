// Formato del código: PL-{número de punto, 3 dígitos}-{zona}-{tipo}.
// "PL" = punto limpio (término del planteamiento original del proyecto).
// La letra de tipo de residuo sigue la convención de color COVENIN 3838
// (Y=Amarillo/plástico, A=Azul/papel, V=Verde/vidrio, M=Marrón/orgánico),
// sin tocar. La zona es una extensión propia de SIMDES, en un segmento
// aparte para no chocar con esa letra (ej. "V" de Vidrio vs. una eventual
// zona "V"). Acordado con Johanna el 2026-09-12.
export type ZonaTipo = 'via_publica' | 'comercial'
export type TipoResiduo = 'plastico' | 'papel' | 'vidrio' | 'organico'

export const ZONA_LETRA: Record<ZonaTipo, string> = {
  via_publica: 'R',
  comercial: 'C',
}

export const ZONA_ETIQUETA: Record<ZonaTipo, string> = {
  via_publica: 'Vía pública / residencial',
  comercial: 'Comercial',
}

export const TIPO_LETRA: Record<TipoResiduo, string> = {
  plastico: 'Y',
  papel: 'A',
  vidrio: 'V',
  organico: 'M',
}

// El valor de `tipo_residuo` en la base de datos va sin tilde (CHECK
// constraint: 'plastico'/'organico', no 'plástico'/'orgánico') — es el valor
// correcto de almacenamiento, no un error. El error real (encontrado el
// 13/09) era imprimir ese valor crudo en pantalla en vez de pasarlo por una
// etiqueta de presentación: el popup del mapa, la tarjeta del dashboard y el
// detalle de contenedor mostraban "Plastico"/"Organico" sin tilde. Única
// fuente de la etiqueta correcta — antes existía una copia local solo en
// /contenedores, duplicándose (y pudiendo desincronizarse) en cada pantalla
// nueva que necesitara mostrar el tipo.
export const TIPO_ETIQUETA: Record<TipoResiduo, string> = {
  plastico: 'Plástico',
  papel: 'Papel',
  vidrio: 'Vidrio',
  organico: 'Orgánico',
}

export function generarCodigo(numeroPunto: number, zona: ZonaTipo, tipo: TipoResiduo) {
  return `PL-${String(numeroPunto).padStart(3, '0')}-${ZONA_LETRA[zona]}-${TIPO_LETRA[tipo]}`
}
