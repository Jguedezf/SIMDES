import { redirect } from 'next/navigation'
import { obtenerPerfil } from '@/lib/auth'
import FormularioLogin from './formulario-login'
import FondoPantalla from '@/components/fondo-pantalla'

export default async function LoginPage() {
  if (await obtenerPerfil()) redirect('/')
  return <FormularioLogin fondo={<FondoPantalla nombre="login" alt="Fondo del portal de acceso a SIMDES" />} />
}
