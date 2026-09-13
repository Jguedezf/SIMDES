'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearClienteNavegador } from '@/lib/supabase-navegador'
import MapaSelectorPuntoWrapper from '@/components/mapa-selector-punto-wrapper'
import { generarCodigo, ZONA_ETIQUETA, type TipoResiduo, type ZonaTipo } from '@/lib/codigo-contenedor'
import { TAMANOS_VALIDOS, tamanoPorDefecto } from '@/lib/tamanos-contenedor'
import { obtenerDireccion } from '@/lib/geocodificar'

const TIPOS_RESIDUO: { valor: TipoResiduo; etiqueta: string }[] = [
  { valor: 'plastico', etiqueta: 'Plástico' },
  { valor: 'papel', etiqueta: 'Papel' },
  { valor: 'vidrio', etiqueta: 'Vidrio' },
  { valor: 'organico', etiqueta: 'Orgánico' },
]

const ZONAS: ZonaTipo[] = ['via_publica', 'comercial']

export default function FormularioNuevoContenedor() {
  const router = useRouter()
  const [zona, setZona] = useState<ZonaTipo>('via_publica')
  const [latitud, setLatitud] = useState<number | null>(null)
  const [longitud, setLongitud] = useState<number | null>(null)
  const [nombreUbicacion, setNombreUbicacion] = useState('')
  const [geocodificando, setGeocodificando] = useState(false)
  const [tiposSeleccionados, setTiposSeleccionados] = useState<Set<TipoResiduo>>(
    new Set(TIPOS_RESIDUO.map((t) => t.valor))
  )
  function tamanosPorDefectoDeZona(z: ZonaTipo) {
    const mapa = {} as Record<TipoResiduo, number>
    TIPOS_RESIDUO.forEach((t) => { mapa[t.valor] = tamanoPorDefecto(z, t.valor) })
    return mapa
  }

  const [tamanos, setTamanos] = useState<Record<TipoResiduo, number>>(() => tamanosPorDefectoDeZona('via_publica'))
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  // Al cambiar de zona, cada tipo vuelve a su tamaño por defecto de esa zona
  // (los tamaños válidos no son los mismos entre vía pública y comercial).
  // Ajuste de estado durante el render en vez de un efecto, siguiendo el
  // patrón recomendado por React para "resetear estado cuando cambia una
  // prop/valor" (evita el re-render en cascada que causaba un efecto aparte).
  const [zonaDeTamanos, setZonaDeTamanos] = useState(zona)
  if (zona !== zonaDeTamanos) {
    setZonaDeTamanos(zona)
    setTamanos(tamanosPorDefectoDeZona(zona))
  }

  // Geocodificación inversa al marcar el punto — mismo servicio (Nominatim)
  // que ya se usa al arrastrar un punto existente en el dashboard. Es una
  // sugerencia editable, no una fuente de verdad: Nominatim puede resolver
  // el mismo nombre de calle para dos puntos cercanos (verificado con datos
  // reales del piloto), así que el administrador puede corregirlo a mano.
  async function seleccionarPunto(lat: number, lng: number) {
    setLatitud(lat)
    setLongitud(lng)
    setGeocodificando(true)
    const direccion = await obtenerDireccion(lat, lng)
    setNombreUbicacion(direccion ?? '')
    setGeocodificando(false)
  }

  function alternarTipo(tipo: TipoResiduo) {
    setTiposSeleccionados((actual) => {
      const nuevo = new Set(actual)
      if (nuevo.has(tipo)) nuevo.delete(tipo)
      else nuevo.add(tipo)
      return nuevo
    })
  }

  const puedeGuardar = tiposSeleccionados.size > 0 && latitud !== null && longitud !== null

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!puedeGuardar) return

    setGuardando(true)
    setMensaje('')

    const supabase = crearClienteNavegador()

    // El número de isla se reserva en el servidor (secuencia atómica, RPC
    // `siguiente_numero_punto`) justo antes de insertar, no se calcula en el
    // cliente — evita que dos altas simultáneas terminen creando 2 islas con
    // el mismo número (condición de carrera real con el esquema anterior de
    // "leer el máximo y sumar 1").
    const { data: numeroPunto, error: errorNumero } = await supabase.rpc('siguiente_numero_punto')

    if (errorNumero || numeroPunto === null) {
      setMensaje(`No se pudo reservar el número de isla: ${errorNumero?.message ?? 'respuesta vacía'}`)
      setGuardando(false)
      return
    }

    const filas = Array.from(tiposSeleccionados).map((tipo) => ({
      codigo: generarCodigo(numeroPunto, zona, tipo),
      tipo_residuo: tipo,
      zona_tipo: zona,
      capacidad_litros: tamanos[tipo],
      latitud,
      longitud,
      numero_punto: numeroPunto,
      nombre_ubicacion: nombreUbicacion.trim() || null,
    }))

    const { error } = await supabase.from('contenedores').insert(filas)

    if (error) {
      setMensaje(
        error.code === '42501'
          ? 'No se pudo guardar: tu usuario no tiene permiso de administrador para registrar contenedores.'
          : `No se pudo guardar: ${error.message}`
      )
      setGuardando(false)
      return
    }

    router.push('/contenedores')
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-1">Registrar punto limpio</h1>
        <p className="text-brand-muted mb-6">
          Crea una isla ecológica completa: un contenedor segregado por cada tipo de residuo que marques, en el mismo punto físico.
        </p>

        <form onSubmit={guardar} className="tarjeta-vidrio tarjeta-entrada p-5 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Ubicación</label>
            <MapaSelectorPuntoWrapper
              latitud={latitud}
              longitud={longitud}
              onSeleccionar={seleccionarPunto}
            />
            <p className="text-xs text-brand-muted mt-2">
              {latitud !== null && longitud !== null
                ? `Punto marcado: ${latitud}, ${longitud}`
                : 'Todavía no has marcado un punto.'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Nombre de la ubicación</label>
            <input
              type="text"
              value={nombreUbicacion}
              onChange={(e) => setNombreUbicacion(e.target.value)}
              maxLength={120}
              placeholder={geocodificando ? 'Resolviendo dirección...' : 'Ej. Calle Zaragoza, frente a la plaza'}
              className="w-full border border-brand-border bg-brand-bg rounded-lg px-3 py-2 text-sm text-foreground"
            />
            <p className="text-xs text-brand-muted mt-1">
              Se sugiere sola al marcar el punto en el mapa — puedes corregirla si Nominatim no acertó.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Zona</label>
            <div className="flex gap-2">
              {ZONAS.map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setZona(z)}
                  className={`flex-1 boton-pill text-sm font-semibold px-3 py-2 border ${
                    zona === z
                      ? 'bg-brand-emerald border-brand-emerald text-brand-bg'
                      : 'bg-transparent border-brand-border text-brand-muted hover:border-brand-emerald/50'
                  }`}
                >
                  {ZONA_ETIQUETA[z]}
                </button>
              ))}
            </div>
            <p className="text-xs text-brand-muted mt-2">Determina las capacidades válidas que se ofrecen abajo.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Código del punto</label>
            <p className="text-sm text-brand-muted font-mono">
              PL-···-{zona === 'via_publica' ? 'R' : 'C'}-…
            </p>
            <p className="text-xs text-brand-muted mt-1">
              El número de isla se asigna al guardar (secuencia del servidor), no es editable.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">Contenedores de la isla ecológica</label>
            <div className="space-y-3">
              {TIPOS_RESIDUO.map((t) => {
                const activo = tiposSeleccionados.has(t.valor)
                return (
                  <div
                    key={t.valor}
                    className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                      activo ? 'border-brand-emerald/40 bg-brand-emerald/5' : 'border-brand-border'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={activo}
                      onChange={() => alternarTipo(t.valor)}
                      className="h-4 w-4 accent-emerald-500"
                      id={`tipo-${t.valor}`}
                    />
                    <label htmlFor={`tipo-${t.valor}`} className="text-sm font-medium text-foreground flex-1">
                      {t.etiqueta}
                    </label>
                    <select
                      value={tamanos[t.valor]}
                      disabled={!activo}
                      onChange={(e) => setTamanos((prev) => ({ ...prev, [t.valor]: Number(e.target.value) }))}
                      className="border border-brand-border bg-brand-bg rounded-lg px-2 py-1.5 text-sm text-foreground disabled:opacity-40"
                    >
                      {TAMANOS_VALIDOS[zona][t.valor].map((litros) => (
                        <option key={litros} value={litros}>{litros} L</option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>
          </div>

          {mensaje && <p className="text-sm text-brand-coral">{mensaje}</p>}

          {!puedeGuardar && !guardando && (
            <p className="text-xs text-brand-muted">
              {latitud === null || longitud === null
                ? 'Falta marcar la ubicación en el mapa.'
                : 'Marca al menos un tipo de residuo.'}
            </p>
          )}

          <button
            type="submit"
            disabled={!puedeGuardar || guardando}
            className="w-full bg-brand-emerald text-brand-bg boton-pill text-sm font-semibold px-5 py-2.5 hover:brightness-110 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : `Registrar ${tiposSeleccionados.size} contenedor${tiposSeleccionados.size === 1 ? '' : 'es'}`}
          </button>
        </form>
      </div>
    </main>
  )
}
