'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Misma paleta de estado validada por la skill dataviz que el donut de
// grafico-alertas.tsx (crítico/advertencia/bien) — no la de marca, que falló
// el chequeo de luminosidad para uso en gráfica sobre fondo oscuro.
const COLOR_ESTADO = { pendiente: '#d03b3b', enviada: '#fab219', resuelta: '#0ca30c' }
const ETIQUETA_ESTADO = { pendiente: 'Pendientes', enviada: 'Enviadas', resuelta: 'Resueltas' } as const

export type PuntoHistorial = { fecha: string; pendiente: number; enviada: number; resuelta: number }

function etiquetaFecha(fechaIso: string) {
  const [, mes, dia] = fechaIso.split('-')
  return `${dia}/${mes}`
}

export default function GraficoHistorial({ datos }: { datos: PuntoHistorial[] }) {
  const sinDatos = datos.every((d) => d.pendiente + d.enviada + d.resuelta === 0)

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={datos} barCategoryGap={datos.length > 14 ? '10%' : '25%'}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A45" vertical={false} />
          <XAxis
            dataKey="fecha"
            tickFormatter={etiquetaFecha}
            fontSize={11}
            stroke="#9098B5"
            interval={datos.length > 14 ? Math.ceil(datos.length / 10) : 0}
          />
          <YAxis fontSize={11} stroke="#9098B5" allowDecimals={false} />
          <Tooltip
            labelFormatter={(valor) => etiquetaFecha(String(valor))}
            contentStyle={{ background: '#1A1A2E', border: '1px solid #2A2A45', borderRadius: 8, color: '#F5F5F7' }}
          />
          <Bar dataKey="pendiente" name="Pendientes" stackId="estado" fill={COLOR_ESTADO.pendiente} radius={[0, 0, 0, 0]} />
          <Bar dataKey="enviada" name="Enviadas" stackId="estado" fill={COLOR_ESTADO.enviada} />
          <Bar dataKey="resuelta" name="Resueltas" stackId="estado" fill={COLOR_ESTADO.resuelta} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      {sinDatos ? (
        <p className="text-brand-muted text-sm text-center -mt-4">Sin alertas en este período.</p>
      ) : (
        <div className="flex items-center justify-center gap-4 -mt-2">
          {(Object.keys(ETIQUETA_ESTADO) as (keyof typeof ETIQUETA_ESTADO)[]).map((clave) => (
            <div key={clave} className="flex items-center gap-1.5 text-xs">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: COLOR_ESTADO[clave] }} aria-hidden />
              <span className="text-brand-muted">{ETIQUETA_ESTADO[clave]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
