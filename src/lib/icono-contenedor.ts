// Ícono SVG simple con forma de contenedor de basura, reutilizado por el mapa
// del dashboard (coloreado por nivel de llenado) y por el selector de punto
// del formulario de alta (HU-01).
export function crearIconoContenedor(L: typeof import('leaflet'), color: string, tamano = 34) {
  const alto = Math.round(tamano * (28 / 24))
  const anillo = Math.round(tamano * 1.3)

  const html = `
<div style="position:relative;width:${tamano}px;height:${alto}px;">
  <span class="icono-anillo-pulso" style="width:${anillo}px;height:${anillo}px;background:${color};"></span>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 28" width="${tamano}" height="${alto}" style="position:relative;filter:drop-shadow(0 0 5px ${color}aa);">
    <path d="M5 8h14l-1.3 16.8A2 2 0 0 1 15.7 26.6H8.3A2 2 0 0 1 6.3 24.8L5 8Z" fill="${color}" stroke="#0D0D0D" stroke-width="1"/>
    <rect x="3.5" y="6" width="17" height="2.4" rx="1.2" fill="#0D0D0D"/>
    <path d="M9 6V4.2A1.2 1.2 0 0 1 10.2 3h3.6A1.2 1.2 0 0 1 15 4.2V6" fill="none" stroke="#0D0D0D" stroke-width="1.6"/>
    <line x1="9.5" y1="11" x2="9.5" y2="22" stroke="white" stroke-width="1.4" stroke-linecap="round"/>
    <line x1="12" y1="11" x2="12" y2="22" stroke="white" stroke-width="1.4" stroke-linecap="round"/>
    <line x1="14.5" y1="11" x2="14.5" y2="22" stroke="white" stroke-width="1.4" stroke-linecap="round"/>
  </svg>
</div>`.trim()

  return L.divIcon({
    className: '',
    html,
    iconSize: [tamano, alto],
    iconAnchor: [tamano / 2, alto],
    popupAnchor: [0, -alto],
  })
}
