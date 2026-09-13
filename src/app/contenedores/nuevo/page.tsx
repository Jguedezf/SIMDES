import { exigirRol } from '@/lib/auth'
import Navbar from '@/components/navbar'
import FondoPantalla from '@/components/fondo-pantalla'
import FormularioNuevoContenedor from './formulario'

export default async function NuevoContenedorPage() {
  await exigirRol('administrador')
  return (
    <div className="relative">
      <FondoPantalla nombre="registro" alt="Fondo del registro de un punto limpio" />
      <Navbar />
      <FormularioNuevoContenedor />
    </div>
  )
}
