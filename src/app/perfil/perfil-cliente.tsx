'use client'

import { useState } from 'react'
import Link from 'next/link'
import { crearClienteNavegador } from '@/lib/supabase-navegador'
import type { Perfil } from '@/lib/auth'
import ModalConfirmacion from '@/components/modal-confirmacion'
import Toast, { type ToastTipo } from '@/components/toast'

const rolEtiqueta: Record<string, string> = {
  administrador: 'Administrador',
  directiva: 'Directiva',
  cuadrilla: 'Cuadrilla',
}

const rolColorAvatar: Record<string, string> = {
  administrador: 'bg-brand-violet',
  directiva: 'bg-brand-emerald',
  cuadrilla: 'bg-brand-amber',
}

function iniciales(nombre: string | null, rol: string) {
  const partes = (nombre ?? '').trim().split(/\s+/).filter(Boolean)
  if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase()
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return rol.slice(0, 2).toUpperCase()
}

// Capacidades por rol — la "extensión" visible del perfil base (Cuenta),
// igual que cuadrilla_id ya es la extensión de datos para el rol Cuadrilla.
// Petición de Johanna (12/09): que el modelo de herencia por rol se vea en
// la pantalla, no solo exista como estructura interna.
const capacidadesPorRol: Record<string, string[]> = {
  administrador: [
    'Registrar, editar y eliminar contenedores',
    'Resolver cualquier alerta, de cualquier cuadrilla',
    'Ver reportes y consumo de IA',
  ],
  directiva: [
    'Ver reportes de gestión y consumo de IA',
    'Ver contenedores, mapa y alertas',
    'Solo lectura — no puede editar contenedores ni resolver alertas',
  ],
  cuadrilla: [
    'Ver contenedores, mapa y alertas',
    'Resolver únicamente las alertas de su propia cuadrilla',
  ],
}

type Props = {
  perfil: Perfil
  cuadrilla: { nombre: string; zona_asignada: string | null } | null
}

