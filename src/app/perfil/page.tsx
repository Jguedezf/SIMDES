import { redirect } from 'next/navigation'
import { obtenerPerfil } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import PerfilCliente from './perfil-cliente'

export default async function PerfilPage() {
  const perfil = await obtenerPerfil()
  if (!perfil) redirect('/login')

  // Extensión específica del rol Cuadrilla (patrón de herencia: perfiles es la
  // base común, cuadrilla_id es la única extensión que ya existía en el
  // modelo — se resuelve aquí para mostrarla en /perfil, no solo guardarla).
  let cuadrilla: { nombre: string; zona_asignada: string | null; empresa: string | null } | null = null
  if (perfil.rol === 'cuadrilla' && perfil.cuadrilla_id) {
    const { data } = await supabase
      .from('cuadrillas')
      .select('nombre, zona_asignada, empresa')
      .eq('id', perfil.cuadrilla_id)
      .single()
    cuadrilla = data
  }

  return <PerfilCliente perfil={perfil} cuadrilla={cuadrilla} />
}
