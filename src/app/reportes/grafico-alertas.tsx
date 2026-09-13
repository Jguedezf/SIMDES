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
      {/* Profundidad tipo 3D pedida el 13/09 ("no plana como está ahora"):
          una segunda dona oscura y difuminada debajo, desplazada, simula el
          grosor/sombra proyectada de un torus real; la dona de encima usa
          gradientes radiales por sector (no color plano) para el brillo
          "biselado", más un drop-shadow de color sobre el conjunto. */}
      <div className="relative w-full max-w-[200px] h-[200px] shrink-0">
        <div className="absolute inset-0 translate-y-[7px] translate-x-[3px] opacity-70" style={{ filter: 'blur(5px) brightness(0.35)' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={datos} dataKey="valor" nameKey="nombre" innerRadius={55} outerRadius={80} paddingAngle={datos.length > 1 ? 2 : 0} isAnimationActive={false}>
                {datos.map((d) => (
                  <Cell key={d.nombre} fill={COLOR_ESTADO[d.nombre]} stroke="none" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="absolute inset-0" style={{ filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.5))' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {datos.map((d) => (
                  <radialGradient key={d.nombre} id={`grad-${d.nombre}`} cx="35%" cy="30%" r="75%">
                    <stop offset="0%" stopColor={COLOR_ESTADO[d.nombre]} stopOpacity={1} />
                    <stop offset="55%" stopColor={COLOR_ESTADO[d.nombre]} stopOpacity={1} />
                    <stop offset="100%" stopColor={COLOR_ESTADO[d.nombre]} stopOpacity={0.72} />
                  </radialGradient>
                ))}
              </defs>
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
                  <Cell key={d.nombre} fill={`url(#grad-${d.nombre})`} />
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
        </div>
      </div>

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
