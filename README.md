<div align="center">

# 🗑️ SIMDES

### Sistema Inteligente de Monitoreo de Desechos Sólidos

Monitoreo en tiempo real, predicción de saturación y alertas automáticas para la gestión de contenedores de desechos sólidos.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![n8n](https://img.shields.io/badge/n8n-Automatización-EA4B71?logo=n8n&logoColor=white)](https://n8n.io/)
[![Estado](https://img.shields.io/badge/Estado-En%20desarrollo-yellow)]()

</div>

---

## 📍 El problema

En el sector de gestión de desechos sólidos —recolección municipal, tratamiento y disposición final— la falta de visibilidad en tiempo real sobre el estado de los contenedores ocasiona rutas de recolección ineficientes y acumulación de basura en la vía pública. No hay forma de prever cuándo un punto limpio alcanzará su capacidad máxima.

**SIMDES** reemplaza la recolección reactiva por una operación con visibilidad en tiempo real y predicción anticipada.

📍 **Piloto:** Parroquia Universidad, Municipio Caroní, Ciudad Guayana.

---

## ✨ Funcionalidades

- 📊 **Dashboard en tiempo real** del nivel de llenado, con mapa agrupado por punto limpio
- 🧠 **Predicción con IA** (Gemini) de horas estimadas hasta la saturación
- 🔔 **Alertas automáticas** a cuadrillas vía Telegram, con ubicación GPS — con acción de "marcar resuelta" acotada a la cuadrilla asignada
- 🗺️ **Geolocalización real** (PostGIS) para agrupar contenedores por punto físico
- 📈 **Panel de reportes** de alertas (pendientes/resueltas) y consumo de tokens de IA, para Administrador y Directiva
- 🔐 **Autenticación y roles** (Supabase Auth + RLS): Administrador, Directiva/Gerencia, Cuadrilla, y Sistema/Automatización (n8n + IA) como actor no humano
- 🔧 **CRUD de contenedores** (alta con mapa clicable, edición de estado) protegido por rol
- 🤖 **Simulador de sensores** (`scripts/simular-contenedores.js`) que dispara el flujo real de n8n para pruebas end-to-end

> Alcance funcional en construcción — ver [Estado del proyecto](#-estado-del-proyecto).

---

## 🏗️ Stack tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | Next.js 16 (App Router) · TypeScript · Tailwind CSS |
| **Base de datos** | Supabase · PostgreSQL · PostGIS |
| **Automatización** | n8n |
| **Inteligencia artificial** | Gemini API |
| **Notificaciones** | Telegram Bot API |
| **Control de versiones** | Git · GitHub |
| **Despliegue** | Vercel |

---

## 🚀 Empezar

### Requisitos
- Node.js 18+
- Una cuenta de Supabase con el proyecto configurado

### Instalación

```bash
git clone https://github.com/Jguedezf/SIMDES.git
cd SIMDES
npm install
```

### Variables de entorno

Crea un archivo `.env.local` en la raíz con:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_llave_publica
```

### Ejecutar en local

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) 🎉

---

## 📁 Estructura del proyecto
```
src/
├── app/       # Rutas y pantallas (App Router de Next.js)
│   ├── login/           # Autenticación (Supabase Auth)
│   ├── contenedores/     # Alta de contenedores (rol administrador)
│   ├── contenedor/[id]/  # Detalle, historial y edición de estado
│   ├── alertas/          # Panel de alertas + acción de resolver (rol cuadrilla)
│   ├── reportes/         # Reportes y consumo de IA (administrador/directiva)
│   └── sensor/           # Especificaciones del módulo sensor
├── components/ # Mapa (Leaflet), selector de punto, íconos
├── lib/        # Clientes de Supabase (servidor/navegador), auth, utilidades
└── proxy.ts    # Refresco de sesión en cada petición (Next.js 16 — antes "middleware.ts")

scripts/
└── simular-contenedores.js  # Simulador manual de lecturas de sensor

docs/
├── BITACORA-LOCAL.md            # Bitácora técnica sesión a sesión
├── CONTEXTO-ACADEMICO.md        # Enunciado, baremo y entregables de la cátedra
└── INFORME-FINAL.md             # Informe de avance del proyecto
```

---

## 🌿 Flujo de trabajo

Este repositorio sigue un flujo de dos ramas:

| Rama | Propósito |
|---|---|
| `main` | Versión estable, lista para desplegar |
| `develop` | Desarrollo activo día a día |

---

## ✅ Estado del proyecto

- [x] Entorno de desarrollo configurado
- [x] Base de datos (Supabase) modelada y asegurada (RLS por rol + PostGIS)
- [x] Conexión Next.js ↔ Supabase verificada
- [x] Pantallas principales (dashboard con mapa agrupado, detalle, alertas, reportes)
- [x] Autenticación y roles (Supabase Auth + tabla `perfiles`, 4 roles)
- [x] Simulador de sensores (dispara el flujo real de n8n, no inserta directo en la BD)
- [x] Automatización n8n (validada end-to-end: persistencia real de 20 min, predicción por IA, alerta real por Telegram)
- [ ] Primer usuario administrador real vinculado a `perfiles` (pendiente)
- [ ] Verificación visual completa en navegador
- [ ] Despliegue en Vercel
- [ ] Capturas de pantalla y video explicativo

---

## 👩‍💻 Autora

**Johanna Guédez**
Ingeniería de Software I — UNEG

---

<div align="center">

📄 El informe de avance completo está en [`docs/INFORME-FINAL.md`](docs/INFORME-FINAL.md) — incluye diagramas de arquitectura, casos de uso y entidad-relación en Mermaid, renderizados automáticamente por GitHub.

</div>