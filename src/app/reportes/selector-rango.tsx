'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

function aIso(fecha: Date) {
  return fecha.toISOString().slice(0, 10)
}

function mismoDia(a: Date | null, b: Date | null) {
  return !!a && !!b && aIso(a) === aIso(b)
}

// Selector de rango compacto (un calendario chico, no el <input type="date">
// nativo) — el popup del calendario nativo del navegador no se puede
// redimensionar por CSS y "domina la pantalla" (feedback de Johanna,
// 12/09 noche). Dos clics: el primero fija "desde", el segundo "hasta".
export default function SelectorRango({
  desdeInicial,
  hastaInicial,
}: {
  desdeInicial: string | null
  hastaInicial: string | null
}) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [desde, setDesde] = useState<Date | null>(desdeInicial ? new Date(`${desdeInicial}T00:00:00`) : null)
  const [hasta, setHasta] = useState<Date | null>(hastaInicial ? new Date(`${hastaInicial}T00:00:00`) : null)
  const [mesVisible, setMesVisible] = useState(() => {
    const base = desde ?? new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })
  const contenedorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function manejarClicFuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) setAbierto(false)
    }
    document.addEventListener('mousedown', manejarClicFuera)
    return () => document.removeEventListener('mousedown', manejarClicFuera)
  }, [])

  function alHacerClicEnDia(dia: Date) {
    if (!desde || (desde && hasta)) {
      setDesde(dia)
      setHasta(null)
      return
    }
    if (dia < desde) {
      setHasta(desde)
      setDesde(dia)
    } else {
      setHasta(dia)
    }
  }

  function aplicar() {
    if (!desde) return
    const hastaFinal = hasta ?? desde
    router.push(`/reportes?rango=custom&desde=${aIso(desde)}&hasta=${aIso(hastaFinal)}`)
    setAbierto(false)
  }

  const primerDiaMes = new Date(mesVisible.getFullYear(), mesVisible.getMonth(), 1)
  const diasEnMes = new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 0).getDate()
  const offsetInicial = (primerDiaMes.getDay() + 6) % 7 // semana empieza en lunes
  const celdas: (Date | null)[] = [
    ...Array(offsetInicial).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => new Date(mesVisible.getFullYear(), mesVisible.getMonth(), i + 1)),
  ]

  const etiquetaBoton = desde
    ? `${aIso(desde)}${hasta ? ` → ${aIso(hasta)}` : ''}`
    : 'Rango personalizado'

  return (
    <div className="relative inline-block" ref={contenedorRef}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="boton-pill text-sm font-semibold text-foreground border border-brand-border hover:border-brand-emerald/50 px-4 py-1.5"
      >
        📅 {etiquetaBoton}
      </button>

      {abierto && (
        <div className="modal-entrada absolute z-40 mt-2 popover-solido p-3 w-64 left-0">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className={`rounded-lg px-2 py-1.5 border transition ${!hasta && desde ? 'border-brand-emerald bg-brand-emerald/10' : 'border-brand-border'}`}>
              <p className="text-[9px] uppercase tracking-wide text-brand-muted">Desde</p>
              <p className="text-xs font-semibold text-foreground">{desde ? aIso(desde) : '—'}</p>
            </div>
            <div className={`rounded-lg px-2 py-1.5 border transition ${desde && !hasta ? 'border-brand-emerald/40' : 'border-brand-border'}`}>
              <p className="text-[9px] uppercase tracking-wide text-brand-muted">Hasta</p>
              <p className="text-xs font-semibold text-foreground">{hasta ? aIso(hasta) : '—'}</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setMesVisible(new Date(mesVisible.getFullYear(), mesVisible.getMonth() - 1, 1))}
              className="text-brand-muted hover:text-foreground px-1.5 py-0.5 rounded transition"
              aria-label="Mes anterior"
            >
              ‹
            </button>
            <p className="text-xs font-semibold text-foreground capitalize">
              {MESES[mesVisible.getMonth()]} {mesVisible.getFullYear()}
            </p>
            <button
              type="button"
              onClick={() => setMesVisible(new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 1))}
              className="text-brand-muted hover:text-foreground px-1.5 py-0.5 rounded transition"
              aria-label="Mes siguiente"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {DIAS.map((d) => (
              <p key={d} className="text-center text-[10px] text-brand-muted py-0.5">{d}</p>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {celdas.map((dia, i) => {
              if (!dia) return <div key={`vacio-${i}`} />
              const enRango = desde && hasta && dia >= desde && dia <= hasta
              const esLimite = mismoDia(dia, desde) || mismoDia(dia, hasta)
              return (
                <button
                  key={dia.toISOString()}
                  type="button"
                  onClick={() => alHacerClicEnDia(dia)}
                  className={`text-xs h-7 w-7 rounded-full transition ${
                    esLimite
                      ? 'bg-brand-emerald text-brand-bg font-semibold'
                      : enRango
                        ? 'bg-brand-emerald/20 text-foreground'
                        : 'text-foreground hover:bg-white/10'
                  }`}
                >
                  {dia.getDate()}
                </button>
              )
            })}
          </div>

          <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-brand-border">
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="text-xs font-medium text-brand-muted hover:text-foreground px-2 py-1"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={aplicar}
              disabled={!desde}
              className="boton-pill text-xs font-semibold bg-brand-emerald text-brand-bg px-3 py-1 disabled:opacity-50"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
