import Link from 'next/link'

// Hero público de "/" para visitantes sin sesión. La imagen es una creación
// propia de Johanna (public/images/hero-background.jpg) — incluye el molino
// de luces navideñas de Alta Vista, Puerto Ordaz, así que no es una foto de
// stock ni tiene problema de licencia. Reemplaza la composición CSS/SVG que
// se había construido antes (13/09) cuando esta sesión no tenía la imagen
// real disponible.
export default function HeroLanding({
  puntosMonitoreados,
  nivelPromedio,
}: {
  puntosMonitoreados: number
  nivelPromedio: number | null
}) {
  return (
    <section className="relative overflow-hidden border-b border-brand-border bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/hero-background.jpg"
        alt="Contenedor inteligente SIMDES con paneles de monitoreo, de noche en Alta Vista, Puerto Ordaz"
        className="absolute inset-0 w-full h-full object-cover opacity-90"
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(90deg, rgba(5,7,10,0.96) 0%, rgba(5,7,10,0.9) 38%, rgba(5,7,10,0.4) 58%, rgba(5,7,10,0.2) 72%, rgba(5,7,10,0.5) 100%)' }}
      />

      <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-brand-emerald bg-brand-emerald/10 border border-brand-emerald/25 rounded-full px-3 py-1 mb-5 backdrop-blur-sm">
            Piloto activo · Parroquia Universidad, Caroní
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-[1.1] mb-5">
            La ciudad sabe cuándo un contenedor está por rebosar —{' '}
            <span className="text-brand-emerald">antes de que pase.</span>
          </h1>
          <p className="text-brand-muted text-base sm:text-lg mb-8">
            Sensores en tiempo real, predicción por IA y alertas automáticas para la cuadrilla de recolección, en un solo panel.
          </p>
          <div className="flex flex-wrap gap-3 mb-10">
            <Link href="/login" className="boton-pill text-sm font-semibold bg-brand-emerald text-brand-bg hover:brightness-110 px-6 py-3">
              Iniciar sesión
            </Link>
            <Link href="/contenedores" className="boton-pill text-sm font-semibold text-foreground border border-white/25 hover:border-brand-emerald/60 px-6 py-3 backdrop-blur-sm">
              Ver contenedores
            </Link>
          </div>

          {/* Datos reales del piloto, no las cifras ilustrativas de la imagen */}
          <div className="popover-solido inline-flex flex-wrap gap-6 px-5 py-3">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-brand-muted">Puntos monitoreados hoy</p>
              <p className="text-lg font-bold text-foreground">{puntosMonitoreados}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-brand-muted">Nivel promedio real</p>
              <p className="text-lg font-bold text-foreground">{nivelPromedio !== null ? `${nivelPromedio}%` : '—'}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
