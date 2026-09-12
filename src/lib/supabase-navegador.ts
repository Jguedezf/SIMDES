import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente Supabase para Client Components: guarda la sesión en cookies
// (no en localStorage) para que el servidor pueda leerla también.
export function crearClienteNavegador() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
