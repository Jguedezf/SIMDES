'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { crearClienteNavegador } from '@/lib/supabase-navegador'
import MapaSelectorPuntoWrapper from '@/components/mapa-selector-punto-wrapper'

const TIPOS_RESIDUO = [
  { valor: 'plastico', etiqueta: 'Plástico' },
  { valor: 'papel', etiqueta: 'Papel' },
  { valor: 'vidrio', etiqueta: 'Vidrio' },
  { valor: 'organico', etiqueta: 'Orgánico' },
] as const

export default function FormularioNuevoContenedor() {
  const router = useRouter()
  const [codigo, setCodigo] = useState('')
  const [tipoResiduo, setTipoResiduo] = useState<(typeof TIPOS_RESIDUO)[number]['valor']>('plastico')
  const [capacidadLitros, setCapacidadLitros] = useState('')
  const [latitud, setLatitud] = useState<number | null>(null)
  const [longitud, setLongitud] = useState<number | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const puedeGuardar =
    codigo.trim().length > 0 && Number(capacidadLitros) > 0 && latitud !== null && longitud !== null

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!puedeGuardar) return

    setGuardando(true)
    setMensaje('')

    const supabase = crearClienteNavegador()
    const { error } = await supabase.from('contenedores').insert({
      codigo: codigo.trim(),
      tipo_residuo: tipoResiduo,
      capacidad_litros: Number(capacidadLitros),
      latitud,
      longitud,
    })

    if (error) {
      setMensaje(
        error.code === '42501'
          ? 'No se pudo guardar: tu usuario no tiene permiso de administrador para registrar contenedores.'
          : `No se pudo guardar: ${error.message}`
      )
      setGuardando(false)
      return
    }

    router.push('/')
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-blue-600 hover:underline">← Volver al panel</Link>

        <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-1">Registrar contenedor</h1>
        <p className="text-gray-500 mb-6">Toca el mapa para marcar el punto exacto donde va el contenedor.</p>

        <form onSubmit={guardar} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ubicación</label>
            <MapaSelectorPuntoWrapper
              latitud={latitud}
              longitud={longitud}
              onSeleccionar={(lat, lng) => {
                setLatitud(lat)
                setLongitud(lng)
              }}
            />
            <p className="text-xs text-gray-400 mt-2">
              {latitud !== null && longitud !== null
                ? `Punto marcado: ${latitud}, ${longitud}`
                : 'Todavía no has marcado un punto.'}
            </p>
          </div>

          <div>
            <label htmlFor="codigo" className="block text-sm font-semibold text-gray-700 mb-1">Código</label>
            <input
              id="codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="PL-045-X"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="tipo" className="block text-sm font-semibold text-gray-700 mb-1">Tipo de residuo</label>
              <select
                id="tipo"
                value={tipoResiduo}
                onChange={(e) => setTipoResiduo(e.target.value as typeof tipoResiduo)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {TIPOS_RESIDUO.map((t) => (
                  <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="capacidad" className="block text-sm font-semibold text-gray-700 mb-1">Capacidad (L)</label>
              <input
                id="capacidad"
                type="number"
                min={1}
                value={capacidadLitros}
                onChange={(e) => setCapacidadLitros(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          {mensaje && <p className="text-sm text-red-600">{mensaje}</p>}

          <button
            type="submit"
            disabled={!puedeGuardar || guardando}
            className="w-full bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Registrar contenedor'}
          </button>
        </form>
      </div>
    </main>
  )
}
