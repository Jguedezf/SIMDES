'use client'

import dynamic from 'next/dynamic'

// ssr:false solo es válido dentro de un Client Component en esta versión de Next.js
const MapaSelectorPunto = dynamic(() => import('./mapa-selector-punto'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[280px] rounded-lg bg-gray-100 animate-pulse flex items-center justify-center text-gray-400 text-sm">
      Cargando mapa...
    </div>
  ),
})

type Props = {
  latitud: number | null
  longitud: number | null
  onSeleccionar: (lat: number, lng: number) => void
}

export default function MapaSelectorPuntoWrapper(props: Props) {
  return <MapaSelectorPunto {...props} />
}
