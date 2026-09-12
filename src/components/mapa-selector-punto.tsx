'use client'

import { useEffect, useRef } from 'react'
import type { Map as LeafletMap, Marker as LeafletMarker, LeafletMouseEvent } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { crearIconoContenedor } from '@/lib/icono-contenedor'

// Centro aproximado de Parroquia Universidad, Municipio Caroní (piloto SIMDES)
const CENTRO_DEFECTO: [number, number] = [8.294, -62.714]
const COLOR_SELECCION = '#2563eb'

type Props = {
  latitud: number | null
  longitud: number | null
  onSeleccionar: (lat: number, lng: number) => void
}

export default function MapaSelectorPunto({ latitud, longitud, onSeleccionar }: Props) {
  const divRef = useRef<HTMLDivElement>(null)
  const mapaRef = useRef<LeafletMap | null>(null)
  const marcadorRef = useRef<LeafletMarker | null>(null)
  const onSeleccionarRef = useRef(onSeleccionar)

  useEffect(() => {
    onSeleccionarRef.current = onSeleccionar
  })

  useEffect(() => {
    let cancelado = false

    import('leaflet').then((L) => {
      if (cancelado || !divRef.current || mapaRef.current) return

      const centro: [number, number] =
        latitud !== null && longitud !== null ? [latitud, longitud] : CENTRO_DEFECTO

      const mapa = L.map(divRef.current).setView(centro, 15)
      mapaRef.current = mapa

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapa)

      if (latitud !== null && longitud !== null) {
        marcadorRef.current = L.marker([latitud, longitud], {
          icon: crearIconoContenedor(L, COLOR_SELECCION),
        }).addTo(mapa)
      }

      mapa.on('click', (e: LeafletMouseEvent) => {
        const { lat, lng } = e.latlng
        if (marcadorRef.current) {
          marcadorRef.current.setLatLng([lat, lng])
        } else {
          marcadorRef.current = L.marker([lat, lng], {
            icon: crearIconoContenedor(L, COLOR_SELECCION),
          }).addTo(mapa)
        }
        onSeleccionarRef.current(Number(lat.toFixed(6)), Number(lng.toFixed(6)))
      })
    })

    return () => {
      cancelado = true
      mapaRef.current?.remove()
      mapaRef.current = null
      marcadorRef.current = null
    }
    // El mapa se inicializa una sola vez; los clics ya actualizan el marcador
    // y notifican al formulario directamente, sin depender de estas props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={divRef} className="w-full h-[280px] rounded-lg" />
}
