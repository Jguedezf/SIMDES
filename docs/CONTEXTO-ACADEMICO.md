# SIMDES — Contexto Académico (enunciado, planificación de la cátedra e informe)

Este archivo es contexto de referencia para Claude Code: el enunciado original del proyecto, la planificación oficial de la profesora (fechas, entregables, baremo, talleres) y un resumen del informe de avance ya redactado. Léelo cuando necesites entender el "por qué" de una decisión de alcance o verificar contra qué se evalúa el proyecto — no hace falta releerlo en cada sesión si `CLAUDE.md` ya cubre lo que necesitas.

## Enunciado original (asignado por la cátedra)

> **Proyecto N.° 9:** En el sector de gestión de desechos sólidos (recolección municipal, tratamiento industrial, reciclaje y disposición final), los problemas se concentran en la falta de visibilidad en tiempo real, las rutas ineficientes, la baja tasa de separación en la fuente y los costos operativos elevados.
>
> **9. Aplicación para gestionar el llenado de los contenedores:** Incapacidad de prever cuándo un punto limpio o papelera pública alcanzará su capacidad máxima, ocasionando acumulación de basura en la vía pública.

SIMDES es la respuesta a este enunciado: monitoreo de nivel de llenado + predicción por IA + alerta automática a la cuadrilla antes de que el contenedor rebose.

## Planificación oficial de la cátedra (Ing. Dubraska Roca, UNEG, CIVA 2026)

### Fechas reales de entrega (importante — corrige un supuesto anterior)

La planificación oficial de la profesora tiene **dos eventos separados**, no uno solo el 16/09:

| Actividad | Contenido | Ponderación | Fecha |
| --- | --- | --- | --- |
| Entrega y exposición del informe del proyecto | Informe en formato editable + link del repositorio con toda su estructura | 25 pts | **14/09/2026 al 18/09/2026** |
| Presentación de los proyectos (todos) | Exposición | 25 pts | **21/09/2026 al 25/09/2026** |

Es decir: el informe + repositorio (con el sistema funcionando, capturas, video) se entrega en la ventana **14–18/09**, no específicamente el 16. La presentación/exposición oral es un evento aparte, **21–25/09**, con más margen del que se pensaba. Esto no cambia la urgencia de tener el sistema funcional cuanto antes — sigue siendo lo correcto para no trabajar contra el tiempo — pero si algo se corre un día dentro de la ventana 14-18, no es una pérdida total.

### Entregables obligatorios del informe (según la profesora, literal — corregido 2026-09-11)

El informe debe estar en **formato editable** y debe incluir:

a. Explicar cómo es el Proceso de Elicitación
b. Requerimientos Funcionales y No Funcionales
c. Presentar todas las Historias de Usuario
d. **Gestión del Control de la Calidad del Software**
e. Diagramas de caso de uso
f. Explicar el uso de IA: qué IA utilizó, para qué la utilizó, prompts utilizados, consideraciones para usar la IA, skills, paso a paso explicando con capturas el proceso
g. Prototipo UI | UX
h. Arquitectura general de la aplicación
i. Arquitectura de la Base de Datos
j. En caso de usar automatizaciones, explicar la arquitectura
k. Link del repositorio (GitHub) del proyecto, con su README bien documentado
l. Capturas de las pantallas de la aplicación
m. Link del video explicando la funcionalidad del proyecto asignado, subirlo a Drive

**Corrección importante respecto a una versión anterior de este archivo:** la lista tenía 12 puntos (a-l) y le faltaba el punto **d. Gestión del Control de la Calidad del Software** — al insertarlo, todos los puntos siguientes se recorren una letra (la vieja "d. Diagramas de caso de uso" pasa a ser "e", y así sucesivamente hasta la "m" final, que antes no existía como letra propia). La nota anterior de este archivo (que decía que la numeración de la profesora no coincidía con la del informe de Johanna "por el desglose de Estado General") queda **obsoleta** — la lista real de la profesora sí llega hasta la "m", con la gestión de calidad como punto propio "d".

