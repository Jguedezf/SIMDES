'use client'

import { useState } from 'react'
import Link from 'next/link'
import { crearClienteNavegador } from '@/lib/supabase-navegador'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { ZONA_ETIQUETA, type ZonaTipo } from '@/lib/codigo-contenedor'
import ModalConfirmacion from '@/components/modal-confirmacion'
import Toast, { type ToastTipo } from '@/components/toast'

export type Contenedor = {
  id: string
  codigo: string
  tipo_residuo: string
  capacidad_litros: number
  estado: string
  zona_tipo: ZonaTipo
  eliminado_en: string | null
}

export type Lectura = { nivel_pct: number; timestamp: string }
export type Prediccion = {
  nivel_riesgo: string
  horas_estimadas_saturacion: number | null
  modelo_ia: string | null
  generado_en: string
}

const ESTADOS_CONTENEDOR = ['activo', 'mantenimiento', 'fuera_de_servicio'] as const

const estadoEtiqueta: Record<string, string> = {
  activo: 'Activo',
  mantenimiento: 'En mantenimiento',
  fuera_de_servicio: 'Fuera de servicio',
}

const riesgoClase: Record<string, string> = {
  bajo: 'bg-brand-emerald text-brand-bg',
  medio: 'bg-brand-amber text-brand-bg',
  alto: 'bg-orange-500 text-white',
  critico: 'bg-brand-coral text-white',
}

type Props = {
  contenedorInicial: Contenedor
  lecturasIniciales: Lectura[]
  prediccionInicial: Prediccion | null
  esAdministrador: boolean
}

