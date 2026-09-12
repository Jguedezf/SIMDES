'use client'

import { useState } from 'react'
import Link from 'next/link'
import { crearClienteNavegador } from '@/lib/supabase-navegador'
import type { Perfil } from '@/lib/auth'

const rolEtiqueta: Record<string, string> = {
  administrador: 'Administrador',
  directiva: 'Directiva',
  cuadrilla: 'Cuadrilla',
}

export default function PerfilCliente({ perfil }: { perfil: Perfil }) {
  const [supabase] = useState(() => crearClienteNavegador())

  const [nombre, setNombre] = useState(perfil.nombre ?? '')
  const [guardandoNombre, setGuardandoNombre] = useState(false)
  const [mensajeNombre, setMensajeNombre] = useState('')

  const [passwordNueva, setPasswordNueva] = useState('')
  const [passwordConfirmar, setPasswordConfirmar] = useState('')
  const [guardandoPassword, setGuardandoPassword] = useState(false)
  const [mensajePassword, setMensajePassword] = useState('')

  async function guardarNombre(e: React.FormEvent) {
    e.preventDefault()
    setGuardandoNombre(true)
    setMensajeNombre('')

    const { error } = await supabase.rpc('actualizar_mi_nombre', { nuevo_nombre: nombre })

    setMensajeNombre(error ? `No se pudo guardar: ${error.message}` : 'Nombre actualizado.')
    setGuardandoNombre(false)
  }

  async function guardarPassword(e: React.FormEvent) {
    e.preventDefault()
    setMensajePassword('')

    if (passwordNueva.length < 6) {
      setMensajePassword('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (passwordNueva !== passwordConfirmar) {
      setMensajePassword('Las contraseñas no coinciden.')
      return
    }

    setGuardandoPassword(true)
    const { error } = await supabase.auth.updateUser({ password: passwordNueva })

    if (error) {
      setMensajePassword(`No se pudo cambiar: ${error.message}`)
    } else {
      setMensajePassword('Contraseña actualizada.')
      setPasswordNueva('')
      setPasswordConfirmar('')
    }
    setGuardandoPassword(false)
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-xl mx-auto">
        <Link href="/" className="text-sm text-brand-emerald hover:underline">← Volver al panel</Link>
        <h1 className="text-2xl font-bold text-foreground mt-2 mb-6">Mi perfil</h1>

        <div className="rounded-2xl border border-brand-border bg-brand-surface/60 p-5 mb-6">
          <h2 className="font-semibold text-foreground mb-4">Cuenta</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-brand-muted">Correo</p>
              <p className="text-foreground">{perfil.email}</p>
            </div>
            <div>
              <p className="text-xs text-brand-muted">Rol</p>
              <p className="text-foreground">{rolEtiqueta[perfil.rol] ?? perfil.rol}</p>
            </div>
          </div>
          <p className="text-xs text-brand-muted mt-4">
            El correo y el rol no son editables desde aquí — contacta al administrador del sistema si necesitas cambiarlos.
          </p>
        </div>

        <form onSubmit={guardarNombre} className="rounded-2xl border border-brand-border bg-brand-surface/60 p-5 mb-6 space-y-3">
          <h2 className="font-semibold text-foreground">Nombre para mostrar</h2>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full border border-brand-border bg-brand-bg rounded-lg px-3 py-2 text-sm text-foreground"
            placeholder="Tu nombre"
            maxLength={120}
          />
          {mensajeNombre && <p className="text-sm text-brand-muted">{mensajeNombre}</p>}
          <button
            type="submit"
            disabled={guardandoNombre || !nombre.trim()}
            className="text-sm font-semibold text-brand-bg bg-brand-emerald hover:brightness-110 transition px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {guardandoNombre ? 'Guardando...' : 'Guardar nombre'}
          </button>
        </form>

        <form onSubmit={guardarPassword} className="rounded-2xl border border-brand-border bg-brand-surface/60 p-5 space-y-3">
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
          {mensajePassword && <p className="text-sm text-brand-muted">{mensajePassword}</p>}
          <button
            type="submit"
            disabled={guardandoPassword || !passwordNueva || !passwordConfirmar}
            className="text-sm font-semibold text-brand-bg bg-brand-emerald hover:brightness-110 transition px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {guardandoPassword ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </main>
  )
}
