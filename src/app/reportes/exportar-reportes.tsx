'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Toast, { type ToastTipo } from '@/components/toast'

export type DatosReporte = {
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
}

// jspdf-autotable extiende jsPDF en tiempo de ejecución con `lastAutoTable`,
// pero el tipo de jsPDF no lo declara — se tipa acá en vez de usar `any`.
type DocConAutoTable = jsPDF & { lastAutoTable: { finalY: number } }

function nombreArchivo(extension: string) {
  const fecha = new Date().toISOString().slice(0, 10)
  return `simdes-reporte-${fecha}.${extension}`
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
  doc.rect(0, 0, anchoPagina, 32, 'F')

  const logo = await cargarLogoBase64()
  if (logo) {
    doc.addImage(logo, 'PNG', 14, 6, 20, 20)
  }

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('SIMDES', logo ? 40 : 14, 16)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLOR_EMERALD)
  doc.text('Reporte de Gestión y Gobierno de IA', logo ? 40 : 14, 24)

  doc.setFontSize(9)
  doc.setTextColor(180, 180, 190)
  doc.text(`Generado: ${new Date().toLocaleString('es-VE')}`, anchoPagina - 14, 16, { align: 'right' })

  doc.setTextColor(0, 0, 0)

  autoTable(doc, {
    startY: 40,
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

  const alturaPagina = doc.internal.pageSize.getHeight()
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('SIMDES — Sistema Inteligente de Monitoreo y Predicción de Desechos Sólidos', 14, alturaPagina - 8)

  doc.save(nombreArchivo('pdf'))
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

async function exportarExcel(datos: DatosReporte) {
  const ExcelJS = (await import('exceljs')).default
  const libro = new ExcelJS.Workbook()
  libro.creator = 'SIMDES'
  libro.created = new Date()

  const hojaAlertas = libro.addWorksheet('Alertas')
  hojaAlertas.columns = [{ header: 'Alertas', key: 'a', width: 24 }, { header: 'Cantidad', key: 'b', width: 14 }]
  hojaAlertas.addRows([
    { a: 'Pendientes', b: datos.alertas.pendiente },
    { a: 'Enviadas', b: datos.alertas.enviada },
    { a: 'Resueltas', b: datos.alertas.resuelta },
    { a: 'Total', b: datos.alertas.total },
    { a: 'Tasa de resolución (%)', b: datos.alertas.tasaResolucion ?? 'N/A' },
  ])
  hojaAlertas.getRow(1).font = { bold: true }

  const hojaTokens = libro.addWorksheet('Consumo IA')
  hojaTokens.columns = [{ header: 'Métrica', key: 'a', width: 24 }, { header: 'Valor', key: 'b', width: 16 }]
  hojaTokens.addRows([
    { a: 'Llamadas', b: datos.tokens.totalLlamadas },
    { a: 'Tokens totales', b: datos.tokens.totalTokens },
    { a: 'Tokens de entrada', b: datos.tokens.totalPrompt },
    { a: 'Tokens de salida', b: datos.tokens.totalCompletion },
    { a: 'Promedio por llamada', b: datos.tokens.promedioPorLlamada },
  ])
  hojaTokens.getRow(1).font = { bold: true }
  hojaTokens.addRow([])
  const filaEncabezadoModelo = hojaTokens.addRow(['Modelo', 'Llamadas', 'Tokens'])
  filaEncabezadoModelo.font = { bold: true }
  datos.tokens.porModelo.forEach((m) => hojaTokens.addRow([m.modelo, m.llamadas, m.tokens]))

  const buffer = await libro.xlsx.writeBuffer()
  descargarBlob(
    buffer as ArrayBuffer,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    nombreArchivo('xlsx')
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
