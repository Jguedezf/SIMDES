import Link from 'next/link'

const COMPONENTES = [
  { nombre: 'Sensor ultrasónico HC-SR04', costo: '~3 USD', funcion: 'Medición de distancia / nivel de llenado' },
  { nombre: 'Microcontrolador ESP32 + módulo SIM 4G', costo: '~15 USD', funcion: 'Procesamiento local y transmisión de datos' },
  { nombre: 'Batería LiSOCl2', costo: 'incluido', funcion: 'Autonomía de 3 a 5 años sin recarga' },
  { nombre: 'Carcasa IP68 + resina antivandálica', costo: 'incluido', funcion: 'Resistencia a intemperie, hurto y vandalismo' },
]

export default function SensorPage() {
  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-brand-emerald hover:underline">← Volver al panel</Link>

        <h1 className="text-2xl font-bold text-foreground mt-2 mb-1">Módulo sensor SIMDES-Node</h1>
        <p className="text-brand-muted mb-6">
          Especificación técnica del hardware propuesto para instrumentar cada contenedor. Diseñado
          para vía pública sin supervisión: sin pantalla ni componentes expuestos, discreto y económico.
        </p>

        <div className="tarjeta-interactiva tarjeta-vidrio p-5 mb-6">
          <h2 className="font-semibold text-foreground mb-4">Componentes y costo estimado</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-brand-muted border-b border-brand-border">
                <th className="pb-2">Componente</th>
                <th className="pb-2">Costo aproximado</th>
                <th className="pb-2">Función</th>
              </tr>
            </thead>
            <tbody>
              {COMPONENTES.map((c) => (
                <tr key={c.nombre} className="border-b border-brand-border/60">
                  <td className="py-2 text-foreground">{c.nombre}</td>
                  <td className="py-2 text-foreground whitespace-nowrap">{c.costo}</td>
                  <td className="py-2 text-brand-muted">{c.funcion}</td>
                </tr>
              ))}
              <tr>
                <td className="py-2 font-semibold text-foreground">Total estimado por unidad</td>
                <td className="py-2 font-semibold text-brand-emerald" colSpan={2}>25 a 40 USD</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-brand-muted mt-4">
            Estimación de componente a precio de catálogo, no una cotización real de proveedor —
            se documenta para dar magnitud a la propuesta, no como compromiso de costo. Ensamblaje
            localizable en Ciudad Guayana.
          </p>
        </div>

        <div className="tarjeta-interactiva tarjeta-vidrio p-5">
          <h2 className="font-semibold text-foreground mb-3">Clasificación por color (COVENIN 3838)</h2>
          <p className="text-sm text-brand-muted mb-3">
            El código de cada contenedor codifica su tipo de residuo por el color oficial de la norma:
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm text-foreground">
            <p><span className="font-semibold text-brand-amber">Y</span> — Amarillo → Plástico</p>
            <p><span className="font-semibold text-brand-violet">A</span> — Azul → Papel/Cartón</p>
            <p><span className="font-semibold text-brand-emerald">V</span> — Verde → Vidrio</p>
            <p><span className="font-semibold text-amber-800">M</span> — Marrón → Orgánico</p>
          </div>
        </div>
      </div>
    </main>
  )
}
