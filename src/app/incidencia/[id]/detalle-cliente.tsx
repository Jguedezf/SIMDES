'use client'

import { useState } from 'react'
import Link from 'next/link'
import { crearClienteNavegador } from '@/lib/supabase-navegador'
import {
  ESTADOS_INCIDENCIA, SEVERIDAD_ETIQUETA, ESTADO_INCIDENCIA_ETIQUETA, ESTADO_INCIDENCIA_CLASE,
  SEVERIDAD_CLASE, FACTOR_CALIDAD_ETIQUETA,
  type Severidad, type EstadoIncidencia, type FactorCalidad,
} from '@/lib/incidencias'
import Toast, { type ToastTipo } from '@/components/toast'

export type Incidencia = {
  id: string
  titulo: string
  descripcion: string
  pasos_reproducir: string | null
  modulo: string | null
  severidad: Severidad
  factor_calidad: FactorCalidad | null
  estado: EstadoIncidencia
  reportado_por: string
  asignado_a: string | null
  resuelto_por: string | null
  resolucion: string | null
  creado_en: string
  resuelto_en: string | null
}

type Props = {
  incidenciaInicial: Incidencia
  nombrePorId: Record<string, string>
  miId: string
}

export default function DetalleIncidenciaCliente({ incidenciaInicial, nombrePorId, miId }: Props) {
  const [supabase] = useState(() => crearClienteNavegador())
  const [incidencia, setIncidencia] = useState(incidenciaInicial)
  const [resolucion, setResolucion] = useState(incidenciaInicial.resolucion ?? '')
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState<{ mensaje: string; tipo: ToastTipo } | null>(null)

  function nombreDe(id: string | null) {
    if (!id) return 'Sin asignar'
    return nombrePorId[id] ?? 'Administrador'
  }

  async function cambiarEstado(nuevoEstado: EstadoIncidencia) {
    if (nuevoEstado === incidencia.estado) return
    setGuardando(true)

    const cierra = nuevoEstado === 'cerrada' || nuevoEstado === 'descartada'
    const cambios = {
      estado: nuevoEstado,
      resolucion: resolucion.trim() || null,
      resuelto_por: cierra ? miId : null,
      resuelto_en: cierra ? new Date().toISOString() : null,
    }

    const { error } = await supabase.from('incidencias_software').update(cambios).eq('id', incidencia.id)

    setGuardando(false)
    if (error) {
      setToast({ mensaje: `No se pudo actualizar: ${error.message}`, tipo: 'error' })
      return
    }

    setIncidencia({ ...incidencia, ...cambios })
    setToast({ mensaje: 'Incidencia actualizada.', tipo: 'exito' })
  }

  async function guardarResolucion() {
    setGuardando(true)
    const { error } = await supabase
      .from('incidencias_software')
      .update({ resolucion: resolucion.trim() || null })
      .eq('id', incidencia.id)

    setGuardando(false)
    if (error) {
      setToast({ mensaje: `No se pudo guardar: ${error.message}`, tipo: 'error' })
      return
    }
    setIncidencia({ ...incidencia, resolucion: resolucion.trim() || null })
    setToast({ mensaje: 'Resolución guardada.', tipo: 'exito' })
  }

  async function asignarme() {
    setGuardando(true)
    const { error } = await supabase
      .from('incidencias_software')
      .update({ asignado_a: miId })
      .eq('id', incidencia.id)

    setGuardando(false)
    if (error) {
      setToast({ mensaje: `No se pudo asignar: ${error.message}`, tipo: 'error' })
      return
    }
    setIncidencia({ ...incidencia, asignado_a: miId })
    setToast({ mensaje: 'Incidencia asignada a ti.', tipo: 'exito' })
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/incidencias" className="text-sm text-brand-muted hover:text-brand-emerald">
          ← Volver a incidencias
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-3 mt-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{incidencia.titulo}</h1>
            <p className="text-brand-muted text-sm mt-1">
              {incidencia.modulo ?? 'Sin módulo'}
              {incidencia.factor_calidad && ` · ${FACTOR_CALIDAD_ETIQUETA[incidencia.factor_calidad]}`}
              {' · '}Reportada por {nombreDe(incidencia.reportado_por)} el {new Date(incidencia.creado_en).toLocaleString('es-VE')}
            </p>
          </div>
          <div className="flex gap-2">
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${SEVERIDAD_CLASE[incidencia.severidad]}`}>
              {SEVERIDAD_ETIQUETA[incidencia.severidad]}
            </span>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${ESTADO_INCIDENCIA_CLASE[incidencia.estado]}`}>
              {ESTADO_INCIDENCIA_ETIQUETA[incidencia.estado]}
            </span>
          </div>
        </div>

        <div className="tarjeta-vidrio tarjeta-interactiva tarjeta-entrada p-5 mb-6">
          <h2 className="font-semibold text-foreground mb-2">Descripción</h2>
          <p className="text-sm text-brand-muted whitespace-pre-wrap">{incidencia.descripcion}</p>
          {incidencia.pasos_reproducir && (
            <>
              <h2 className="font-semibold text-foreground mt-4 mb-2">Pasos para reproducir</h2>
              <p className="text-sm text-brand-muted whitespace-pre-wrap">{incidencia.pasos_reproducir}</p>
            </>
          )}
        </div>

        <div className="tarjeta-vidrio tarjeta-interactiva tarjeta-entrada p-5 mb-6" style={{ animationDelay: '80ms' }}>
          <h2 className="font-semibold text-foreground mb-3">Estado y seguimiento</h2>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {ESTADOS_INCIDENCIA.map((valor) => (
              <button
                key={valor}
                onClick={() => cambiarEstado(valor)}
                disabled={guardando || valor === incidencia.estado}
                className={`text-sm font-semibold px-3 py-1.5 boton-pill border disabled:cursor-default ${
                  valor === incidencia.estado
                    ? 'bg-brand-emerald border-brand-emerald text-brand-bg'
                    : 'bg-transparent border-brand-border text-brand-muted hover:border-brand-emerald/50 disabled:opacity-50'
                }`}
              >
                {ESTADO_INCIDENCIA_ETIQUETA[valor]}
              </button>
            ))}
          </div>

          <p className="text-sm text-brand-muted mb-3">
            Asignada a: <span className="text-foreground font-medium">{nombreDe(incidencia.asignado_a)}</span>
            {!incidencia.asignado_a && (
              <button onClick={asignarme} disabled={guardando} className="ml-3 text-brand-emerald font-semibold hover:underline disabled:opacity-50">
                Asignarme
              </button>
            )}
          </p>

          <label className="block text-sm font-semibold text-foreground mb-2">Resolución / seguimiento</label>
          <textarea
            value={resolucion}
            onChange={(e) => setResolucion(e.target.value)}
            rows={4}
            placeholder="Qué se hizo, causa raíz, commit relacionado, etc."
            className="w-full border border-brand-border bg-brand-bg rounded-lg px-3 py-2 text-sm text-foreground mb-3"
          />
          <button
            onClick={guardarResolucion}
            disabled={guardando}
            className="boton-pill bg-brand-emerald text-brand-bg text-sm font-semibold px-5 py-2 hover:brightness-110 disabled:opacity-50"
          >
            Guardar resolución
          </button>

          {incidencia.resuelto_por && incidencia.resuelto_en && (
            <p className="text-xs text-brand-muted mt-3">
              Cerrada/descartada por {nombreDe(incidencia.resuelto_por)} el {new Date(incidencia.resuelto_en).toLocaleString('es-VE')}
            </p>
          )}
        </div>
      </div>

      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={() => setToast(null)} />}
    </main>
  )
}
