import Link from 'next/link'
import { exigirRol } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

type UsoTokens = {
  workflow: string
  modelo: string
  prompt_tokens: number | null
  completion_tokens: number | null
  total_tokens: number | null
}

type Alerta = { estado: string }

export default async function ReportesPage() {
  const perfil = await exigirRol('administrador', 'directiva')

  const { data: usoTokens } = await supabase
    .from('uso_tokens_ia')
    .select('workflow, modelo, prompt_tokens, completion_tokens, total_tokens')
  const filasTokens = (usoTokens ?? []) as UsoTokens[]

  const { data: alertas } = await supabase.from('alertas').select('estado')
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

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm text-blue-600 hover:underline">← Volver al panel</Link>
        <div className="flex items-center justify-between mt-2 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reportes y Gobierno de IA</h1>
          <span className="text-sm text-gray-500 capitalize">{perfil.rol}</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Alertas — pendientes vs. resueltas</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-700">{alertasPorEstado.pendiente}</p>
              <p className="text-xs text-red-600">Pendientes</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-700">{alertasPorEstado.enviada}</p>
              <p className="text-xs text-yellow-600">Enviadas</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{alertasPorEstado.resuelta}</p>
              <p className="text-xs text-green-600">Resueltas</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            {totalAlertas} alertas en total.{' '}
            {totalAlertas > 0 && (
              <>Tasa de resolución: {Math.round((alertasPorEstado.resuelta / totalAlertas) * 100)}%.</>
            )}
          </p>
          <Link href="/alertas" className="text-sm font-semibold text-blue-600 hover:underline mt-2 inline-block">
            Ver detalle de alertas →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Consumo de tokens de IA</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{totalLlamadas}</p>
              <p className="text-xs text-gray-500">Llamadas</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{totalTokens.toLocaleString('es-VE')}</p>
              <p className="text-xs text-gray-500">Tokens totales</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{promedioPorLlamada}</p>
              <p className="text-xs text-gray-500">Promedio/llamada</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            {totalPrompt.toLocaleString('es-VE')} tokens de entrada · {totalCompletion.toLocaleString('es-VE')} tokens de salida
          </p>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="pb-2">Modelo</th>
                <th className="pb-2 text-right">Llamadas</th>
                <th className="pb-2 text-right">Tokens</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(porModelo.entries()).map(([modelo, datos]) => (
                <tr key={modelo} className="border-b border-gray-50">
                  <td className="py-2 text-gray-700">{modelo}</td>
                  <td className="py-2 text-right text-gray-700">{datos.llamadas}</td>
                  <td className="py-2 text-right text-gray-700">{datos.tokens.toLocaleString('es-VE')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filasTokens.length && <p className="text-gray-400 text-sm">Sin registros de consumo todavía.</p>}
        </div>
      </div>
    </main>
  )
}
