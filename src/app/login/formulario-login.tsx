'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { crearClienteNavegador } from '@/lib/supabase-navegador'

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function FormularioLogin({ fondo }: { fondo?: React.ReactNode }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [recordarDispositivo, setRecordarDispositivo] = useState(false)
  const [mostrarAyudaPassword, setMostrarAyudaPassword] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  function validar(): string | null {
    if (!REGEX_CORREO.test(email.trim())) return 'Ingresa un correo válido.'
    if (password.length === 0) return 'La contraseña es obligatoria.'
    return null
  }

  async function iniciarSesion(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const errorValidacion = validar()
    if (errorValidacion) {
      setError(errorValidacion)
      return
    }

    setEnviando(true)
    const supabase = crearClienteNavegador()
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      // Mensaje genérico deliberado: no se distingue "correo inexistente" de
      // "contraseña incorrecta", para no filtrar qué correos tienen cuenta.
      setError('Credenciales incorrectas.')
      setEnviando(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center p-6 relative overflow-hidden">
      {fondo}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(600px circle at 50% 0%, rgba(0,212,170,0.12), transparent 60%)',
        }}
      />

      <div className="w-full max-w-sm relative">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors mb-8"
        >
          <span aria-hidden>←</span> Volver a la página principal
        </Link>

        <div className="mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="SIMDES" className="h-16 w-auto" />
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Acceso al Portal SIMDES</h1>
          <p className="text-sm text-white/50 mt-1.5">
            Monitoreo y gestión de contenedores — administración, directiva y cuadrillas de recolección.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3.5 py-3 mb-5"
          >
            <span aria-hidden className="text-red-400 mt-0.5">⚠</span>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <form
          onSubmit={iniciarSesion}
          className="rounded-2xl border border-white/10 bg-[#1A1A2E] p-6 space-y-5 shadow-2xl"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5"
            >
              Correo
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#0D0D0D] px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#00D4AA]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#0D0D0D] px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#00D4AA]"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-white/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={recordarDispositivo}
                onChange={(e) => setRecordarDispositivo(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-white/20 bg-[#0D0D0D] accent-[#00D4AA]"
              />
              Recordar este dispositivo
            </label>
            <button
              type="button"
              onClick={() => setMostrarAyudaPassword((v) => !v)}
              className="text-white/50 hover:text-[#00D4AA] transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {mostrarAyudaPassword && (
            <p className="text-xs text-white/40 -mt-2">
              Contacta al administrador del sistema para restablecerla.
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full boton-pill bg-white px-4 py-2.5 text-sm font-semibold text-[#0D0D0D] transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] disabled:opacity-50 disabled:hover:shadow-none"
          >
            {enviando ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3.5 mt-3 text-center">
          <p className="text-sm text-white/40">
            ¿No tienes acceso? Contacta al administrador del sistema.
          </p>
        </div>
      </div>
    </main>
  )
}
