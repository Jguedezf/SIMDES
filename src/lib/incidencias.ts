// Registro de defectos del software SIMDES (no operativo/ciudadano — ver
// docs/INFORME-FINAL.md sección 9.3.1.2/incidencias). Los valores en base de
// datos van sin tilde (mismo motivo que TIPO_ETIQUETA en codigo-contenedor.ts:
// evitar el bug real del 13/09 de imprimir el valor crudo de almacenamiento
// en vez de pasarlo por una etiqueta de presentación) — única fuente de las
// etiquetas correctas, no duplicar en cada pantalla.
export type Severidad = 'baja' | 'media' | 'alta' | 'critica'
export type EstadoIncidencia = 'abierta' | 'en_proceso' | 'cerrada' | 'descartada'
export type FactorCalidad =
  | 'correccion' | 'fiabilidad' | 'eficiencia' | 'integridad' | 'usabilidad'
  | 'mantenibilidad' | 'flexibilidad' | 'testabilidad' | 'portabilidad'
  | 'reusabilidad' | 'interoperabilidad'

export const SEVERIDADES: Severidad[] = ['baja', 'media', 'alta', 'critica']
export const ESTADOS_INCIDENCIA: EstadoIncidencia[] = ['abierta', 'en_proceso', 'cerrada', 'descartada']
export const FACTORES_CALIDAD: FactorCalidad[] = [
  'correccion', 'fiabilidad', 'eficiencia', 'integridad', 'usabilidad',
  'mantenibilidad', 'flexibilidad', 'testabilidad', 'portabilidad',
  'reusabilidad', 'interoperabilidad',
]

export const SEVERIDAD_ETIQUETA: Record<Severidad, string> = {
  baja: 'Baja', media: 'Media', alta: 'Alta', critica: 'Crítica',
}

export const ESTADO_INCIDENCIA_ETIQUETA: Record<EstadoIncidencia, string> = {
  abierta: 'Abierta', en_proceso: 'En proceso', cerrada: 'Cerrada', descartada: 'Descartada',
}

// Mismos 11 factores de calidad de Pressman/McCall ya documentados en
// docs/INFORME-FINAL.md sección 4.8 — cada incidencia puede vincularse al
// factor que viola, conectando el registro en vivo con ese análisis.
export const FACTOR_CALIDAD_ETIQUETA: Record<FactorCalidad, string> = {
  correccion: 'Corrección', fiabilidad: 'Fiabilidad', eficiencia: 'Eficiencia',
  integridad: 'Integridad', usabilidad: 'Usabilidad', mantenibilidad: 'Mantenibilidad',
  flexibilidad: 'Flexibilidad', testabilidad: 'Testabilidad', portabilidad: 'Portabilidad',
  reusabilidad: 'Reusabilidad', interoperabilidad: 'Interoperabilidad',
}

export const SEVERIDAD_CLASE: Record<Severidad, string> = {
  baja: 'bg-brand-emerald text-brand-bg',
  media: 'bg-brand-amber text-brand-bg',
  alta: 'bg-orange-500 text-white',
  critica: 'bg-brand-coral text-white',
}

export const ESTADO_INCIDENCIA_CLASE: Record<EstadoIncidencia, string> = {
  abierta: 'bg-brand-coral text-white',
  en_proceso: 'bg-brand-amber text-brand-bg',
  cerrada: 'bg-brand-emerald text-brand-bg',
  descartada: 'bg-brand-border text-brand-muted',
}
