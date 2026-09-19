import FormularioLogin from './formulario-login'
import FondoPantalla from '@/components/fondo-pantalla'

export default function LoginPage() {
  return <FormularioLogin fondo={<FondoPantalla nombre="login" alt="Fondo del portal de acceso a SIMDES" />} />
}
