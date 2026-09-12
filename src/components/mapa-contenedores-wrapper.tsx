'use client'

import dynamic from 'next/dynamic'
import type { ContenedorMapa } from './mapa-contenedores'

// ssr:false solo es válido dentro de un Client Component en esta versión de Next.js
const MapaContenedores = dynamic(() => import('./mapa-contenedores'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] rounded-xl bg-gray-100 animate-pulse flex items-center justify-center text-gray-400 text-sm">
      Cargando mapa...
    </div>
  ),
})

export default function MapaContenedoresWrapper({ contenedores }: { contenedores: ContenedorMapa[] }) {
  return <MapaContenedores contenedores={contenedores} />
}
