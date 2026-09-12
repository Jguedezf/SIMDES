#!/usr/bin/env node
// Simulador manual de lecturas de sensor para SIMDES.
//
// Uso:
//   node scripts/simular-contenedores.js
//
// Qué hace: por cada contenedor registrado en Supabase, envía UNA lectura simulada
// mediante POST al webhook real de n8n (el mismo que usa el botón "Simular lectura"
// en /contenedor/[id]). No inserta nada directo en `lecturas_sensor` — cada lectura
// pasa por el flujo completo (persistencia, cálculo de riesgo por IA, alerta a Telegram
// si supera el umbral), igual que si viniera de un sensor real.
//
// Este script NO se ejecuta automáticamente (no es un cron ni un watcher). Se corre
// a mano cada vez que se quiera generar tráfico de demo.

const fs = require('fs')
const path = require('path')

const WEBHOOK_URL = 'https://simdes.app.n8n.cloud/webhook/lectura-contenedor'

function cargarEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) return
  for (const linea of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
}

cargarEnvLocal()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (revisa .env.local).')
  process.exit(1)
}

// Perfiles de nivel para dar variedad realista entre los 20 contenedores:
// algunos bajos y estables, algunos subiendo, y al menos uno crítico sostenido.
const PERFILES = [
  { nombre: 'bajo', min: 5, max: 25 },
  { nombre: 'subiendo', min: 40, max: 70 },
  { nombre: 'alto', min: 75, max: 89 },
  { nombre: 'critico_sostenido', min: 90, max: 98 },
]

function elegirPerfil(indice) {
  // Reparte los perfiles de forma cíclica pero garantiza al menos un crítico sostenido.
  if (indice === 0) return PERFILES[3]
  return PERFILES[indice % PERFILES.length]
}

function nivelAleatorio(perfil) {
  return Math.floor(Math.random() * (perfil.max - perfil.min + 1)) + perfil.min
}

async function obtenerContenedores() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/contenedores?select=id,codigo,latitud,longitud&estado=eq.activo&order=codigo`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  )
  if (!res.ok) throw new Error(`No se pudo leer contenedores desde Supabase (HTTP ${res.status})`)
  return res.json()
}

async function enviarLectura(contenedor, nivelPct) {
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contenedor_id: contenedor.id,
      nivel_pct: nivelPct,
      ubicacion: contenedor.codigo,
      latitud: contenedor.latitud !== null ? Number(contenedor.latitud) : null,
      longitud: contenedor.longitud !== null ? Number(contenedor.longitud) : null,
      leido_en: new Date().toISOString(),
    }),
  })
  return res
}

async function main() {
  const contenedores = await obtenerContenedores()
  if (!contenedores.length) {
    console.log('No hay contenedores activos en la base de datos.')
    return
  }

  console.log(`Enviando ${contenedores.length} lecturas simuladas al webhook de n8n...\n`)

  for (let i = 0; i < contenedores.length; i++) {
    const contenedor = contenedores[i]
    const perfil = elegirPerfil(i)
    const nivel = nivelAleatorio(perfil)

    try {
      const res = await enviarLectura(contenedor, nivel)
      const estado = res.ok ? 'OK' : `ERROR HTTP ${res.status}`
      console.log(`[${estado}] ${contenedor.codigo} → ${nivel}% (perfil: ${perfil.nombre})`)
    } catch (err) {
      console.log(`[ERROR] ${contenedor.codigo} → no se pudo contactar el webhook (${err.message})`)
    }
  }

  console.log('\nListo. Revisa el dashboard en unos segundos para ver las lecturas procesadas.')
}

main().catch((err) => {
  console.error('Fallo el simulador:', err)
  process.exit(1)
})
