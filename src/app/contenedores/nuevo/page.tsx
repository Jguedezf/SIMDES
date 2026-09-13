import { exigirRol } from '@/lib/auth'
import Navbar from '@/components/navbar'
import FormularioNuevoContenedor from './formulario'

export default async function NuevoContenedorPage() {
  await exigirRol('administrador')
  return (
    <>
      <Navbar />
      <FormularioNuevoContenedor />
    </>
  )
}