**Confirmado con la profesora (2026-09-13):** el baremo de 10 criterios que sigue abajo sigue vigente sin cambios. Lo único que varió respecto a la planificación inicial es el formato de entrega del informe: se entrega **editable** (no como PDF) — ya aplicado en este proyecto (el informe vive como Markdown en `docs/INFORME-FINAL.md`, editable por diseño).

### Entregables obligatorios del proyecto (general)

a. Aplicación funcional
b. GitHub organizado — debe incluir: README, Arquitectura, Setup
c. Base de datos documentada
d. Automatización funcionando
e. Deploy público
f. Presentación final

### Baremo de evaluación del proyecto (10 criterios, 1 punto c/u)

1. Identifica correctamente el objetivo del proyecto
2. Usa las herramientas tecnológicas solicitadas o equivalentes
3. Configura correctamente el disparador o entrada del flujo
4. Procesa la información de forma automática
5. Integra correctamente la IA en el flujo
6. Genera una salida clara y útil: email, PDF, tabla, alerta, documento, etc.
7. Maneja errores básicos o casos vacíos
8. Explica claramente cómo funciona la solución para cumplir con lo solicitado en el proyecto
9. Presenta evidencia funcional: captura, demo, video y repositorio
10. Explica el proceso de recolección de información del uso de Tokens de las herramientas IA utilizadas y presenta sugerencias para mejorar el consumo de tokens

Este es el baremo real y completo del proyecto — no incluye Docker, CI/CD ni cobertura de pruebas automatizada como criterio de la nota del proyecto en sí (ver nota sobre Talleres abajo).

### Tecnologías mínimas exigidas

| Frontend | Backend | Base de datos | IA | Automatización | Deploy | Repositorio |
| --- | --- | --- | --- | --- | --- | --- |
| Next.js, Tailwind | Supabase / Node.js | PostgreSQL | la que se considere | n8n | Vercel | GitHub |

SIMDES ya usa exactamente este stack — no hay ningún cambio de tecnología pendiente por este lado.

### Talleres semanales (Día 1 al 16) — contexto del curso, NO son el baremo del proyecto

La profesora también lleva un cronograma de "Talleres" de la unidad curricular completa (temas expuestos en grupos de 3-4, ponderados aparte en el plan de evaluación bajo "Trabajo y Exposición" y "Talleres", no bajo la entrega del proyecto). Se incluye aquí solo como referencia — **no es una lista de tareas obligatorias adicionales para el proyecto SIMDES**, pero marca prácticas de buenas costumbres de ingeniería que coinciden con el principio de calidad que ya rige este proyecto, y que se pueden adoptar si el tiempo alcanza, sin que sean requisito:

| Día | Unidad | Tema | Entregable del taller |
| --- | --- | --- | --- |
| 11 | U4 Calidad y Pruebas | Pirámide de pruebas, TDD | Suite de pruebas unitarias |
| 12 | U4 Calidad y Pruebas | Pruebas de integración, Mocks/Stubs, análisis estático | Configuración de SonarQube y reporte de cobertura |
| 13 | U5 DevOps | Control de versiones avanzado: Gitflow, PRs | Code review cruzado entre equipos |
| 14 | U5 DevOps | Contenerización con Docker | Dockerización del entorno de desarrollo |
| 15 | U5 DevOps | CI/CD con GitHub Actions/GitLab CI | Pipeline Build → Test → Docker Image |
| 16 | Evaluación Final | Cierre Sprint 3 | Entrega del producto desplegado con pipeline activo |

**Lectura correcta de esto:** son ejercicios de clase sobre el temario del curso (que aplican de forma genérica, pensados para cualquier proyecto de la sección), no una lista de "falta esto en SIMDES para aprobar". El baremo real de 10 puntos arriba es lo que efectivamente califica al proyecto asignado. Docker y CI/CD son buenas prácticas — coherentes con el principio de "calidad real, no solo lo mínimo" que ya guía este proyecto — pero se tratan como opcionales de tiempo, no como bloqueantes. Si al llegar al 13/09 sobra tiempo real (poco probable dado el resto del alcance), un pipeline simple de GitHub Actions (lint + build en cada push) sería el más barato de agregar y el que más se nota en el repositorio.

## Resumen del Informe de Avance (ya redactado, ver el documento completo en la otra sesión de Claude)

