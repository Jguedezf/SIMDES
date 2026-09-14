export type RangoPreset = 'hoy' | 'semana' | 'mes' | 'custom'

export type Rango = {
  desde: Date
  hasta: Date
  preset: RangoPreset
  etiqueta: string
}

function medianoche(fecha: Date) {
  const d = new Date(fecha)
  d.setHours(0, 0, 0, 0)
  return d
}

function finDelDia(fecha: Date) {
  const d = new Date(fecha)
  d.setHours(23, 59, 59, 999)
  return d
}

function formatoCorto(fecha: Date) {
  return fecha.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Calcula el rango de fechas para /reportes a partir de los query params de
// la URL (?rango=hoy|semana|mes|custom&desde=YYYY-MM-DD&hasta=YYYY-MM-DD).
// Sin params, por defecto muestra la última semana — un reporte histórico
// real, no solo el instante actual (pedido de Johanna, 12/09).
export function calcularRango(sp: { rango?: string; desde?: string; hasta?: string }): Rango {
  const hoy = new Date()

  if (sp.rango === 'custom' && sp.desde && sp.hasta) {
    const desde = medianoche(new Date(`${sp.desde}T00:00:00`))
    const hasta = finDelDia(new Date(`${sp.hasta}T00:00:00`))
    if (!isNaN(desde.getTime()) && !isNaN(hasta.getTime()) && desde <= hasta) {
      return { desde, hasta, preset: 'custom', etiqueta: `${formatoCorto(desde)} al ${formatoCorto(hasta)}` }
    }
  }

  const presetValido: RangoPreset = sp.rango === 'hoy' || sp.rango === 'mes' ? sp.rango : 'semana'

  if (presetValido === 'hoy') {
    return { desde: medianoche(hoy), hasta: finDelDia(hoy), preset: 'hoy', etiqueta: 'hoy' }
  }
  if (presetValido === 'mes') {
    const desde = medianoche(hoy)
    desde.setDate(desde.getDate() - 29)
    return { desde, hasta: finDelDia(hoy), preset: 'mes', etiqueta: 'últimos 30 días' }
  }
  const desde = medianoche(hoy)
  desde.setDate(desde.getDate() - 6)
  return { desde, hasta: finDelDia(hoy), preset: 'semana', etiqueta: 'últimos 7 días' }
}

// Genera la lista de días (como 'YYYY-MM-DD') entre desde y hasta, inclusive
// — incluye días sin datos para que el historial no tenga huecos visuales.
export function diasDelRango(desde: Date, hasta: Date): string[] {
  const dias: string[] = []
  const cursor = medianoche(desde)
  const limite = medianoche(hasta)
  while (cursor <= limite) {
    dias.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dias
}

// Clave de día para agrupar un timestamp real (ej. `alertas.creado_en`) en el
// mismo esquema que `diasDelRango` — hay que pasar por `medianoche()` (zona
// horaria del proceso) en vez de recortar el string ISO crudo (`slice(0,10)`,
// siempre UTC). Si el proceso corre en una zona con offset (ej. desarrollo
// local en Venezuela, UTC-4) y se usaran los dos métodos a la vez, una
// alerta creada entre las 20:00 y 23:59 hora local cae en el día UTC
// siguiente — su clave no coincidiría con ningún día de `diasDelRango` y
// desaparecería en silencio del historial diario (aunque sí sigue contando
// en los totales, que no dependen de esta agrupación). Encontrado el 14/09
// con datos reales del propio piloto.
export function claveDia(fecha: Date): string {
  return medianoche(fecha).toISOString().slice(0, 10)
}
