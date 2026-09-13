import Link from 'next/link'
import { obtenerPerfil } from '@/lib/auth'
import { cerrarSesion } from '@/app/login/actions'
import { ROL_COLOR_AVATAR, iniciales } from '@/lib/avatar'

const navLinkClase =
  'text-sm font-medium text-brand-muted hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-white/8 whitespace-nowrap'

// Menú persistente: antes cada pantalla decidía su propio encabezado (el
// dashboard tenía el menú completo, /reportes, /alertas, /sensor y
// /contenedores solo un link "Volver al panel") — inconsistente entre
// capturas, corregido el 13/09 para que el menú esté siempre visible sin
// importar la pantalla. Server Component: resuelve su propio perfil, así
// que cualquier página lo usa sin pasarle props.
//
// Alertas y Sensor solo se muestran con sesión iniciada (13/09): no es una
// restricción de seguridad (RLS ya deja esas tablas de lectura pública, con
// o sin este link) — es una decisión de navegación/negocio: un visitante
// anónimo en la landing solo necesita ver "Contenedores" (la propuesta de
// transparencia ciudadana) e "Iniciar sesión", no el feed operativo interno
// de alertas ni la ficha técnica de hardware.
//
// Pulido del 13/09: layout de 3 zonas (logo | nav centrado | sesión) en vez
// de dos (logo | todo lo demás a la derecha) — el grupo de links vive ahora
// en su propia "isla" con fondo y borde, un patrón más cuidado que texto
// suelto flotando junto al logo. El correo en texto plano de la esquina
// derecha se reemplazó por el mismo avatar de iniciales que ya existía en
// /perfil (antes duplicado ahí y en ningún otro lado — ver src/lib/avatar.ts).
export default async function Navbar() {
  const perfil = await obtenerPerfil()

  return (
    <header className="sticky top-0 z-20 border-b border-brand-border bg-brand-bg/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="SIMDES" className="h-9 w-auto shrink-0" />
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-bold text-foreground">SIMDES</p>
            <p className="text-[11px] text-brand-muted">Monitoreo y predicción</p>
          </div>
        </Link>

        <nav className="flex-1 flex items-center justify-center min-w-0">
          <div className="flex items-center gap-0.5 flex-wrap justify-center sm:bg-white/[0.03] sm:border sm:border-white/10 sm:rounded-full px-1.5 py-1">
            <Link href="/" className={navLinkClase}>Panel de inicio</Link>
            <Link href="/contenedores" className={navLinkClase}>Contenedores</Link>
            {perfil?.rol === 'administrador' && (
              <Link href="/contenedores/nuevo" className={navLinkClase}>+ Registrar</Link>
            )}
            {(perfil?.rol === 'administrador' || perfil?.rol === 'directiva') && (
              <Link href="/reportes" className={navLinkClase}>Reportes</Link>
            )}
            {perfil && (
              <>
                <Link href="/alertas" className={navLinkClase}>Alertas</Link>
                <Link href="/sensor" className={navLinkClase}>Sensor</Link>
              </>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          {perfil ? (
            <>
              <Link
                href="/perfil"
                title={`${perfil.email ?? ''} · ${perfil.rol}`}
                className={`h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white transition hover:brightness-110 hover:ring-2 hover:ring-white/20 ${ROL_COLOR_AVATAR[perfil.rol] ?? 'bg-brand-border'}`}
              >
                {iniciales(perfil.nombre, perfil.rol)}
              </Link>
              <form action={cerrarSesion}>
                <button
                  type="submit"
                  className="text-sm font-medium text-brand-coral hover:text-white hover:bg-brand-coral/20 transition-colors px-3 py-1.5 rounded-full whitespace-nowrap"
                >
                  Cerrar sesión
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm font-semibold text-brand-bg bg-brand-emerald hover:brightness-110 transition px-4 py-1.5 rounded-full whitespace-nowrap"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
