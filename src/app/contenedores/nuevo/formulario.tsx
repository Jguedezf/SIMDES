'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { crearClienteNavegador } from '@/lib/supabase-navegador'
import MapaSelectorPuntoWrapper from '@/components/mapa-selector-punto-wrapper'
import { generarCodigo, siguienteNumeroPunto, ZONA_ETIQUETA, type TipoResiduo, type ZonaTipo } from '@/lib/codigo-contenedor'
import { TAMANOS_VALIDOS, tamanoPorDefecto } from '@/lib/tamanos-contenedor'

const TIPOS_RESIDUO: { valor: TipoResiduo; etiqueta: string }[] = [
  { valor: 'plastico', etiqueta: 'Plástico' },
  { valor: 'papel', etiqueta: 'Papel' },
  { valor: 'vidrio', etiqueta: 'Vidrio' },
  { valor: 'organico', etiqueta: 'Orgánico' },
]

const ZONAS: ZonaTipo[] = ['via_publica', 'comercial']

export default function FormularioNuevoContenedor() {
  const router = useRouter()
  const [numeroPunto, setNumeroPunto] = useState<number | null>(null)
  const [zona, setZona] = useState<ZonaTipo>('via_publica')
  const [latitud, setLatitud] = useState<number | null>(null)
  const [longitud, setLongitud] = useState<number | null>(null)
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

  useEffect(() => {
    const supabase = crearClienteNavegador()
    supabase
      .from('contenedores')
      .select('codigo')
      .then(({ data }) => {
        setNumeroPunto(siguienteNumeroPunto((data ?? []).map((c) => c.codigo)))
      })
  }, [])

  function alternarTipo(tipo: TipoResiduo) {
    setTiposSeleccionados((actual) => {
      const nuevo = new Set(actual)
      if (nuevo.has(tipo)) nuevo.delete(tipo)
      else nuevo.add(tipo)
      return nuevo
    })
  }

  const puedeGuardar =
    numeroPunto !== null && tiposSeleccionados.size > 0 && latitud !== null && longitud !== null

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!puedeGuardar || numeroPunto === null) return

    setGuardando(true)
    setMensaje('')

    const filas = Array.from(tiposSeleccionados).map((tipo) => ({
      codigo: generarCodigo(numeroPunto, zona, tipo),
      tipo_residuo: tipo,
      zona_tipo: zona,
      capacidad_litros: tamanos[tipo],
      latitud,
      longitud,
    }))

    const supabase = crearClienteNavegador()
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
        <Link href="/" className="text-sm text-brand-emerald hover:underline">← Volver al panel</Link>

        <h1 className="text-2xl font-bold text-foreground mt-2 mb-1">Registrar punto limpio</h1>
        <p className="text-brand-muted mb-6">
          Crea una isla ecológica completa: un contenedor segregado por cada tipo de residuo que marques, en el mismo punto físico.
        </p>

        <form onSubmit={guardar} className="rounded-2xl border border-brand-border bg-brand-surface/60 p-5 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Ubicación</label>
            <MapaSelectorPuntoWrapper
              latitud={latitud}
              longitud={longitud}
              onSeleccionar={(lat, lng) => {
                setLatitud(lat)
                setLongitud(lng)
              }}
            />
            <p className="text-xs text-brand-muted mt-2">
              {latitud !== null && longitud !== null
                ? `Punto marcado: ${latitud}, ${longitud}`
                : 'Todavía no has marcado un punto.'}
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
                  className={`flex-1 text-sm font-semibold px-3 py-2 rounded-lg border transition-colors ${
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
              {numeroPunto !== null ? `PL-${String(numeroPunto).padStart(3, '0')}-${zona === 'via_publica' ? 'R' : 'C'}-…` : 'Calculando…'}
            </p>
            <p className="text-xs text-brand-muted mt-1">Se genera automáticamente, no es editable.</p>
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
                      {numeroPunto !== null && (
                        <span className="block text-xs text-brand-muted font-mono">
                          {generarCodigo(numeroPunto, zona, t.valor)}
                        </span>
                      )}
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
                : tiposSeleccionados.size === 0
                  ? 'Marca al menos un tipo de residuo.'
                  : 'Calculando el número de punto…'}
            </p>
          )}

          <button
            type="submit"
            disabled={!puedeGuardar || guardando}
            className="w-full bg-brand-emerald text-brand-bg text-sm font-semibold px-4 py-2.5 rounded-lg hover:brightness-110 disabled:opacity-50 transition"
          >
            {guardando ? 'Guardando...' : `Registrar ${tiposSeleccionados.size} contenedor${tiposSeleccionados.size === 1 ? '' : 'es'}`}
          </button>
        </form>
      </div>
    </main>
  )
}
