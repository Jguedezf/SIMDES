import Link from 'next/link'
import { exigirRol } from '@/lib/auth'
import { crearClienteServidor } from '@/lib/supabase-servidor'
import { calcularRango, diasDelRango } from '@/lib/rango-fechas'
import ExportarReportes from './exportar-reportes'
import GraficoAlertas from './grafico-alertas'
import GraficoHistorial, { type PuntoHistorial } from './grafico-historial'

type UsoTokens = {
  workflow: string
  modelo: string
  prompt_tokens: number | null
  completion_tokens: number | null
  total_tokens: number | null
}

type Alerta = { estado: string; creado_en: string }
type Contenedor = { id: string; codigo: string }
type UltimaLectura = { contenedor_id: string; timestamp: string }

// Un contenedor se considera "sin señal" si su sensor no reportó en las
// últimas 24h, o nunca reportó — pregunta de lógica pedida explícitamente
// por Johanna el 12/09 ("¿qué pasa cuando un sensor falla o deja de
// reportar?"): antes el reporting asumía implícitamente que todos
// respondían siempre.
const UMBRAL_SIN_SENAL_HORAS = 24

type BusquedaParams = { rango?: string; desde?: string; hasta?: string }

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<BusquedaParams>
}) {
  const sp = await searchParams
  const rango = calcularRango(sp)

  // uso_tokens_ia y reportes están restringidos a administrador/directiva a
  // nivel de RLS (no solo a nivel de página) — hace falta el cliente que
  // lleva la sesión (cookies), no el cliente anónimo, para que auth.uid()
  // resuelva dentro de la policy. Ver docs/BITACORA-LOCAL.md Bloque 22.
  const supabaseServidor = await crearClienteServidor()

  const [perfil, { data: usoTokens }, { data: alertas }, { data: contenedores }, { data: ultimasLecturas }] =
    await Promise.all([
      exigirRol('administrador', 'directiva'),
      supabaseServidor
        .from('uso_tokens_ia')
        .select('workflow, modelo, prompt_tokens, completion_tokens, total_tokens')
        .gte('timestamp', rango.desde.toISOString())
        .lte('timestamp', rango.hasta.toISOString()),
      supabaseServidor
        .from('alertas')
        .select('estado, creado_en')
        .gte('creado_en', rango.desde.toISOString())
        .lte('creado_en', rango.hasta.toISOString()),
      supabaseServidor.from('contenedores').select('id, codigo').is('eliminado_en', null),
      supabaseServidor.from('ultima_lectura_por_contenedor').select('contenedor_id, timestamp'),
    ])

  const filasTokens = (usoTokens ?? []) as UsoTokens[]
  const filasAlertas = (alertas ?? []) as Alerta[]
  const filasContenedores = (contenedores ?? []) as Contenedor[]
  const filasUltimaLectura = (ultimasLecturas ?? []) as UltimaLectura[]

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

  // Historial diario dentro del rango — incluye días sin alertas para que
  // el gráfico no tenga huecos, y desglosa por estado (no solo un total).
  const historialPorDia = new Map<string, PuntoHistorial>()
  diasDelRango(rango.desde, rango.hasta).forEach((dia) =>
    historialPorDia.set(dia, { fecha: dia, pendiente: 0, enviada: 0, resuelta: 0 })
  )
  filasAlertas.forEach((a) => {
    const dia = a.creado_en.slice(0, 10)
    const punto = historialPorDia.get(dia)
    if (punto && a.estado in punto) (punto as unknown as Record<string, number>)[a.estado] += 1
  })
  const datosHistorial = Array.from(historialPorDia.values())

  // Estado de sensores: activo si reportó dentro del umbral, sin señal si
  // nunca reportó o su última lectura está vencida. Independiente del rango
  // de fechas seleccionado — es un estado "ahora mismo" de la flota, no
  // histórico, por eso se calcula aparte de las alertas del período.
  const mapaUltimaLectura = new Map(filasUltimaLectura.map((l) => [l.contenedor_id, l.timestamp]))
  // Server Component: se ejecuta una vez por request en el servidor, no se
  // re-renderiza en el cliente — "ahora" aquí no es la impureza de hooks que
  // la regla busca prevenir (no hay hidratación ni re-render involucrados).
  // eslint-disable-next-line react-hooks/purity
  const ahora = Date.now()
  const sensoresSinSenal = filasContenedores.filter((c) => {
    const ultima = mapaUltimaLectura.get(c.id)
    if (!ultima) return true
    return (ahora - new Date(ultima).getTime()) / 3_600_000 > UMBRAL_SIN_SENAL_HORAS
  })
  const sensoresActivos = filasContenedores.length - sensoresSinSenal.length

  const datosReporte = {
    periodo: rango.etiqueta,
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
    sensores: {
      activos: sensoresActivos,
      sinSenal: sensoresSinSenal.map((c) => c.codigo),
    },
  }

  const enlaceRango = (preset: string) => `/reportes?rango=${preset}`

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-sm text-brand-emerald hover:underline">← Volver al panel</Link>
        <div className="flex items-center justify-between mt-2 mb-6">
          <h1 className="text-2xl font-bold text-foreground">Reportes y Gobierno de IA</h1>
          <span className="text-sm text-brand-muted capitalize">{perfil.rol}</span>
        </div>

        <ExportarReportes datos={datosReporte} />

        <div className="tarjeta-vidrio p-5 mb-6">
          <h2 className="font-semibold text-foreground mb-1">Período</h2>
          <p className="text-xs text-brand-muted mb-3">Todo el reporte de abajo (alertas, historial y tokens) corresponde a este rango.</p>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {(['hoy', 'semana', 'mes'] as const).map((preset) => (
              <Link
                key={preset}
                href={enlaceRango(preset)}
                className={`boton-pill text-sm font-semibold px-4 py-1.5 border transition ${
                  rango.preset === preset
                    ? 'bg-brand-emerald border-brand-emerald text-brand-bg'
                    : 'border-brand-border text-brand-muted hover:border-brand-emerald/50'
                }`}
              >
                {preset === 'hoy' ? 'Hoy' : preset === 'semana' ? 'Últimos 7 días' : 'Últimos 30 días'}
              </Link>
            ))}
          </div>
          <form method="get" className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="rango" value="custom" />
            <div>
              <label className="block text-xs font-semibold text-brand-muted mb-1">Desde</label>
              <input
                type="date"
                name="desde"
                defaultValue={rango.preset === 'custom' ? rango.desde.toISOString().slice(0, 10) : undefined}
                required
                className="border border-brand-border bg-brand-bg rounded-lg px-2 py-1.5 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-muted mb-1">Hasta</label>
              <input
                type="date"
                name="hasta"
                defaultValue={rango.preset === 'custom' ? rango.hasta.toISOString().slice(0, 10) : undefined}
                required
                className="border border-brand-border bg-brand-bg rounded-lg px-2 py-1.5 text-sm text-foreground"
              />
            </div>
            <button type="submit" className="boton-pill text-sm font-semibold text-foreground border border-brand-border hover:border-brand-emerald/50 px-4 py-1.5">
              Rango personalizado
            </button>
          </form>
          <p className="text-xs text-brand-muted mt-3">
            Mostrando: <span className="text-foreground font-medium">{rango.etiqueta}</span>
          </p>
        </div>

        <div className="tarjeta-interactiva tarjeta-vidrio p-5 mb-6">
          <h2 className="font-semibold text-foreground mb-4">Alertas — {rango.etiqueta}</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="tarjeta-interactiva rounded-lg p-3 text-center bg-brand-coral/10 border border-brand-coral/20">
              <p className="text-2xl font-bold text-brand-coral">⚠ {alertasPorEstado.pendiente}</p>
              <p className="text-xs text-brand-coral/80">Pendientes</p>
            </div>
            <div className="tarjeta-interactiva rounded-lg p-3 text-center bg-brand-amber/10 border border-brand-amber/20">
              <p className="text-2xl font-bold text-brand-amber">→ {alertasPorEstado.enviada}</p>
              <p className="text-xs text-brand-amber/80">Enviadas</p>
            </div>
            <div className="tarjeta-interactiva rounded-lg p-3 text-center bg-brand-emerald/10 border border-brand-emerald/20">
              <p className="text-2xl font-bold text-brand-emerald">✓ {alertasPorEstado.resuelta}</p>
              <p className="text-xs text-brand-emerald/80">Resueltas</p>
            </div>
          </div>

          <GraficoAlertas
            pendiente={alertasPorEstado.pendiente}
            enviada={alertasPorEstado.enviada}
            resuelta={alertasPorEstado.resuelta}
          />

          <p className="text-sm text-brand-muted mt-4">
            {totalAlertas} alertas en {rango.etiqueta}.{' '}
            {tasaResolucion !== null && <>Tasa de resolución: {tasaResolucion}%.</>}
          </p>
          <Link href="/alertas" className="text-sm font-semibold text-brand-emerald hover:underline mt-2 inline-block">
            Ver detalle de alertas →
          </Link>

          <div className="mt-6 pt-5 border-t border-brand-border">
            <h3 className="font-semibold text-foreground mb-3 text-sm">Historial diario por estado</h3>
            <GraficoHistorial datos={datosHistorial} />
          </div>
        </div>

        <div className="tarjeta-interactiva tarjeta-vidrio p-5 mb-6">
          <h2 className="font-semibold text-foreground mb-1">Estado de sensores</h2>
          <p className="text-xs text-brand-muted mb-4">
            Un contenedor queda &quot;sin señal&quot; si su sensor no reportó ninguna lectura en las últimas {UMBRAL_SIN_SENAL_HORAS} horas, o nunca reportó — no se asume que todos los sensores siempre responden.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="tarjeta-interactiva rounded-lg p-3 text-center bg-brand-emerald/10 border border-brand-emerald/20">
              <p className="text-2xl font-bold text-brand-emerald">✓ {sensoresActivos}</p>
              <p className="text-xs text-brand-emerald/80">Con señal reciente</p>
            </div>
            <div className={`tarjeta-interactiva rounded-lg p-3 text-center border ${sensoresSinSenal.length ? 'bg-brand-coral/10 border-brand-coral/20' : 'bg-white/5 border-transparent'}`}>
              <p className={`text-2xl font-bold ${sensoresSinSenal.length ? 'text-brand-coral' : 'text-foreground'}`}>
                {sensoresSinSenal.length ? '⚠' : ''} {sensoresSinSenal.length}
              </p>
              <p className={`text-xs ${sensoresSinSenal.length ? 'text-brand-coral/80' : 'text-brand-muted'}`}>Sin señal</p>
            </div>
          </div>
          {sensoresSinSenal.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {sensoresSinSenal.map((c) => (
                <Link
                  key={c.id}
                  href={`/contenedor/${c.id}`}
                  className="text-xs font-mono font-semibold px-2 py-1 rounded-full bg-brand-coral/15 text-brand-coral hover:bg-brand-coral/25 transition"
                >
                  {c.codigo}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="tarjeta-interactiva tarjeta-vidrio p-5">
          <h2 className="font-semibold text-foreground mb-4">Consumo de tokens de IA — {rango.etiqueta}</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="tarjeta-interactiva rounded-lg p-3 text-center bg-white/5 border border-transparent">
              <p className="text-2xl font-bold text-foreground">{totalLlamadas}</p>
              <p className="text-xs text-brand-muted">Llamadas</p>
            </div>
            <div className="tarjeta-interactiva rounded-lg p-3 text-center bg-white/5 border border-transparent">
              <p className="text-2xl font-bold text-foreground">{totalTokens.toLocaleString('es-VE')}</p>
              <p className="text-xs text-brand-muted">Tokens totales</p>
            </div>
            <div className="tarjeta-interactiva rounded-lg p-3 text-center bg-white/5 border border-transparent">
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
                <tr key={modelo} className="border-b border-brand-border/60 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="py-2 text-foreground">{modelo}</td>
                  <td className="py-2 text-right text-brand-muted">{datos.llamadas}</td>
                  <td className="py-2 text-right text-brand-muted">{datos.tokens.toLocaleString('es-VE')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filasTokens.length && <p className="text-brand-muted text-sm">Sin registros de consumo en {rango.etiqueta}.</p>}
        </div>
      </div>
    </main>
  )
}
