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

const PATRON_CODIGO = /^PL-(\d{3})-[RC]-[YAVM]$/

export function generarCodigo(numeroPunto: number, zona: ZonaTipo, tipo: TipoResiduo) {
  return `PL-${String(numeroPunto).padStart(3, '0')}-${ZONA_LETRA[zona]}-${TIPO_LETRA[tipo]}`
}

// Calcula el siguiente número de punto disponible a partir de los códigos
// ya existentes (formato PL-00N-Z-T). Si ninguno matchea, empieza en 1.
export function siguienteNumeroPunto(codigosExistentes: string[]): number {
  const numeros = codigosExistentes
    .map((c) => c.match(PATRON_CODIGO)?.[1])
    .filter((n): n is string => Boolean(n))
    .map(Number)

  return numeros.length ? Math.max(...numeros) + 1 : 1
}
