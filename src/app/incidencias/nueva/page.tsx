import { exigirRol } from '@/lib/auth'
import Navbar from '@/components/navbar'
import FondoPantalla from '@/components/fondo-pantalla'
import FormularioNuevaIncidencia from './formulario'

export default async function NuevaIncidenciaPage() {
  await exigirRol('administrador')

  return (
    <div className="relative">
      <FondoPantalla nombre="incidencias" alt="Fondo del alta de incidencias" />
      <Navbar />
      <FormularioNuevaIncidencia />
    </div>
  )
}
