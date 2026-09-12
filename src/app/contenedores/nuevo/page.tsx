import { exigirRol } from '@/lib/auth'
import FormularioNuevoContenedor from './formulario'

export default async function NuevoContenedorPage() {
  await exigirRol('administrador')
  return <FormularioNuevoContenedor />
}
