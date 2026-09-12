import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente Supabase consciente de sesión para Server Components, Server Actions
// y Route Handlers: lee/escribe la sesión desde las cookies de la petición.
export async function crearClienteServidor() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Se llama desde un Server Component (no puede escribir cookies);
          // el proxy.ts se encarga de refrescar la sesión en ese caso.
        }
      },
    },
  })
}
