'use client'

import dynamic from 'next/dynamic'
import type { ContenedorMapa } from './mapa-contenedores'

// ssr:false solo es válido dentro de un Client Component en esta versión de Next.js
const MapaContenedores = dynamic(() => import('./mapa-contenedores'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] rounded-xl bg-brand-surface animate-pulse flex items-center justify-center text-brand-muted text-sm">
      Cargando mapa...
    </div>
  ),
})

type Props = {
  contenedores: ContenedorMapa[]
  editable?: boolean
  onReubicar?: (idsContenedores: string[], lat: number, lng: number) => void
}

export default function MapaContenedoresWrapper({ contenedores, editable, onReubicar }: Props) {
  return <MapaContenedores contenedores={contenedores} editable={editable} onReubicar={onReubicar} />
}
