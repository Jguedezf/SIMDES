'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearClienteNavegador } from '@/lib/supabase-navegador'
import {
  SEVERIDADES, FACTORES_CALIDAD, SEVERIDAD_ETIQUETA, FACTOR_CALIDAD_ETIQUETA,
  type Severidad, type FactorCalidad,
} from '@/lib/incidencias'

const MODULOS_SUGERIDOS = ['Mapa', 'Contenedores', 'Alertas', 'Reportes', 'Autenticación / RLS', 'n8n / automatización', 'IA / predicciones', 'Otro']

export default function FormularioNuevaIncidencia() {
  const router = useRouter()
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [pasosReproducir, setPasosReproducir] = useState('')
  const [modulo, setModulo] = useState('')
  const [severidad, setSeveridad] = useState<Severidad>('media')
  const [factorCalidad, setFactorCalidad] = useState<FactorCalidad | ''>('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const puedeGuardar = titulo.trim().length > 0 && descripcion.trim().length > 0

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!puedeGuardar) return

    setGuardando(true)
    setMensaje('')

    const supabase = crearClienteNavegador()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setMensaje('No se pudo identificar tu sesión — vuelve a iniciar sesión.')
      setGuardando(false)
      return
    }

    const { error } = await supabase.from('incidencias_software').insert({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      pasos_reproducir: pasosReproducir.trim() || null,
      modulo: modulo.trim() || null,
      severidad,
      factor_calidad: factorCalidad || null,
      reportado_por: user.id,
    })

    if (error) {
      setMensaje(
        error.code === '42501'
          ? 'No se pudo guardar: tu usuario no tiene permiso de administrador para reportar incidencias.'
          : `No se pudo guardar: ${error.message}`
      )
      setGuardando(false)
      return
    }

    router.push('/incidencias')
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-1">Reportar incidencia de software</h1>
        <p className="text-brand-muted mb-6">
          Registro interno de defectos del sistema SIMDES — evidencia del control de calidad, no un reporte operativo de residuos.
        </p>

        <form onSubmit={guardar} className="tarjeta-vidrio tarjeta-entrada p-5 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Título</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={150}
              placeholder="Ej. El popup del mapa no filtra por isla"
              className="w-full border border-brand-border bg-brand-bg rounded-lg px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={4}
              className="w-full border border-brand-border bg-brand-bg rounded-lg px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Pasos para reproducir (opcional)</label>
            <textarea
              value={pasosReproducir}
              onChange={(e) => setPasosReproducir(e.target.value)}
              rows={3}
              className="w-full border border-brand-border bg-brand-bg rounded-lg px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Módulo (opcional)</label>
              <input
                type="text"
                list="modulos-sugeridos"
                value={modulo}
                onChange={(e) => setModulo(e.target.value)}
                maxLength={80}
                placeholder="Ej. Mapa"
                className="w-full border border-brand-border bg-brand-bg rounded-lg px-3 py-2 text-sm text-foreground"
              />
              <datalist id="modulos-sugeridos">
                {MODULOS_SUGERIDOS.map((m) => <option key={m} value={m} />)}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Severidad</label>
              <select
                value={severidad}
                onChange={(e) => setSeveridad(e.target.value as Severidad)}
                className="w-full border border-brand-border bg-brand-bg rounded-lg px-3 py-2 text-sm text-foreground"
              >
                {SEVERIDADES.map((s) => <option key={s} value={s}>{SEVERIDAD_ETIQUETA[s]}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Factor de calidad afectado (opcional)</label>
            <select
              value={factorCalidad}
              onChange={(e) => setFactorCalidad(e.target.value as FactorCalidad | '')}
              className="w-full border border-brand-border bg-brand-bg rounded-lg px-3 py-2 text-sm text-foreground"
            >
              <option value="">Sin clasificar</option>
              {FACTORES_CALIDAD.map((f) => <option key={f} value={f}>{FACTOR_CALIDAD_ETIQUETA[f]}</option>)}
            </select>
            <p className="text-xs text-brand-muted mt-1">
              Mismos 11 factores de Pressman/ISO 25010 documentados en la sección 4.8 del informe.
            </p>
          </div>

          {mensaje && <p className="text-sm text-brand-coral">{mensaje}</p>}

          {!puedeGuardar && !guardando && (
            <p className="text-xs text-brand-muted">
              {!titulo.trim() ? 'Falta el título.' : 'Falta la descripción.'}
            </p>
          )}

          <button
            type="submit"
            disabled={!puedeGuardar || guardando}
            className="w-full bg-brand-emerald text-brand-bg boton-pill text-sm font-semibold px-5 py-2.5 hover:brightness-110 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Reportar incidencia'}
          </button>
        </form>
      </div>
    </main>
  )
}
