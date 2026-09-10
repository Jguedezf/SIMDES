import { supabase } from '@/lib/supabase'

export default async function Home() {
  const { data: contenedores, error } = await supabase
    .from('contenedores')
    .select('*')

  if (error) {
    return <main style={{ padding: 40 }}>Error al conectar con Supabase: {error.message}</main>
  }

  return (
    <main style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>SIMDES — Prueba de conexión</h1>
      <p>Contenedores encontrados: {contenedores?.length}</p>
      <ul>
        {contenedores?.map((c) => (
          <li key={c.id}>
            {c.codigo} — {c.tipo_residuo} — {c.capacidad_litros}L — estado: {c.estado}
          </li>
        ))}
      </ul>
    </main>
  )
}