export default function DetalleContenedorCliente({
  contenedorInicial, lecturasIniciales, prediccionInicial, esAdministrador,
}: Props) {
  const [supabase] = useState(() => crearClienteNavegador())
  const [contenedor, setContenedor] = useState(contenedorInicial)
  const [lecturas, setLecturas] = useState(lecturasIniciales)
  const [prediccion, setPrediccion] = useState(prediccionInicial)
  const [simulando, setSimulando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [guardandoEstado, setGuardandoEstado] = useState(false)
  const [mensajeEstado, setMensajeEstado] = useState('')
  const [guardandoEliminado, setGuardandoEliminado] = useState(false)
  const [mensajeEliminado, setMensajeEliminado] = useState('')
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [toast, setToast] = useState<{ mensaje: string; tipo: ToastTipo } | null>(null)

  async function recargarDatos() {
    const [{ data: l }, { data: p }] = await Promise.all([
      supabase
        .from('lecturas_sensor')
        .select('nivel_pct, timestamp')
        .eq('contenedor_id', contenedor.id)
        .order('timestamp', { ascending: true })
        .limit(20),
      supabase
        .from('predicciones')
        .select('nivel_riesgo, horas_estimadas_saturacion, modelo_ia, generado_en')
        .eq('contenedor_id', contenedor.id)
        .order('generado_en', { ascending: false })
        .limit(1)
        .single(),
    ])
    setLecturas(l ?? [])
    setPrediccion(p ?? null)
  }

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
            contenedor_id: contenedor.id,
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
      setTimeout(recargarDatos, 3000)
    } catch {
      setMensaje('No se pudo contactar la automatización (revisa que el workflow esté publicado en n8n).')
    } finally {
      setSimulando(false)
    }
  }

  async function cambiarEstado(nuevoEstado: string) {
    if (nuevoEstado === contenedor.estado) return
    setGuardandoEstado(true)
    setMensajeEstado('')

    const { error } = await supabase
      .from('contenedores')
      .update({ estado: nuevoEstado })
      .eq('id', contenedor.id)

    if (error) {
      setMensajeEstado(
        error.code === '42501'
          ? 'No se pudo guardar: falta permiso de actualización en la base de datos (RLS).'
          : `No se pudo guardar el estado: ${error.message}`
      )
    } else {
      setContenedor({ ...contenedor, estado: nuevoEstado })
      setMensajeEstado('Estado actualizado.')
    }
    setGuardandoEstado(false)
  }

  async function ejecutarCambioEliminado(eliminando: boolean) {
    setGuardandoEliminado(true)
    setMensajeEliminado('')

    const { error } = await supabase
      .from('contenedores')
      .update({ eliminado_en: eliminando ? new Date().toISOString() : null })
      .eq('id', contenedor.id)

    setConfirmandoEliminar(false)
    setGuardandoEliminado(false)

    if (error) {
      setMensajeEliminado(
        error.code === '42501'
          ? 'No se pudo guardar: falta permiso de administrador (RLS).'
          : `No se pudo guardar: ${error.message}`
      )
    } else {
      setContenedor({ ...contenedor, eliminado_en: eliminando ? new Date().toISOString() : null })
      setToast({ mensaje: eliminando ? 'Contenedor eliminado.' : 'Contenedor restaurado.', tipo: 'exito' })
    }
  }

  // Restaurar es reversible y de bajo riesgo — se ejecuta directo. Eliminar
  // sí pide confirmación (punto 8 del feedback de Johanna: acciones críticas
  // no deben ejecutarse sin confirmar).
  function manejarClicEliminar() {
    if (contenedor.eliminado_en) ejecutarCambioEliminado(false)
    else setConfirmandoEliminar(true)
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm text-brand-emerald hover:underline">← Volver al panel</Link>

        <div className="flex items-center justify-between mt-2 mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{contenedor.codigo}</h1>
            <p className="text-brand-muted capitalize">
              {contenedor.tipo_residuo} · {contenedor.capacidad_litros} L · {ZONA_ETIQUETA[contenedor.zona_tipo]}
            </p>
          </div>
          <button
            onClick={simularLectura}
            disabled={simulando}
            className="boton-pill bg-brand-emerald text-brand-bg text-sm font-semibold px-5 py-2 hover:brightness-110 disabled:opacity-50"
          >
            {simulando ? 'Enviando...' : 'Simular lectura'}
          </button>
        </div>

        {mensaje && <p className="text-sm text-brand-muted mb-4">{mensaje}</p>}

        {contenedor.eliminado_en && (
          <div className="rounded-2xl border border-brand-coral/40 bg-brand-coral/10 p-4 mb-6">
            <p className="text-sm text-brand-coral font-semibold">
              Este contenedor fue eliminado administrativamente el {new Date(contenedor.eliminado_en).toLocaleString('es-VE')}.
            </p>
            <p className="text-xs text-brand-muted mt-1">
              No aparece en el listado, el mapa ni el dashboard. Su historial (lecturas, predicciones, alertas) se conserva intacto.
            </p>
          </div>
        )}

        <div className="tarjeta-vidrio p-5 mb-6">
          <h2 className="font-semibold text-foreground mb-3">Estado del contenedor</h2>
          {esAdministrador ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {ESTADOS_CONTENEDOR.map((valor) => (
                  <button
                    key={valor}
                    onClick={() => cambiarEstado(valor)}
                    disabled={guardandoEstado || valor === contenedor.estado}
                    className={`text-sm font-semibold px-3 py-1.5 boton-pill border disabled:cursor-default ${
                      valor === contenedor.estado
                        ? 'bg-brand-emerald border-brand-emerald text-brand-bg'
                        : 'bg-transparent border-brand-border text-brand-muted hover:border-brand-emerald/50 disabled:opacity-50'
                    }`}
                  >
                    {estadoEtiqueta[valor]}
                  </button>
                ))}
              </div>
              {mensajeEstado && <p className="text-sm text-brand-muted mt-3">{mensajeEstado}</p>}
            </>
          ) : (
            <span className="text-sm font-semibold px-3 py-1.5 rounded-full bg-brand-border text-brand-muted">
              {estadoEtiqueta[contenedor.estado] ?? contenedor.estado}
            </span>
          )}
        </div>

        {esAdministrador && (
          <div className="tarjeta-vidrio p-5 mb-6">
            <h2 className="font-semibold text-foreground mb-1">Administración</h2>
            <p className="text-xs text-brand-muted mb-3">
              Eliminar es una corrección administrativa (ej. contenedor registrado por error) — lo oculta del listado, el mapa y el dashboard, pero conserva su historial. No es lo mismo que &quot;Fuera de servicio&quot;, que es el retiro operativo real de un contenedor que sigue existiendo físicamente.
            </p>
            <button
              onClick={manejarClicEliminar}
              disabled={guardandoEliminado}
              className={`text-sm font-semibold px-3 py-1.5 boton-pill border disabled:opacity-50 ${
                contenedor.eliminado_en
                  ? 'bg-brand-emerald border-brand-emerald text-brand-bg'
                  : 'bg-transparent border-brand-coral text-brand-coral hover:bg-brand-coral/10'
              }`}
            >
              {guardandoEliminado ? 'Guardando...' : contenedor.eliminado_en ? 'Restaurar contenedor' : 'Eliminar contenedor'}
            </button>
            {mensajeEliminado && <p className="text-sm text-brand-muted mt-3">{mensajeEliminado}</p>}
          </div>
        )}

        <div className="tarjeta-interactiva tarjeta-vidrio p-5 mb-6">
          <h2 className="font-semibold text-foreground mb-4">Historial de llenado</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={lecturas.map(l => ({
              hora: new Date(l.timestamp).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }),
              nivel: l.nivel_pct,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A45" />
              <XAxis dataKey="hora" fontSize={12} stroke="#9098B5" />
              <YAxis domain={[0, 100]} fontSize={12} stroke="#9098B5" />
              <Tooltip contentStyle={{ background: '#1A1A2E', border: '1px solid #2A2A45', borderRadius: 8, color: '#F5F5F7' }} />
              <Line type="monotone" dataKey="nivel" stroke="#00D4AA" strokeWidth={2} dot={{ r: 3, fill: '#00D4AA' }} />
            </LineChart>
          </ResponsiveContainer>
          {!lecturas.length && <p className="text-brand-muted text-sm">Sin lecturas todavía.</p>}
        </div>

        <div className="tarjeta-interactiva tarjeta-vidrio p-5">
          <h2 className="font-semibold text-foreground mb-3">Predicción (IA)</h2>
          {prediccion ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${riesgoClase[prediccion.nivel_riesgo] ?? 'bg-brand-border text-brand-muted'}`}>
                {prediccion.nivel_riesgo}
              </span>
              {prediccion.horas_estimadas_saturacion !== null && (
                <span className="text-sm text-brand-muted">
                  Saturación estimada en ~{prediccion.horas_estimadas_saturacion} h
                </span>
              )}
              <span className="text-xs text-brand-muted ml-auto">{prediccion.modelo_ia}</span>
            </div>
          ) : (
            <p className="text-brand-muted text-sm">Sin predicción registrada todavía.</p>
          )}
        </div>
      </div>

      <ModalConfirmacion
        abierto={confirmandoEliminar}
        titulo="¿Eliminar este contenedor?"
        descripcion="Se ocultará del listado, el mapa y el dashboard. Su historial (lecturas, predicciones, alertas) se conserva y puedes restaurarlo después desde esta misma pantalla."
        textoConfirmar="Sí, eliminar"
        peligroso
        cargando={guardandoEliminado}
        onConfirmar={() => ejecutarCambioEliminado(true)}
        onCancelar={() => setConfirmandoEliminar(false)}
      />

      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={() => setToast(null)} />}
    </main>
  )
}
