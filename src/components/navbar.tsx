import Link from 'next/link'
import { obtenerPerfil } from '@/lib/auth'
import { cerrarSesion } from '@/app/login/actions'

const navLinkClase =
  'text-sm font-medium text-brand-muted hover:text-brand-emerald transition-colors px-3 py-1.5 rounded-full hover:bg-white/5'

// Menú persistente: antes cada pantalla decidía su propio encabezado (el
// dashboard tenía el menú completo, /reportes, /alertas, /sensor y
// /contenedores solo un link "Volver al panel") — inconsistente entre
// capturas, corregido el 13/09 para que el menú esté siempre visible sin
// importar la pantalla. Server Component: resuelve su propio perfil, así
// que cualquier página lo usa sin pasarle props.
export default async function Navbar() {
  const perfil = await obtenerPerfil()

  return (
    <header className="sticky top-0 z-20 border-b border-brand-border bg-brand-bg/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="SIMDES" className="h-10 w-auto shrink-0" />
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">SIMDES</h1>
            <p className="text-xs text-brand-muted leading-tight">Monitoreo y predicción de desechos sólidos</p>
          </div>
        </Link>
        <nav className="flex items-center gap-1 flex-wrap">
          <Link href="/contenedores" className={navLinkClase}>Contenedores</Link>
          {perfil?.rol === 'administrador' && (
            <Link href="/contenedores/nuevo" className={navLinkClase}>+ Registrar</Link>
          )}
          {(perfil?.rol === 'administrador' || perfil?.rol === 'directiva') && (
            <Link href="/reportes" className={navLinkClase}>Reportes</Link>
          )}
          <Link href="/alertas" className={navLinkClase}>Alertas</Link>
          <Link href="/sensor" className={navLinkClase}>Sensor</Link>
          {perfil ? (
            <div className="flex items-center gap-3 pl-3 ml-2 border-l border-brand-border">
              <Link href="/perfil" className="text-xs text-brand-muted hover:text-brand-emerald hidden sm:inline">
                {perfil.email} · {perfil.rol}
              </Link>
              <form action={cerrarSesion}>
                <button
                  type="submit"
                  className="text-sm font-medium text-brand-coral hover:text-white hover:bg-brand-coral/20 transition-colors px-3 py-1.5 rounded-full"
                >
                  Cerrar sesión
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm font-semibold text-brand-bg bg-brand-emerald hover:brightness-110 transition px-4 py-1.5 rounded-full ml-2"
            >
              Iniciar sesión
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
