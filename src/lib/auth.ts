import 'server-only'
import { redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase-servidor'

export type Rol = 'administrador' | 'directiva' | 'cuadrilla'

export type Perfil = {
  id: string
  email: string | null
  rol: Rol
  cuadrilla_id: string | null
  nombre: string | null
}

// Lee la sesión + el perfil (rol) del usuario actual. No redirige.
export async function obtenerPerfil(): Promise<Perfil | null> {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('id, rol, cuadrilla_id, nombre')
    .eq('id', user.id)
    .single()

  if (!perfil) return null

  return { ...perfil, email: user.email ?? null }
}

// Exige sesión + uno de los roles indicados; si no, redirige a /login.
// Usar al inicio de un Server Component de página protegida.
export async function exigirRol(...rolesPermitidos: Rol[]): Promise<Perfil> {
  const perfil = await obtenerPerfil()
  if (!perfil || !rolesPermitidos.includes(perfil.rol)) {
    redirect('/login')
  }
  return perfil
}
