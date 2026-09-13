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
  numero_punto: number
  nombre_ubicacion: string | null
}

// Centro aproximado de Parroquia Universidad, Municipio Caroní (piloto SIMDES)
const CENTRO_DEFECTO: [number, number] = [8.294, -62.714]

type PuntoMapa = {
  lat: number
  lng: number
  numeroPunto: number
  etiqueta: string
  nombreUbicacion: string | null
  contenedores: ContenedorMapa[]
  nivelCritico: number | null
}

// Código de 3 dígitos con ceros a la izquierda (PL-001, PL-012, ...), igual
// al formato ya usado en `codigo-contenedor.ts`.
function etiquetaPunto(numeroPunto: number) {
  return `PL-${String(numeroPunto).padStart(3, '0')}`
}

// Un punto limpio agrupa varios contenedores (uno por tipo de residuo) que
// pertenecen a la misma isla ecológica — se agrupan por `numero_punto`
// (columna explícita), no por coincidencia de lat/lng como antes. Antes de
// esta columna, dos islas que por error compartieran coordenadas se habrían
// fusionado en el mapa sin que nada lo evitara.
function agruparPorPunto(contenedores: ContenedorMapa[]): PuntoMapa[] {
  const grupos = new Map<number, ContenedorMapa[]>()

  contenedores.forEach((c) => {
    const grupo = grupos.get(c.numero_punto)
    if (grupo) grupo.push(c)
    else grupos.set(c.numero_punto, [c])
  })

  return Array.from(grupos.entries()).map(([numeroPunto, grupo]) => {
    const nivelesConocidos = grupo
      .map((c) => c.nivel)
      .filter((n): n is number => n !== null)

    return {
      lat: grupo[0].latitud,
      lng: grupo[0].longitud,
      numeroPunto,
      etiqueta: etiquetaPunto(numeroPunto),
      nombreUbicacion: grupo[0].nombre_ubicacion,
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

  if (punto.nombreUbicacion) {
    const ubicacion = document.createElement('div')
    ubicacion.style.color = '#9098B5'
    ubicacion.style.fontSize = '12px'
    ubicacion.textContent = punto.nombreUbicacion
    contenedorHtml.appendChild(ubicacion)
  }

  const coordenadas = document.createElement('div')
  coordenadas.style.color = '#9098B5'
  coordenadas.style.fontSize = '11px'
  coordenadas.style.marginBottom = '4px'
  coordenadas.textContent = `${punto.lat.toFixed(6)}, ${punto.lng.toFixed(6)}`
  contenedorHtml.appendChild(coordenadas)

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

  const verIsla = document.createElement('a')
  verIsla.href = `/contenedores?punto=${String(punto.numeroPunto).padStart(3, '0')}`
  verIsla.style.display = 'block'
  verIsla.style.marginTop = '8px'
  verIsla.style.fontSize = '12px'
  verIsla.style.fontWeight = '600'
  verIsla.style.color = '#00D4AA'
  verIsla.textContent = 'Ver esta isla →'
  contenedorHtml.appendChild(verIsla)

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
