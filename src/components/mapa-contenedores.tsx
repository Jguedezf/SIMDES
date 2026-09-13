'use client'

import { useEffect, useRef } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { nivelColorHex } from '@/lib/nivel'
import { crearIconoContenedor } from '@/lib/icono-contenedor'
import { TIPO_ETIQUETA, type TipoResiduo } from '@/lib/codigo-contenedor'

export type ContenedorMapa = {
  id: string
  codigo: string
  tipo_residuo: string
  capacidad_litros: number
  latitud: number
  longitud: number
  nivel: number | null
}

// Centro aproximado de Parroquia Universidad, Municipio Caroní (piloto SIMDES)
const CENTRO_DEFECTO: [number, number] = [8.294, -62.714]

type PuntoMapa = {
  lat: number
  lng: number
  etiqueta: string
  contenedores: ContenedorMapa[]
  nivelCritico: number | null
}

// Un punto limpio agrupa varios contenedores (uno por tipo de residuo) que
// comparten exactamente las mismas coordenadas. El código "PL-001-Y" identifica
// el punto "PL-001" y el tipo de residuo "Y" (amarillo/plástico, COVENIN 3838).
function etiquetaPunto(codigo: string) {
  const segmentos = codigo.split('-')
  return segmentos.length > 1 ? segmentos.slice(0, -1).join('-') : codigo
}

function agruparPorPunto(contenedores: ContenedorMapa[]): PuntoMapa[] {
  const grupos = new Map<string, ContenedorMapa[]>()

  contenedores.forEach((c) => {
    const clave = `${c.latitud.toFixed(6)},${c.longitud.toFixed(6)}`
    const grupo = grupos.get(clave)
    if (grupo) grupo.push(c)
    else grupos.set(clave, [c])
  })

  return Array.from(grupos.values()).map((grupo) => {
    const nivelesConocidos = grupo
      .map((c) => c.nivel)
      .filter((n): n is number => n !== null)

    return {
      lat: grupo[0].latitud,
      lng: grupo[0].longitud,
      etiqueta: etiquetaPunto(grupo[0].codigo),
      contenedores: grupo,
      nivelCritico: nivelesConocidos.length ? Math.max(...nivelesConocidos) : null,
    }
  })
}

function construirPopup(punto: PuntoMapa) {
  const contenedorHtml = document.createElement('div')
  contenedorHtml.style.minWidth = '180px'

  const titulo = document.createElement('strong')
  titulo.style.color = '#F5F5F7'
  titulo.textContent = punto.etiqueta
  contenedorHtml.appendChild(titulo)
  contenedorHtml.appendChild(document.createElement('br'))

  punto.contenedores
    .slice()
    .sort((a, b) => (b.nivel ?? -1) - (a.nivel ?? -1))
    .forEach((c) => {
      const fila = document.createElement('div')
      fila.style.marginTop = '4px'

      const enlace = document.createElement('a')
      enlace.href = `/contenedor/${c.id}`
      enlace.style.color = nivelColorHex(c.nivel)
      enlace.style.fontWeight = '600'
      enlace.textContent = TIPO_ETIQUETA[c.tipo_residuo as TipoResiduo] ?? c.tipo_residuo
      fila.appendChild(enlace)

      const nivelTexto = document.createElement('span')
      nivelTexto.style.color = '#9098B5'
      nivelTexto.textContent = c.nivel !== null ? ` — ${c.nivel}%` : ' — sin datos'
      fila.appendChild(nivelTexto)

      contenedorHtml.appendChild(fila)
    })

  return contenedorHtml
}

type Props = {
  contenedores: ContenedorMapa[]
  editable?: boolean
  // Devuelve `true` si se guardó bien (el marcador se queda donde se soltó) o
  // `false` si falló (el marcador vuelve a su posición original) — sin esto,
  // un error de guardado dejaría el pin en un sitio que la base de datos
  // nunca confirmó.
  onReubicar?: (idsContenedores: string[], lat: number, lng: number) => Promise<boolean>
}

export default function MapaContenedores({ contenedores, editable, onReubicar }: Props) {
  const divRef = useRef<HTMLDivElement>(null)
  const mapaRef = useRef<LeafletMap | null>(null)
  // Ref para que el listener de dragend (creado una sola vez, dentro del
  // efecto de inicialización) siempre llame a la versión más reciente del
  // callback sin tener que reconstruir todo el mapa cuando cambia.
  const onReubicarRef = useRef(onReubicar)
  useEffect(() => {
    onReubicarRef.current = onReubicar
  })

  useEffect(() => {
    let cancelado = false

    import('leaflet').then((L) => {
      if (cancelado || !divRef.current || mapaRef.current) return

      const centro: [number, number] = contenedores.length
        ? [
            contenedores.reduce((suma, c) => suma + c.latitud, 0) / contenedores.length,
            contenedores.reduce((suma, c) => suma + c.longitud, 0) / contenedores.length,
          ]
        : CENTRO_DEFECTO

      const mapa = L.map(divRef.current).setView(centro, 15)
      mapaRef.current = mapa

      // Tile estándar de OSM + filtro CSS (.mapa-oscuro en globals.css) para el look oscuro.
      // Los tiles "dark" gratuitos de CartoDB ahora exigen API key (probado 2026-09-12,
      // salía marca de agua "API KEY REQUIRED") — este enfoque no depende de ningún key.
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapa)

      agruparPorPunto(contenedores).forEach((punto) => {
        const icono = crearIconoContenedor(L, nivelColorHex(punto.nivelCritico))

        const marcador = L.marker([punto.lat, punto.lng], { icon: icono, draggable: Boolean(editable) })
          .addTo(mapa)
          .bindPopup(construirPopup(punto), { className: 'popup-simdes' })

        if (editable) {
          let posicionAntesDeArrastrar = marcador.getLatLng()

          // Efecto visual mientras se arrastra: se levanta y brilla más.
          marcador.on('dragstart', () => {
            posicionAntesDeArrastrar = marcador.getLatLng()
            marcador.closePopup()
            marcador.getElement()?.classList.add('marcador-arrastrando')
          })

          marcador.on('dragend', async () => {
            marcador.getElement()?.classList.remove('marcador-arrastrando')
            const { lat, lng } = marcador.getLatLng()
            const latRedondeada = Number(lat.toFixed(6))
            const lngRedondeada = Number(lng.toFixed(6))

            // El marcador ya se queda visualmente donde se soltó (Leaflet lo
            // posiciona solo) — no se toca el mapa de nuevo aquí. Si el
            // guardado falla, se revierte a la posición original; si tiene
            // éxito, tampoco se reconstruye nada — evita el salto/parpadeo
            // que causaba un router.refresh() completo en cada reubicación.
            const guardadoOk = await onReubicarRef.current?.(
              punto.contenedores.map((c) => c.id),
              latRedondeada,
              lngRedondeada
            )

            if (guardadoOk === false) {
              marcador.setLatLng(posicionAntesDeArrastrar)
            }
          })
        }
      })
    })

    return () => {
      cancelado = true
      mapaRef.current?.remove()
      mapaRef.current = null
    }
    // `editable` viene del rol de la sesión — no cambia mientras la página
    // está montada, así que no hace falta reconstruir el mapa si cambiara.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contenedores])

  return <div ref={divRef} className="mapa-oscuro w-full h-[420px] rounded-xl" />
}
