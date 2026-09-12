<div align="center">

# 🗑️ SIMDES

### Sistema Inteligente de Monitoreo de Desechos Sólidos

Monitoreo en tiempo real, predicción de saturación y alertas automáticas para la gestión de contenedores de desechos sólidos.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![n8n](https://img.shields.io/badge/n8n-Automatización-EA4B71?logo=n8n&logoColor=white)](https://n8n.io/)
[![Estado](https://img.shields.io/badge/Estado-Desplegado-brightgreen)]()

</div>

---

## 📍 El problema

En el sector de gestión de desechos sólidos —recolección municipal, tratamiento y disposición final— la falta de visibilidad en tiempo real sobre el estado de los contenedores ocasiona rutas de recolección ineficientes y acumulación de basura en la vía pública. No hay forma de prever cuándo un punto limpio alcanzará su capacidad máxima.

**SIMDES** reemplaza la recolección reactiva por una operación con visibilidad en tiempo real y predicción anticipada.

📍 **Piloto:** Parroquia Universidad, Municipio Caroní, Ciudad Guayana.

---

## ✨ Funcionalidades

- 📊 **Dashboard en tiempo real** del nivel de llenado, con mapa agrupado por punto limpio (isla ecológica) y reubicación por arrastre para Administrador
- 🧠 **Predicción con IA** (Gemini) de horas estimadas hasta la saturación
- 🔔 **Alertas automáticas** a cuadrillas vía Telegram, con ubicación GPS — "marcar resuelta" acotado a la cuadrilla asignada, con confirmación por modal
- 🗺️ **Geolocalización real** (PostGIS) para agrupar contenedores por punto físico
- 📈 **Panel de reportes** de alertas y consumo de tokens de IA, para Administrador y Directiva, con exportación a PDF y Excel
- 🔐 **Autenticación y roles** (Supabase Auth + RLS): Administrador, Directiva/Gerencia, Cuadrilla, y Sistema/Automatización (n8n + IA) como actor no humano
- 🔧 **CRUD completo de contenedores**: alta (isla ecológica completa con zona y capacidad por norma EN 840), listado con filtros, edición de estado, y borrado lógico (nunca físico) exclusivo de Administrador
- 👤 **Perfil de usuario**: nombre, contraseña, y capacidades visibles por rol
- 🤖 **Simulador de sensores** (`scripts/simular-contenedores.js`) que dispara el flujo real de n8n para pruebas end-to-end

**Demo en vivo:** [simdes-coral.vercel.app](https://simdes-coral.vercel.app)

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
│   ├── login/            # Autenticación (Supabase Auth)
│   ├── contenedores/      # Listado con filtros + alta (isla ecológica, rol administrador)
│   ├── contenedor/[id]/   # Detalle, historial, edición de estado y borrado lógico
│   ├── alertas/           # Panel de alertas + resolver (con modal, rol cuadrilla/administrador)
│   ├── reportes/          # Reportes, consumo de IA y exportación PDF/Excel (administrador/directiva)
│   ├── perfil/            # Perfil de usuario — nombre, contraseña, capacidades por rol
│   └── sensor/            # Especificaciones del módulo sensor
├── components/ # Mapa (Leaflet, con arrastre), selector de punto, modal de confirmación, toast, íconos
├── lib/        # Clientes de Supabase (servidor/navegador), auth, código/tamaños de contenedor, utilidades
└── proxy.ts    # Refresco de sesión en cada petición (Next.js 16 — antes "middleware.ts")

scripts/
└── simular-contenedores.js  # Simulador manual de lecturas de sensor

docs/
├── BITACORA-LOCAL.md            # Bitácora técnica sesión a sesión
├── CONTEXTO-ACADEMICO.md        # Enunciado, baremo y entregables de la cátedra
├── INFORME-FINAL.md             # Informe de avance del proyecto
├── MANUAL-DEFENSA-ORAL.md       # Guía para la sustentación oral (flujos, modelo de negocio, roles)
└── capturas/                    # Capturas de pantalla reales de la aplicación
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
- [x] Base de datos (Supabase) modelada y asegurada (RLS por rol + PostGIS, auditada dos veces — 11/09 y 12/09)
- [x] Conexión Next.js ↔ Supabase verificada
- [x] Las 9 pantallas de la app construidas y con el mismo tema visual (dashboard, detalle, listado, alta, login, alertas, reportes, perfil, sensor)
- [x] Autenticación y roles (Supabase Auth + tabla `perfiles`, 4 roles) — cuentas de prueba `directiva@simdes.com` y `cuadrilla@simdes.com` creadas
- [x] CRUD completo de contenedores (alta, listado con filtros, edición de estado, borrado lógico)
- [x] Reubicación de puntos por arrastre en el mapa (Administrador)
- [x] Exportación de reportes a PDF y Excel
- [x] Simulador de sensores (dispara el flujo real de n8n, no inserta directo en la BD)
- [x] Automatización n8n (validada end-to-end: persistencia real de 20 min, predicción por IA, alerta real por Telegram)
- [x] Primer usuario administrador real vinculado a `perfiles`
- [x] Verificación visual completa en navegador (con sesión real, no solo capturas)
- [x] Despliegue en Vercel (producción activa)
- [x] Capturas de pantalla reales (`docs/capturas/`)
- [ ] Video explicativo (pendiente de grabar)

---

## 👩‍💻 Autora

**Johanna Guédez**
Ingeniería de Software I — UNEG

---

<div align="center">

📄 El informe de avance completo está en [`docs/INFORME-FINAL.md`](docs/INFORME-FINAL.md) — incluye diagramas de arquitectura, casos de uso y entidad-relación en Mermaid, renderizados automáticamente por GitHub.

</div>