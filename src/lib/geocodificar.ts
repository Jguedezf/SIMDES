// Geocodificación inversa vía Nominatim/OpenStreetMap (sin llave, política de
// uso pública para volumen bajo como este). Extraído de mapa-panel.tsx para
// reutilizarlo también en el alta de contenedores (formulario.tsx) — antes
// solo se usaba para el mensaje de confirmación al arrastrar un punto, ahora
// también alimenta la columna `contenedores.nombre_ubicacion`.
export async function obtenerDireccion(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=17&addressdetails=1`,
      { headers: { 'Accept-Language': 'es' }, signal: AbortSignal.timeout(4000) }
    )
    if (!res.ok) return null
    const datos = await res.json()
    const dir = datos.address ?? {}
    const partes = [dir.road, dir.suburb || dir.neighbourhood, dir.city || dir.town].filter(Boolean)
    return partes.length ? partes.join(', ') : (datos.display_name ?? null)
  } catch {
    return null
  }
}
