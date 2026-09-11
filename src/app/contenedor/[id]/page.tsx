'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

type Contenedor = {
  id: string
  codigo: string
  tipo_residuo: string
  capacidad_litros: number
  estado: string
}

type Lectura = { nivel_pct: number; timestamp: string }
type Prediccion = {
  nivel_riesgo: string
  horas_estimadas_saturacion: number | null
  modelo_ia: string | null
  generado_en: string
}

const riesgoColor: Record<string, string> = {
  bajo: 'bg-green-100 text-green-800',
  medio: 'bg-yellow-100 text-yellow-800',
  alto: 'bg-orange-100 text-orange-800',
  critico: 'bg-red-100 text-red-800',
}

export default function DetalleContenedorPage() {
  const params = useParams<{ id: string }>()
  const [contenedor, setContenedor] = useState<Contenedor | null>(null)
  const [lecturas, setLecturas] = useState<Lectura[]>([])
  const [prediccion, setPrediccion] = useState<Prediccion | null>(null)
  const [simulando, setSimulando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  async function cargarDatos() {
    const { data: c } = await supabase
      .from('contenedores')
      .select('id, codigo, tipo_residuo, capacidad_litros, estado')
      .eq('id', params.id)
      .single()
    setContenedor(c)

    const { data: l } = await supabase
      .from('lecturas_sensor')
      .select('nivel_pct, timestamp')
      .eq('contenedor_id', params.id)
      .order('timestamp', { ascending: true })
      .limit(20)
    setLecturas(l ?? [])

    const { data: p } = await supabase
      .from('predicciones')
      .select('nivel_riesgo, horas_estimadas_saturacion, modelo_ia, generado_en')
      .eq('contenedor_id', params.id)
      .order('generado_en', { ascending: false })
      .limit(1)
      .single()
    setPrediccion(p ?? null)
  }

  useEffect(() => {
    cargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  async function simularLectura() {
    setSimulando(true)
    setMensaje('')
    const ultimoNivel = lecturas[lecturas.length - 1]?.nivel_pct ?? 40
    const nuevoNivel = Math.min(100, ultimoNivel + Math.floor(Math.random() * 12) + 3)

    try {
      const res = await fetch(
        'https://simdes.app.n8n.cloud/webhook/lectura-contenedor',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contenedor_id: contenedor?.id,
            nivel_pct: nuevoNivel,
            ubicacion: '',
            latitud: null,
            longitud: null,
            leido_en: new Date().toISOString(),
          }),
        }
      )
      if (!res.ok) throw new Error('Webhook respondió con error')
      setMensaje(`Lectura simulada enviada: ${nuevoNivel}%. Actualizando en unos segundos...`)
      setTimeout(cargarDatos, 3000)
    } catch {
      setMensaje('No se pudo contactar la automatización (revisa que el workflow esté publicado en n8n).')
    } finally {
      setSimulando(false)
    }
  }

  if (!contenedor) {
    return <main className="p-6 text-gray-400">Cargando...</main>
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <a href="/" className="text-sm text-blue-600 hover:underline">← Volver al panel</a>

        <div className="flex items-center justify-between mt-2 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{contenedor.codigo}</h1>
            <p className="text-gray-500 capitalize">{contenedor.tipo_residuo} · {contenedor.capacidad_litros} L</p>
          </div>
          <button
            onClick={simularLectura}
            disabled={simulando}
            className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {simulando ? 'Enviando...' : 'Simular lectura'}
          </button>
        </div>

        {mensaje && <p className="text-sm text-gray-500 mb-4">{mensaje}</p>}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Historial de llenado</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={lecturas.map(l => ({
              hora: new Date(l.timestamp).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }),
              nivel: l.nivel_pct,
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hora" fontSize={12} />
              <YAxis domain={[0, 100]} fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="nivel" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          {!lecturas.length && <p className="text-gray-400 text-sm">Sin lecturas todavía.</p>}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Predicción (IA)</h2>
          {prediccion ? (
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${riesgoColor[prediccion.nivel_riesgo] ?? 'bg-gray-100 text-gray-700'}`}>
                {prediccion.nivel_riesgo}
              </span>
              {prediccion.horas_estimadas_saturacion !== null && (
                <span className="text-sm text-gray-600">
                  Saturación estimada en ~{prediccion.horas_estimadas_saturacion} h
                </span>
              )}
              <span className="text-xs text-gray-400 ml-auto">{prediccion.modelo_ia}</span>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Sin predicción registrada todavía.</p>
          )}
        </div>
      </div>
    </main>
  )
}