import Link from 'next/link'

// Hero público de "/" para visitantes sin sesión — composición neón nocturna
// pedida el 13/09 (contenedor inteligente + paneles holográficos flotantes:
// llenado, ubicación, tendencia, red de sensores). Es una composición
// CSS/SVG propia, no una fotografía: no hay herramienta de generación de
// imágenes disponible en esta sesión y no se usan fotos de stock sin
// licencia — se construye con los mismos tokens de marca (`--color-brand-*`)
// para que encaje con el resto de la app en vez de depender de un asset
// externo. Usa datos reales del dashboard (puntos monitoreados, nivel
// promedio) en vez de cifras decorativas inventadas.
export default function HeroLanding({
  puntosMonitoreados,
  nivelPromedio,
}: {
  puntosMonitoreados: number
  nivelPromedio: number | null
}) {
  const nivel = nivelPromedio ?? 0
  const circunferencia = 2 * Math.PI * 34
  const trazoLleno = (nivel / 100) * circunferencia

  return (
    <section className="relative overflow-hidden border-b border-brand-border">
      {/* Cielo nocturno + halos de neón verde/azul */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 700px 420px at 12% 0%, color-mix(in srgb, var(--color-brand-emerald) 22%, transparent), transparent),
            radial-gradient(ellipse 640px 460px at 88% 8%, color-mix(in srgb, #22d3ee 18%, transparent), transparent),
            linear-gradient(180deg, #05070a 0%, #0a0e14 55%, #0d0d0d 100%)
          `,
        }}
      />

      {/* Calle mojada: banda inferior con reflejo difuso */}
      <div
        className="absolute inset-x-0 bottom-0 -z-10 h-40"
        style={{
          background: 'linear-gradient(180deg, transparent, rgba(0,212,170,0.05) 40%, rgba(34,211,238,0.06) 70%, rgba(0,0,0,0.4))',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-brand-emerald bg-brand-emerald/10 border border-brand-emerald/25 rounded-full px-3 py-1 mb-5">
            Piloto activo · Parroquia Universidad, Caroní
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-[1.1] mb-5">
            La ciudad sabe cuándo un contenedor está por rebosar —{' '}
            <span className="text-brand-emerald">antes de que pase.</span>
          </h1>
          <p className="text-brand-muted text-base sm:text-lg mb-8 max-w-md">
            Sensores en tiempo real, predicción por IA y alertas automáticas para la cuadrilla de recolección, en un solo panel.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/login" className="boton-pill text-sm font-semibold bg-brand-emerald text-brand-bg hover:brightness-110 px-6 py-3">
              Iniciar sesión
            </Link>
            <Link href="/contenedores" className="boton-pill text-sm font-semibold text-foreground border border-brand-border hover:border-brand-emerald/50 px-6 py-3">
              Ver contenedores
            </Link>
          </div>
        </div>

        {/* Escena: contenedor con anillo de sensor + paneles holográficos */}
        <div className="relative h-[360px] sm:h-[420px] select-none" aria-hidden="true">
          {/* Haz de luz vertical */}
          <div
            className="absolute left-1/2 top-0 bottom-0 w-32 -translate-x-1/2 opacity-40"
            style={{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--color-brand-emerald) 35%, transparent), transparent 70%)' }}
          />

          {/* Silueta del contenedor inteligente: tapa + cuerpo con nervaduras,
              anillo de sensor pulsante en la tapa (mismo lenguaje visual que
              los pines del mapa real), reflejo tenue abajo. */}
          <div
            className="absolute left-1/2 bottom-6 -translate-x-1/2"
            style={{ WebkitBoxReflect: 'below 3px linear-gradient(transparent, transparent 55%, rgba(0,0,0,0.25))' } as React.CSSProperties}
          >
            <div className="relative w-20 h-8 sm:w-24 sm:h-9 rounded-t-xl border border-brand-emerald/40 bg-gradient-to-b from-brand-surface to-[#0a1210] mx-auto">
              <div className="icono-anillo-pulso absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-3 rounded-full border-2 border-brand-emerald/80" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-brand-emerald shadow-[0_0_8px_2px_rgba(0,212,170,0.8)]" />
            </div>
            <div className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-b-2xl border border-t-0 border-brand-emerald/25 bg-gradient-to-b from-brand-surface to-black shadow-[0_0_60px_-10px_rgba(0,212,170,0.35)] overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="absolute inset-y-2 w-px bg-white/5" style={{ left: `${20 + i * 20}%` }} />
              ))}
              <div className="absolute inset-x-3 top-3 h-8 rounded-md border border-white/5 bg-white/[0.02] flex items-center justify-center">
                <span className="text-brand-emerald/70 text-[9px] font-bold tracking-wide">SIMDES</span>
              </div>
            </div>
            <div className="mx-auto mt-2 h-2 w-24 sm:w-28 rounded-full bg-brand-emerald/15 blur-md" />
          </div>

          {/* Panel: nivel de llenado (donut real) */}
          <div className="popover-solido tarjeta-entrada absolute left-0 top-2 sm:top-6 w-36 p-3" style={{ animationDelay: '80ms' }}>
            <div className="flex items-center gap-3">
              <svg width="44" height="44" viewBox="0 0 80 80" className="shrink-0 -rotate-90">
                <circle cx="40" cy="40" r="34" fill="none" stroke="var(--color-brand-border)" strokeWidth="8" />
                <circle
                  cx="40" cy="40" r="34" fill="none" stroke="var(--color-brand-emerald)" strokeWidth="8"
                  strokeDasharray={`${trazoLleno} ${circunferencia}`} strokeLinecap="round"
                />
              </svg>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-brand-muted">Llenado</p>
                <p className="text-lg font-bold text-foreground">{nivelPromedio !== null ? `${nivel}%` : '—'}</p>
              </div>
            </div>
          </div>

          {/* Panel: ubicación */}
          <div className="popover-solido tarjeta-entrada absolute right-0 top-0 sm:top-2 w-40 p-3" style={{ animationDelay: '160ms' }}>
            <p className="text-[10px] uppercase tracking-wide text-brand-muted mb-1.5">Ubicación</p>
            <div className="relative h-12 rounded-md border border-brand-border overflow-hidden" style={{ backgroundImage: 'radial-gradient(rgba(0,212,170,0.25) 1px, transparent 1px)', backgroundSize: '8px 8px' }}>
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-brand-emerald shadow-[0_0_10px_2px_rgba(0,212,170,0.6)]" />
            </div>
            <p className="text-xs text-foreground font-semibold mt-1.5">{puntosMonitoreados} puntos activos</p>
          </div>

          {/* Panel: tendencia de llenado */}
          <div className="popover-solido tarjeta-entrada absolute left-2 bottom-2 sm:bottom-8 w-36 p-3" style={{ animationDelay: '240ms' }}>
            <p className="text-[10px] uppercase tracking-wide text-brand-muted mb-2">Tendencia</p>
            <div className="flex items-end gap-1 h-8">
              {[30, 45, 40, 60, 72, 65, 80].map((alto, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{ height: `${alto}%`, background: 'linear-gradient(180deg, var(--color-brand-emerald), color-mix(in srgb, var(--color-brand-emerald) 40%, transparent))' }}
                />
              ))}
            </div>
          </div>

          {/* Panel: red de sensores */}
          <div className="popover-solido tarjeta-entrada absolute right-2 bottom-0 sm:bottom-6 w-40 p-3" style={{ animationDelay: '320ms' }}>
            <p className="text-[10px] uppercase tracking-wide text-brand-muted mb-1.5">Red de sensores</p>
            <svg width="100%" height="34" viewBox="0 0 120 34">
              <g stroke="#22d3ee" strokeWidth="1" opacity="0.5">
                <line x1="10" y1="8" x2="60" y2="20" />
                <line x1="60" y1="20" x2="110" y2="6" />
                <line x1="60" y1="20" x2="35" y2="28" />
                <line x1="60" y1="20" x2="90" y2="28" />
              </g>
              {[[10, 8], [60, 20], [110, 6], [35, 28], [90, 28]].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r={i === 1 ? 4 : 2.5} fill={i === 1 ? '#00D4AA' : '#22d3ee'} />
              ))}
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}
