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

- 📊 **Dashboard en tiempo real** del nivel de llenado de cada contenedor
- 🧠 **Predicción con IA** de horas estimadas hasta la saturación
- 🔔 **Alertas automáticas** a cuadrillas vía Telegram, con ubicación GPS
- 🗺️ **Geolocalización real** (PostGIS) para asignar la cuadrilla más cercana
- 📈 **Reportes y gráficas** de gestión por período y zona
- 🔐 **Roles de usuario** (administrador, supervisor, coordinador, cuadrilla)
- 🔧 **Panel de mantenimiento** de contenedores

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
src/
├── app/ # Rutas y pantallas (App Router de Next.js)
└── lib/ # Cliente de Supabase y utilidades compartidas

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
- [x] Base de datos (Supabase) modelada y asegurada (RLS + PostGIS)
- [x] Conexión Next.js ↔ Supabase verificada
- [ ] Pantallas principales (dashboard, alertas, reportes)
- [ ] Autenticación y roles
- [ ] Simulador de sensores
- [ ] Automatización n8n
- [ ] Despliegue en Vercel

---

## 👩‍💻 Autora

**Johanna Guédez**
Ingeniería de Software I — UNEG

---

<div align="center">

📄 El informe de avance completo y los manuales técnicos del proyecto se documentan fuera de este repositorio de código.

</div>