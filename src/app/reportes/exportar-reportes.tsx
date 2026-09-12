'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Toast, { type ToastTipo } from '@/components/toast'

export type DatosReporte = {
  periodo: string
  historial: { fecha: string; pendiente: number; enviada: number; resuelta: number }[]
  alertas: {
    pendiente: number
    enviada: number
    resuelta: number
    total: number
    tasaResolucion: number | null
  }
  tokens: {
    totalLlamadas: number
    totalTokens: number
    totalPrompt: number
    totalCompletion: number
    promedioPorLlamada: number
    porModelo: { modelo: string; llamadas: number; tokens: number }[]
  }
  sensores: {
    activos: number
    sinSenal: string[]
  }
}

// jspdf-autotable extiende jsPDF en tiempo de ejecución con `lastAutoTable`,
// pero el tipo de jsPDF no lo declara — se tipa acá en vez de usar `any`.
type DocConAutoTable = jsPDF & { lastAutoTable: { finalY: number } }

function nombreArchivo(extension: string, periodo: string) {
  const fecha = new Date().toISOString().slice(0, 10)
  const periodoSeguro = periodo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return `simdes-reporte-${periodoSeguro}-${fecha}.${extension}`
}

// Convierte el logo público a data URL para poder embeberlo en el PDF —
// jsPDF corre en el navegador, no puede leer el archivo del filesystem.
// El logo original es 1254x1254 (~1.2MB) — insertarlo tal cual infla el PDF
// a varios MB aunque se muestre pequeño (jsPDF embebe los píxeles reales,
// no el tamaño de despliegue). Se redimensiona a 160x160 vía canvas antes
// de convertir a base64.
async function cargarLogoBase64(): Promise<string | null> {
  try {
    const res = await fetch('/images/logo.png')
    const blob = await res.blob()
    const bitmap = await createImageBitmap(blob)

    const tamano = 160
    const canvas = document.createElement('canvas')
    canvas.width = tamano
    canvas.height = tamano
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(bitmap, 0, 0, tamano, tamano)

    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

const COLOR_FONDO_OSCURO: [number, number, number] = [13, 13, 13]
const COLOR_EMERALD: [number, number, number] = [0, 212, 170]

async function exportarPDF(datos: DatosReporte) {
  const doc = new jsPDF() as DocConAutoTable
  const anchoPagina = doc.internal.pageSize.getWidth()

  // Encabezado de marca: banda oscura con logo, en vez de texto plano sobre
  // fondo blanco — Johanna lo describió como "horrible" en su forma anterior.
  doc.setFillColor(...COLOR_FONDO_OSCURO)
  doc.rect(0, 0, anchoPagina, 30, 'F')

  const logo = await cargarLogoBase64()
  if (logo) {
    doc.addImage(logo, 'PNG', 14, 5, 18, 18)
  }

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(17)
  doc.setFont('helvetica', 'bold')
  doc.text('SIMDES', logo ? 37 : 14, 15)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLOR_EMERALD)
  doc.text('Reporte de Gestión y Gobierno de IA', logo ? 37 : 14, 22)

  // Banner de período — pedido explícito de Johanna (12/09): antes era texto
  // gris pequeño en la esquina, casi invisible. Ahora es una franja propia,
  // el primer dato que se lee después del logo, no una nota al pie.
  doc.setFillColor(...COLOR_EMERALD)
  doc.rect(0, 30, anchoPagina, 11, 'F')
  doc.setTextColor(...COLOR_FONDO_OSCURO)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`PERÍODO DEL REPORTE: ${datos.periodo.toUpperCase()}`, 14, 37.5)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generado: ${new Date().toLocaleString('es-VE')}`, anchoPagina - 14, 37.5, { align: 'right' })

  doc.setTextColor(0, 0, 0)

  autoTable(doc, {
    startY: 48,
    head: [['Alertas', 'Cantidad']],
    body: [
      ['Pendientes', String(datos.alertas.pendiente)],
      ['Enviadas', String(datos.alertas.enviada)],
      ['Resueltas', String(datos.alertas.resuelta)],
      ['Total', String(datos.alertas.total)],
      ['Tasa de resolución', datos.alertas.tasaResolucion !== null ? `${datos.alertas.tasaResolucion}%` : 'N/A'],
    ],
    headStyles: { fillColor: [0, 212, 170] },
  })

  if (datos.historial.length) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Fecha', 'Pendientes', 'Enviadas', 'Resueltas']],
      body: datos.historial.map((h) => [h.fecha, String(h.pendiente), String(h.enviada), String(h.resuelta)]),
      headStyles: { fillColor: [0, 212, 170] },
      styles: { fontSize: 8 },
    })
  }

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Consumo de tokens de IA', 'Valor']],
    body: [
      ['Llamadas', String(datos.tokens.totalLlamadas)],
      ['Tokens totales', datos.tokens.totalTokens.toLocaleString('es-VE')],
      ['Tokens de entrada', datos.tokens.totalPrompt.toLocaleString('es-VE')],
      ['Tokens de salida', datos.tokens.totalCompletion.toLocaleString('es-VE')],
      ['Promedio por llamada', String(datos.tokens.promedioPorLlamada)],
    ],
    headStyles: { fillColor: [0, 212, 170] },
  })

  if (datos.tokens.porModelo.length) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Modelo', 'Llamadas', 'Tokens']],
      body: datos.tokens.porModelo.map((m) => [m.modelo, String(m.llamadas), m.tokens.toLocaleString('es-VE')]),
      headStyles: { fillColor: [0, 212, 170] },
    })
  }

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Estado de sensores', 'Cantidad']],
    body: [
      ['Con señal reciente', String(datos.sensores.activos)],
      ['Sin señal (' + '>' + '24h o nunca reportó)', String(datos.sensores.sinSenal.length)],
      ...(datos.sensores.sinSenal.length ? [['Contenedores afectados', datos.sensores.sinSenal.join(', ')]] : []),
    ],
    headStyles: { fillColor: [0, 212, 170] },
  })

  const alturaPagina = doc.internal.pageSize.getHeight()
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('SIMDES — Sistema Inteligente de Monitoreo y Predicción de Desechos Sólidos', 14, alturaPagina - 8)

  doc.save(nombreArchivo('pdf', datos.periodo))
}

function descargarBlob(buffer: ArrayBuffer, tipo: string, nombre: string) {
  const blob = new Blob([buffer], { type: tipo })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  URL.revokeObjectURL(url)
}

// jsPDF y Excel comparten estas hex — ARGB con 'FF' de alfa por delante,
// formato que exige exceljs.
const ARGB_FONDO_OSCURO = 'FF0D0D0D'
const ARGB_EMERALD = 'FF00D4AA'
const ARGB_BORDE = 'FF2A2A45'
const ARGB_BLANCO = 'FFF5F5F7'

type ExcelJSModulo = typeof import('exceljs')
type Workbook = InstanceType<ExcelJSModulo['Workbook']>
type Worksheet = ReturnType<Workbook['addWorksheet']>

const bordeFino = {
  top: { style: 'thin' as const, color: { argb: ARGB_BORDE } },
  left: { style: 'thin' as const, color: { argb: ARGB_BORDE } },
  bottom: { style: 'thin' as const, color: { argb: ARGB_BORDE } },
  right: { style: 'thin' as const, color: { argb: ARGB_BORDE } },
}

// Encabezado de marca consistente en cada hoja: logo + banda oscura con el
// título + banda esmeralda con el período, igual que el PDF — antes el
// Excel era una tabla plana sin logo ni formato, muy por detrás de la
// pantalla y el PDF (feedback de Johanna, 12/09 madrugada).
function agregarEncabezadoHoja(hoja: Worksheet, libro: Workbook, logo: string | null, periodo: string, columnas: number) {
  const ultimaLetra = String.fromCharCode(65 + columnas - 1)

  if (logo) {
    const imgId = libro.addImage({ base64: logo, extension: 'png' })
    hoja.addImage(imgId, 'A1:A3')
  }

  hoja.mergeCells(`B1:${ultimaLetra}1`)
  const celdaTitulo = hoja.getCell('B1')
  celdaTitulo.value = 'SIMDES — Reporte de Gestión y Gobierno de IA'
  celdaTitulo.font = { bold: true, size: 13, color: { argb: ARGB_BLANCO } }
  celdaTitulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB_FONDO_OSCURO } }
  celdaTitulo.alignment = { vertical: 'middle' }
  hoja.getRow(1).height = 24

  hoja.mergeCells(`B2:${ultimaLetra}2`)
  const celdaPeriodo = hoja.getCell('B2')
  celdaPeriodo.value = `PERÍODO DEL REPORTE: ${periodo.toUpperCase()}`
  celdaPeriodo.font = { bold: true, size: 11, color: { argb: ARGB_FONDO_OSCURO } }
  celdaPeriodo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB_EMERALD } }
  celdaPeriodo.alignment = { vertical: 'middle' }
  hoja.getRow(2).height = 20

  hoja.getRow(3).height = 8
}

function estilizarFilaEncabezado(fila: ReturnType<Worksheet['getRow']>) {
  fila.eachCell((celda) => {
    celda.font = { bold: true, color: { argb: ARGB_FONDO_OSCURO } }
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB_EMERALD } }
    celda.border = bordeFino
    celda.alignment = { vertical: 'middle' }
  })
}

function estilizarFilaDatos(fila: ReturnType<Worksheet['getRow']>) {
  fila.eachCell((celda) => {
    celda.border = bordeFino
  })
}

// Barra de datos nativa de Excel (conditional formatting) — es lo que se le
// puede pedir honestamente a exceljs como "gráfica nativa dentro de la
// celda": la librería no genera objetos <c:chart> reales (ni la tenía la
// alternativa xlsx/SheetJS gratuita que se descartó por seguridad el 12/09),
// construir ese XML a mano a esta altura del proyecto es un riesgo real de
// corromper el archivo. La barra de datos SÍ es 100% nativa de Excel (no una
// imagen pegada) y el usuario puede seleccionar cualquier tabla de esta hoja
// e insertar un gráfico real de Excel en 2 clics si lo necesita.
function agregarBarraDeDatos(hoja: Worksheet, rango: string, prioridad: number) {
  hoja.addConditionalFormatting({
    ref: rango,
    rules: [
      {
        type: 'dataBar',
        priority: prioridad,
        gradient: false,
        showValue: true,
        border: true,
        cfvo: [{ type: 'min' }, { type: 'max' }],
        color: { argb: ARGB_EMERALD },
      } as never,
    ],
  })
}

async function exportarExcel(datos: DatosReporte) {
  const ExcelJS = (await import('exceljs')).default
  const libro = new ExcelJS.Workbook()
  libro.creator = 'SIMDES'
  libro.created = new Date()
  const logo = await cargarLogoBase64()

  // --- Resumen (portada) ---
  const hojaResumen = libro.addWorksheet('Resumen')
  hojaResumen.columns = [{ width: 4 }, { width: 30 }, { width: 18 }]
  agregarEncabezadoHoja(hojaResumen, libro, logo, datos.periodo, 3)
  const filaEncResumen = hojaResumen.addRow(['', 'Indicador', 'Valor'])
  estilizarFilaEncabezado(filaEncResumen)
  ;[
    ['Alertas en el período', datos.alertas.total],
    ['Tasa de resolución', datos.alertas.tasaResolucion !== null ? `${datos.alertas.tasaResolucion}%` : 'N/A'],
    ['Llamadas de IA', datos.tokens.totalLlamadas],
    ['Tokens totales consumidos', datos.tokens.totalTokens],
    ['Contenedores con señal', datos.sensores.activos],
    ['Contenedores sin señal', datos.sensores.sinSenal.length],
  ].forEach((fila) => estilizarFilaDatos(hojaResumen.addRow(['', ...fila])))
  hojaResumen.getColumn(1).width = 4

  // --- Alertas ---
  const hojaAlertas = libro.addWorksheet('Alertas')
  hojaAlertas.columns = [{ width: 4 }, { width: 24 }, { width: 14 }]
  agregarEncabezadoHoja(hojaAlertas, libro, logo, datos.periodo, 3)
  estilizarFilaEncabezado(hojaAlertas.addRow(['', 'Alertas', 'Cantidad']))
  const filaInicioAlertas = hojaAlertas.rowCount + 1
  ;[
    ['Pendientes', datos.alertas.pendiente],
    ['Enviadas', datos.alertas.enviada],
    ['Resueltas', datos.alertas.resuelta],
    ['Total', datos.alertas.total],
  ].forEach((fila) => estilizarFilaDatos(hojaAlertas.addRow(['', ...fila])))
  estilizarFilaDatos(hojaAlertas.addRow(['', 'Tasa de resolución (%)', datos.alertas.tasaResolucion ?? 'N/A']))
  agregarBarraDeDatos(hojaAlertas, `C${filaInicioAlertas}:C${filaInicioAlertas + 3}`, 1)

  // --- Historial diario ---
  const hojaHistorial = libro.addWorksheet('Historial diario')
  hojaHistorial.columns = [{ width: 4 }, { width: 14 }, { width: 12 }, { width: 12 }, { width: 12 }]
  agregarEncabezadoHoja(hojaHistorial, libro, logo, datos.periodo, 5)
  estilizarFilaEncabezado(hojaHistorial.addRow(['', 'Fecha', 'Pendientes', 'Enviadas', 'Resueltas']))
  const filaInicioHistorial = hojaHistorial.rowCount + 1
  datos.historial.forEach((h) =>
    estilizarFilaDatos(hojaHistorial.addRow(['', h.fecha, h.pendiente, h.enviada, h.resuelta]))
  )
  if (datos.historial.length) {
    const filaFinHistorial = filaInicioHistorial + datos.historial.length - 1
    agregarBarraDeDatos(hojaHistorial, `C${filaInicioHistorial}:C${filaFinHistorial}`, 2)
    agregarBarraDeDatos(hojaHistorial, `D${filaInicioHistorial}:D${filaFinHistorial}`, 3)
    agregarBarraDeDatos(hojaHistorial, `E${filaInicioHistorial}:E${filaFinHistorial}`, 4)
  }

  // --- Consumo IA ---
  const hojaTokens = libro.addWorksheet('Consumo IA')
  hojaTokens.columns = [{ width: 4 }, { width: 24 }, { width: 16 }]
  agregarEncabezadoHoja(hojaTokens, libro, logo, datos.periodo, 3)
  estilizarFilaEncabezado(hojaTokens.addRow(['', 'Métrica', 'Valor']))
  ;[
    ['Llamadas', datos.tokens.totalLlamadas],
    ['Tokens totales', datos.tokens.totalTokens],
    ['Tokens de entrada', datos.tokens.totalPrompt],
    ['Tokens de salida', datos.tokens.totalCompletion],
    ['Promedio por llamada', datos.tokens.promedioPorLlamada],
  ].forEach((fila) => estilizarFilaDatos(hojaTokens.addRow(['', ...fila])))
  if (datos.tokens.porModelo.length) {
    hojaTokens.addRow([])
    estilizarFilaEncabezado(hojaTokens.addRow(['', 'Modelo', 'Llamadas', 'Tokens']))
    datos.tokens.porModelo.forEach((m) => estilizarFilaDatos(hojaTokens.addRow(['', m.modelo, m.llamadas, m.tokens])))
  }

  // --- Sensores ---
  const hojaSensores = libro.addWorksheet('Sensores')
  hojaSensores.columns = [{ width: 4 }, { width: 26 }, { width: 14 }]
  agregarEncabezadoHoja(hojaSensores, libro, logo, datos.periodo, 3)
  estilizarFilaEncabezado(hojaSensores.addRow(['', 'Estado', 'Cantidad']))
  estilizarFilaDatos(hojaSensores.addRow(['', 'Con señal reciente', datos.sensores.activos]))
  estilizarFilaDatos(hojaSensores.addRow(['', 'Sin señal (>24h o nunca reportó)', datos.sensores.sinSenal.length]))
  if (datos.sensores.sinSenal.length) {
    hojaSensores.addRow([])
    estilizarFilaEncabezado(hojaSensores.addRow(['', 'Contenedores sin señal', '']))
    datos.sensores.sinSenal.forEach((codigo) => estilizarFilaDatos(hojaSensores.addRow(['', codigo])))
  }

  const buffer = await libro.xlsx.writeBuffer()
  descargarBlob(
    buffer as ArrayBuffer,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    nombreArchivo('xlsx', datos.periodo)
  )
}

export default function ExportarReportes({ datos }: { datos: DatosReporte }) {
  const [exportandoPDF, setExportandoPDF] = useState(false)
  const [exportandoExcel, setExportandoExcel] = useState(false)
  const [toast, setToast] = useState<{ mensaje: string; tipo: ToastTipo } | null>(null)

  async function manejarPDF() {
    setExportandoPDF(true)
    try {
      await exportarPDF(datos)
      setToast({ mensaje: 'PDF generado y descargado.', tipo: 'exito' })
    } catch {
      setToast({ mensaje: 'No se pudo generar el PDF.', tipo: 'error' })
    } finally {
      setExportandoPDF(false)
    }
  }

  async function manejarExcel() {
    setExportandoExcel(true)
    try {
      await exportarExcel(datos)
      setToast({ mensaje: 'Excel generado y descargado.', tipo: 'exito' })
    } catch {
      setToast({ mensaje: 'No se pudo generar el Excel.', tipo: 'error' })
    } finally {
      setExportandoExcel(false)
    }
  }

  return (
    <>
      <div className="flex gap-2 mb-6">
        <button
          onClick={manejarPDF}
          disabled={exportandoPDF}
          className="boton-pill text-sm font-semibold text-brand-bg bg-brand-emerald hover:brightness-110 px-5 py-2 disabled:opacity-50"
        >
          {exportandoPDF ? 'Generando...' : 'Exportar PDF'}
        </button>
        <button
          onClick={manejarExcel}
          disabled={exportandoExcel}
          className="boton-pill text-sm font-semibold text-foreground border border-brand-border hover:border-brand-emerald/50 px-5 py-2 disabled:opacity-50"
        >
          {exportandoExcel ? 'Generando...' : 'Exportar Excel'}
        </button>
      </div>

      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={() => setToast(null)} />}
    </>
  )
}
