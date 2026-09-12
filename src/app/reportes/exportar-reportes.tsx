'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

function exportarPDF(datos: DatosReporte) {
  const doc = new jsPDF() as DocConAutoTable
  doc.setFontSize(16)
  doc.text('SIMDES — Reporte de Gestión', 14, 18)
  doc.setFontSize(10)
  doc.setTextColor(120)
  doc.text(`Generado: ${new Date().toLocaleString('es-VE')}`, 14, 25)
  doc.setTextColor(0)

  autoTable(doc, {
    startY: 32,
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
  const [exportandoExcel, setExportandoExcel] = useState(false)

  async function manejarExcel() {
    setExportandoExcel(true)
    try {
      await exportarExcel(datos)
    } finally {
      setExportandoExcel(false)
    }
  }

  return (
    <div className="flex gap-2 mb-6">
      <button
        onClick={() => exportarPDF(datos)}
        className="text-sm font-semibold text-brand-bg bg-brand-emerald hover:brightness-110 transition px-4 py-2 rounded-lg"
      >
        Exportar PDF
      </button>
      <button
        onClick={manejarExcel}
        disabled={exportandoExcel}
        className="text-sm font-semibold text-foreground border border-brand-border hover:border-brand-emerald/50 transition px-4 py-2 rounded-lg disabled:opacity-50"
      >
        {exportandoExcel ? 'Generando...' : 'Exportar Excel'}
      </button>
    </div>
  )
}