- **Objetivo general:** plataforma web progresiva para monitoreo en tiempo real y predicción del llenado de puntos limpios, con IA y automatización para optimizar rutas de recolección.
- **Piloto geográfico:** Parroquia Universidad, Municipio Caroní (sectores Alta Vista Norte/Sur, Los Olivos, Villa Asia) — zona de uso mixto residencial/comercial, elegida por ser representativa. Arquitectura pensada para escalar a las 11 parroquias del municipio.
- **Backlog (7 historias, tal cual el informe):**
  - HU-01 (3 SP, Sprint 1): registrar puntos limpios con GPS, tipo de desecho y capacidad → Catálogo.
  - HU-02 (5 SP, Sprint 1): mapa interactivo con semáforo de color por nivel de llenado → Dashboard. **La historia con más peso — exige mapa real, no solo tarjetas.**
  - HU-03 (3 SP, Sprint 1): validar lecturas, descartar picos que no se sostengan 20 min → Ingesta.
  - HU-04 (5 SP, Sprint 2): IA calcula hora estimada de desbordamiento → módulo IA.
  - HU-05 (3 SP, Sprint 2): notificación automática por Telegram al superar 85% → Automatización.
  - HU-06 (3 SP, Sprint 3): exportar resúmenes semanales de vaciados → Reportes.
  - HU-07 (2 SP, Sprint 3): registrar tokens consumidos por inferencia → Gobierno de IA.
- **Definition of Done por historia:** código en Git con principios SOLID; interfaz responsive sin errores de consola; pruebas unitarias con cobertura mínima del 80% (nota: esto es un compromiso propio del informe, no un criterio explícito del baremo de 10 puntos — decisión de alcance a confirmar con Johanna si el tiempo no alcanza para cobertura automatizada real); deploy actualizado en Vercel; base de datos documentada.
- **Arquitectura:** capas (presentación Next.js+Tailwind, lógica/orquestación Supabase+n8n, persistencia PostgreSQL) con patrón Observer/Pub-Sub — Database Webhook de Supabase como publicador, n8n como suscriptor de cada INSERT en `lecturas_sensor` (nota: en la implementación real, el disparador terminó siendo un webhook HTTP invocado por el frontend en vez del Database Webhook de Supabase — documentado como decisión consciente pendiente de reflejar en el informe final).
- **Esquema de base de datos:** `contenedores`, `lecturas_sensor`, `predicciones`, `cuadrillas`, `alertas`, `reportes`, `log_automatizacion`, `uso_tokens_ia` — con índices en FKs y columna geoespacial PostGIS (`geog`) para consultas de distancia/proximidad reales.
- **Flujo n8n (11 pasos):** simulador de sensor → webhook/disparador → filtro de persistencia 20 min → consulta histórico → cálculo de tasa de llenado → clasificación de riesgo por Gemini → decisión (≥85%) → inserción de alerta + envío por Telegram (rama verdadera) o solo predicción (rama falsa) → manejo de errores a `log_automatizacion` → registro de tokens en `uso_tokens_ia`.
- **Identidad visual propuesta:** tema oscuro — fondo `#0D0D0D`, tarjetas `#1A1A2E`, acento primario verde esmeralda `#00D4AA`, acento secundario violeta `#7C3AED`, alerta media ámbar `#F59E0B`, alerta crítica rojo coral `#EF4444`. Referencia de estética de dashboard: Sortyx (donut charts, gráfica de tendencia, sidebar) — solo la estética, no el hardware ni modelo de negocio (Sortyx es para interiores supervisados; SIMDES es para vía pública sin supervisión, por eso el sensor es discreto sin pantalla).
- **Análisis de viabilidad:** costo estimado del módulo sensor SIMDES-Node ~25-40 USD (HC-SR04 + ESP32+SIM4G + batería LiSOCl2 + carcasa IP68 antivandálica); modelo de adopción vía contratación pública municipal (como Barcelona, Singapur, Helsinki, Bigbelly), no venta directa; 3 fases de escalamiento propuestas (piloto digital actual → piloto con hardware básico → escalamiento municipal), ninguna con financiamiento confirmado — se documenta como hoja de ruta, no como acuerdo real.
