'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

// Paleta de estado validada por la skill dataviz (fija, no la de marca) —
// las combinaciones de marca (coral/ámbar/esmeralda) fallaron el chequeo de
// banda de luminosidad para uso en gráfica sobre fondo oscuro. El significado
// semántico también calza mejor: pendiente=crítico, enviada=advertencia,
// resuelta=bien.
const COLOR_ESTADO: Record<string, string> = {
  Pendientes: '#d03b3b',
  Enviadas: '#fab219',
  Resueltas: '#0ca30c',
}

type Props = {
  pendiente: number
  enviada: number
  resuelta: number
}

export default function GraficoAlertas({ pendiente, enviada, resuelta }: Props) {
  const total = pendiente + enviada + resuelta
  const datos = [
    { nombre: 'Pendientes', valor: pendiente },
    { nombre: 'Enviadas', valor: enviada },
    { nombre: 'Resueltas', valor: resuelta },
  ].filter((d) => d.valor > 0)

  if (!total) {
    return <p className="text-brand-muted text-sm text-center py-8">Sin alertas todavía — nada que graficar.</p>
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <ResponsiveContainer width="100%" height={200} className="max-w-[200px]">
        <PieChart>
          <Pie
            data={datos}
            dataKey="valor"
            nameKey="nombre"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={datos.length > 1 ? 2 : 0}
            stroke="#1A1A2E"
            strokeWidth={2}
            label={({ percent }) => `${Math.round((percent ?? 0) * 100)}%`}
            labelLine={false}
          >
            {datos.map((d) => (
              <Cell key={d.nombre} fill={COLOR_ESTADO[d.nombre]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#1A1A2E', border: '1px solid #2A2A45', borderRadius: 8, color: '#F5F5F7' }}
            formatter={(valor, nombre) => {
              const n = Number(valor)
              return [`${n} (${Math.round((n / total) * 100)}%)`, String(nombre)]
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex sm:flex-col gap-3 sm:gap-1.5 text-sm flex-wrap justify-center">
        {(['Pendientes', 'Enviadas', 'Resueltas'] as const).map((nombre) => {
          const valor = nombre === 'Pendientes' ? pendiente : nombre === 'Enviadas' ? enviada : resuelta
          return (
            <div key={nombre} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: COLOR_ESTADO[nombre] }} aria-hidden />
              <span className="text-foreground font-medium">{valor}</span>
              <span className="text-brand-muted">{nombre}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
