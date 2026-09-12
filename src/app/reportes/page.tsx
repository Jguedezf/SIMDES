import Link from 'next/link'
import { exigirRol } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import ExportarReportes from './exportar-reportes'

type UsoTokens = {
  workflow: string
  modelo: string
  prompt_tokens: number | null
  completion_tokens: number | null
  total_tokens: number | null
}

type Alerta = { estado: string }

export default async function ReportesPage() {
  const [perfil, { data: usoTokens }, { data: alertas }] = await Promise.all([
    exigirRol('administrador', 'directiva'),
    supabase.from('uso_tokens_ia').select('workflow, modelo, prompt_tokens, completion_tokens, total_tokens'),
    supabase.from('alertas').select('estado'),
  ])
  const filasTokens = (usoTokens ?? []) as UsoTokens[]
  const filasAlertas = (alertas ?? []) as Alerta[]

  const totalLlamadas = filasTokens.length
  const totalTokens = filasTokens.reduce((s, f) => s + (f.total_tokens ?? 0), 0)
  const totalPrompt = filasTokens.reduce((s, f) => s + (f.prompt_tokens ?? 0), 0)
  const totalCompletion = filasTokens.reduce((s, f) => s + (f.completion_tokens ?? 0), 0)
  const promedioPorLlamada = totalLlamadas ? Math.round((totalTokens / totalLlamadas) * 10) / 10 : 0

  const porModelo = new Map<string, { llamadas: number; tokens: number }>()
  filasTokens.forEach((f) => {
    const actual = porModelo.get(f.modelo) ?? { llamadas: 0, tokens: 0 }
    actual.llamadas += 1
    actual.tokens += f.total_tokens ?? 0
    porModelo.set(f.modelo, actual)
  })

  const alertasPorEstado = { pendiente: 0, enviada: 0, resuelta: 0 } as Record<string, number>
  filasAlertas.forEach((a) => {
    alertasPorEstado[a.estado] = (alertasPorEstado[a.estado] ?? 0) + 1
  })
  const totalAlertas = filasAlertas.length
  const tasaResolucion = totalAlertas > 0 ? Math.round((alertasPorEstado.resuelta / totalAlertas) * 100) : null

  const datosReporte = {
    alertas: {
      pendiente: alertasPorEstado.pendiente,
      enviada: alertasPorEstado.enviada,
      resuelta: alertasPorEstado.resuelta,
      total: totalAlertas,
      tasaResolucion,
    },
    tokens: {
      totalLlamadas,
      totalTokens,
      totalPrompt,
      totalCompletion,
      promedioPorLlamada,
      porModelo: Array.from(porModelo.entries()).map(([modelo, d]) => ({ modelo, ...d })),
    },
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm text-brand-emerald hover:underline">← Volver al panel</Link>
        <div className="flex items-center justify-between mt-2 mb-6">
          <h1 className="text-2xl font-bold text-foreground">Reportes y Gobierno de IA</h1>
          <span className="text-sm text-brand-muted capitalize">{perfil.rol}</span>
        </div>

        <ExportarReportes datos={datosReporte} />

        <div className="rounded-2xl border border-brand-border bg-brand-surface/60 p-5 mb-6">
          <h2 className="font-semibold text-foreground mb-4">Alertas — pendientes vs. resueltas</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg p-3 text-center bg-brand-coral/10">
              <p className="text-2xl font-bold text-brand-coral">{alertasPorEstado.pendiente}</p>
              <p className="text-xs text-brand-coral/80">Pendientes</p>
            </div>
            <div className="rounded-lg p-3 text-center bg-brand-amber/10">
              <p className="text-2xl font-bold text-brand-amber">{alertasPorEstado.enviada}</p>
              <p className="text-xs text-brand-amber/80">Enviadas</p>
            </div>
            <div className="rounded-lg p-3 text-center bg-brand-emerald/10">
              <p className="text-2xl font-bold text-brand-emerald">{alertasPorEstado.resuelta}</p>
              <p className="text-xs text-brand-emerald/80">Resueltas</p>
            </div>
          </div>
          <p className="text-sm text-brand-muted">
            {totalAlertas} alertas en total.{' '}
            {tasaResolucion !== null && <>Tasa de resolución: {tasaResolucion}%.</>}
          </p>
          <Link href="/alertas" className="text-sm font-semibold text-brand-emerald hover:underline mt-2 inline-block">
            Ver detalle de alertas →
          </Link>
        </div>

        <div className="rounded-2xl border border-brand-border bg-brand-surface/60 p-5">
          <h2 className="font-semibold text-foreground mb-4">Consumo de tokens de IA</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg p-3 text-center bg-white/5">
              <p className="text-2xl font-bold text-foreground">{totalLlamadas}</p>
              <p className="text-xs text-brand-muted">Llamadas</p>
            </div>
            <div className="rounded-lg p-3 text-center bg-white/5">
              <p className="text-2xl font-bold text-foreground">{totalTokens.toLocaleString('es-VE')}</p>
              <p className="text-xs text-brand-muted">Tokens totales</p>
            </div>
            <div className="rounded-lg p-3 text-center bg-white/5">
              <p className="text-2xl font-bold text-foreground">{promedioPorLlamada}</p>
              <p className="text-xs text-brand-muted">Promedio/llamada</p>
            </div>
          </div>
          <p className="text-sm text-brand-muted mb-4">
            {totalPrompt.toLocaleString('es-VE')} tokens de entrada · {totalCompletion.toLocaleString('es-VE')} tokens de salida
          </p>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-brand-muted border-b border-brand-border">
                <th className="pb-2">Modelo</th>
                <th className="pb-2 text-right">Llamadas</th>
                <th className="pb-2 text-right">Tokens</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(porModelo.entries()).map(([modelo, datos]) => (
                <tr key={modelo} className="border-b border-brand-border/60 last:border-0">
                  <td className="py-2 text-foreground">{modelo}</td>
                  <td className="py-2 text-right text-brand-muted">{datos.llamadas}</td>
                  <td className="py-2 text-right text-brand-muted">{datos.tokens.toLocaleString('es-VE')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filasTokens.length && <p className="text-brand-muted text-sm">Sin registros de consumo todavía.</p>}
        </div>
      </div>
    </main>
  )
}
