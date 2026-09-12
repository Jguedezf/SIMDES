import { redirect } from 'next/navigation'
import { obtenerPerfil } from '@/lib/auth'
import PerfilCliente from './perfil-cliente'

export default async function PerfilPage() {
  const perfil = await obtenerPerfil()
  if (!perfil) redirect('/login')

  return <PerfilCliente perfil={perfil} />
}