export default function PerfilCliente({ perfil, cuadrilla }: Props) {
  const [supabase] = useState(() => crearClienteNavegador())

  const [nombre, setNombre] = useState(perfil.nombre ?? '')
  const [guardandoNombre, setGuardandoNombre] = useState(false)
  const [mensajeNombre, setMensajeNombre] = useState('')

  const [passwordNueva, setPasswordNueva] = useState('')
  const [passwordConfirmar, setPasswordConfirmar] = useState('')
  const [errorPassword, setErrorPassword] = useState('')
  const [confirmandoPassword, setConfirmandoPassword] = useState(false)
  const [guardandoPassword, setGuardandoPassword] = useState(false)

  const [toast, setToast] = useState<{ mensaje: string; tipo: ToastTipo } | null>(null)

  async function guardarNombre(e: React.FormEvent) {
    e.preventDefault()
    setGuardandoNombre(true)
    setMensajeNombre('')

    const { error } = await supabase.rpc('actualizar_mi_nombre', { nuevo_nombre: nombre })

    if (error) {
      setMensajeNombre(`No se pudo guardar: ${error.message}`)
    } else {
      setToast({ mensaje: 'Nombre actualizado.', tipo: 'exito' })
    }
    setGuardandoNombre(false)
  }

  function pedirConfirmacionPassword(e: React.FormEvent) {
    e.preventDefault()
    setErrorPassword('')

    if (passwordNueva.length < 6) {
      setErrorPassword('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (passwordNueva !== passwordConfirmar) {
      setErrorPassword('Las contraseñas no coinciden.')
      return
    }
    setConfirmandoPassword(true)
  }

  async function confirmarCambioPassword() {
    setGuardandoPassword(true)
    const { error } = await supabase.auth.updateUser({ password: passwordNueva })

    setConfirmandoPassword(false)
    setGuardandoPassword(false)

    if (error) {
      setErrorPassword(`No se pudo cambiar: ${error.message}`)
    } else {
      setPasswordNueva('')
      setPasswordConfirmar('')
      setToast({ mensaje: 'Contraseña actualizada.', tipo: 'exito' })
    }
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-xl mx-auto">
        <Link href="/" className="text-sm text-brand-emerald hover:underline">← Volver al panel</Link>
        <h1 className="text-2xl font-bold text-foreground mt-2 mb-6">Mi perfil</h1>

        <div className="tarjeta-interactiva rounded-2xl border border-brand-border bg-brand-surface/60 p-5 mb-6">
          <h2 className="font-semibold text-foreground mb-4">Cuenta</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className={`h-14 w-14 shrink-0 rounded-full flex items-center justify-center text-lg font-bold text-white ${rolColorAvatar[perfil.rol] ?? 'bg-brand-border'}`}>
              {iniciales(perfil.nombre, perfil.rol)}
            </div>
            <div>
              <p className="text-foreground font-semibold">{perfil.nombre || perfil.email}</p>
              <p className="text-sm text-brand-muted">{perfil.email}</p>
            </div>
          </div>
          <div className="text-sm">
            <p className="text-xs text-brand-muted">Rol</p>
            <p className="text-foreground">{rolEtiqueta[perfil.rol] ?? perfil.rol}</p>
          </div>
          <p className="text-xs text-brand-muted mt-4">
            El correo y el rol no son editables desde aquí — contacta al administrador del sistema si necesitas cambiarlos.
          </p>
        </div>

        <div className="tarjeta-interactiva rounded-2xl border border-brand-border bg-brand-surface/60 p-5 mb-6">
          <h2 className="font-semibold text-foreground mb-1">Capacidades de {rolEtiqueta[perfil.rol] ?? perfil.rol}</h2>
          <p className="text-xs text-brand-muted mb-3">
            Extensión específica del rol sobre el perfil base — cada rol hereda la cuenta de arriba y agrega lo suyo.
          </p>
          <ul className="space-y-1.5 text-sm text-foreground">
            {(capacidadesPorRol[perfil.rol] ?? []).map((c) => (
              <li key={c} className="flex items-start gap-2">
                <span className="text-brand-emerald mt-0.5" aria-hidden>•</span>
                {c}
              </li>
            ))}
          </ul>
          {perfil.rol === 'cuadrilla' && cuadrilla && (
            <div className="mt-4 pt-4 border-t border-brand-border text-sm">
              <p className="text-xs text-brand-muted">Cuadrilla asignada</p>
              <p className="text-foreground font-semibold">{cuadrilla.nombre}</p>
              {cuadrilla.zona_asignada && <p className="text-brand-muted">{cuadrilla.zona_asignada}</p>}
            </div>
          )}
        </div>

        <form onSubmit={guardarNombre} className="tarjeta-interactiva rounded-2xl border border-brand-border bg-brand-surface/60 p-5 mb-6 space-y-3">
          <h2 className="font-semibold text-foreground">Nombre para mostrar</h2>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full border border-brand-border bg-brand-bg rounded-lg px-3 py-2 text-sm text-foreground"
            placeholder="Tu nombre"
            maxLength={120}
          />
          {mensajeNombre && <p className="text-sm text-brand-coral">{mensajeNombre}</p>}
          <button
            type="submit"
            disabled={guardandoNombre || !nombre.trim()}
            className="text-sm font-semibold text-brand-bg bg-brand-emerald hover:brightness-110 transition px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {guardandoNombre ? 'Guardando...' : 'Guardar nombre'}
          </button>
        </form>

        <form onSubmit={pedirConfirmacionPassword} className="tarjeta-interactiva rounded-2xl border border-brand-border bg-brand-surface/60 p-5 space-y-3">
          <h2 className="font-semibold text-foreground">Cambiar contraseña</h2>
          <div>
            <label className="block text-xs font-semibold text-brand-muted mb-1">Nueva contraseña</label>
            <input
              type="password"
              value={passwordNueva}
              onChange={(e) => setPasswordNueva(e.target.value)}
              className="w-full border border-brand-border bg-brand-bg rounded-lg px-3 py-2 text-sm text-foreground"
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-muted mb-1">Confirmar contraseña</label>
            <input
              type="password"
              value={passwordConfirmar}
              onChange={(e) => setPasswordConfirmar(e.target.value)}
              className="w-full border border-brand-border bg-brand-bg rounded-lg px-3 py-2 text-sm text-foreground"
              minLength={6}
            />
          </div>
          {errorPassword && <p className="text-sm text-brand-coral">{errorPassword}</p>}
          <button
            type="submit"
            disabled={!passwordNueva || !passwordConfirmar}
            className="text-sm font-semibold text-brand-bg bg-brand-emerald hover:brightness-110 transition px-4 py-2 rounded-lg disabled:opacity-50"
          >
            Cambiar contraseña
          </button>
        </form>
      </div>

      <ModalConfirmacion
        abierto={confirmandoPassword}
        titulo="¿Cambiar tu contraseña?"
        descripcion="Vas a reemplazar tu contraseña actual por la nueva que escribiste. Tendrás que usar la nueva la próxima vez que inicies sesión."
        textoConfirmar="Sí, cambiarla"
        cargando={guardandoPassword}
        onConfirmar={confirmarCambioPassword}
        onCancelar={() => setConfirmandoPassword(false)}
      />

      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={() => setToast(null)} />}
    </main>
  )
}
