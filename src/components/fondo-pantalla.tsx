import { existsSync } from 'fs'
import path from 'path'

const EXTENSIONES = ['jpg', 'jpeg', 'png', 'webp'] as const

// Fondo de pantalla opcional con imágenes propias de Johanna (mismo estilo
// que public/images/hero-background.jpg — sin problema de licencia).
// Convención: guardar el archivo en `public/images/fondos/<nombre>.<ext>`,
// donde <nombre> coincide con el que cada page.tsx ya le pasa (login,
// reportes, alertas, sensor, contenedores, registro, perfil, contenedor).
// Mientras el archivo no exista, este componente no renderiza nada — la
// pantalla se ve exactamente igual que ahora. Así se puede agregar una
// imagen a la vez sin tocar código: basta con guardar el archivo con el
// nombre correcto en esa carpeta y hacer el deploy.
//
// Es Server Component a propósito (usa `fs`, no puede vivir en un archivo
// 'use client') — se coloca como primer hijo de un contenedor con
// `position: relative` (el <main> de cada pantalla) para que el fondo cubra
// todo el alto real del contenido, no solo el viewport inicial.
export default function FondoPantalla({ nombre, alt }: { nombre: string; alt: string }) {
  const archivo = EXTENSIONES
    .map((ext) => `${nombre}.${ext}`)
    .find((candidato) => existsSync(path.join(process.cwd(), 'public', 'images', 'fondos', candidato)))

  if (!archivo) return null

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/images/fondos/${archivo}`} alt={alt} className="w-full h-full object-cover opacity-80" />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(5,7,10,0.5) 0%, rgba(8,8,14,0.85) 55%, rgba(13,13,13,0.97) 100%)' }}
      />
    </div>
  )
}
