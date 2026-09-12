import type { TipoResiduo, ZonaTipo } from './codigo-contenedor'

// Tamaños válidos (litros) por zona y tipo de residuo, norma EN 840 (ya
// citada en el informe para los contenedores HDPE). El orgánico usa un
// escalón mayor en ambas zonas por su mayor volumen de generación —
// consistente con los datos reales ya cargados (2400L en vía pública) y con
// la investigación de fuentes del 2026-09-12 (ver memoria del proyecto).
// El primer valor de cada lista es el tamaño recomendado/por defecto.
export const TAMANOS_VALIDOS: Record<ZonaTipo, Record<TipoResiduo, number[]>> = {
  via_publica: {
    plastico: [1100, 1700],
    papel: [1100, 1700],
    vidrio: [1100, 1700],
    organico: [2400, 3200],
  },
  comercial: {
    plastico: [2400, 3200],
    papel: [2400, 3200],
    vidrio: [2400, 3200],
    organico: [3200, 5000],
  },
}

export function tamanoPorDefecto(zona: ZonaTipo, tipo: TipoResiduo) {
  return TAMANOS_VALIDOS[zona][tipo][0]
}
