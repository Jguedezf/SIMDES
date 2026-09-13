# Guion de Grabación — Video Demo SIMDES

> Documento de trabajo exclusivo para grabar el video del literal **m** (link del video explicando la funcionalidad del proyecto, subido a Drive). No sustituye ni modifica `docs/MANUAL-DEFENSA-ORAL.md` (ese es para la sustentación oral en vivo, con preguntas del jurado — este es un libreto cerrado para grabar sola, tú hablando mientras compartes pantalla).

**Duración estimada total: 9:30–10:00 minutos.** Cada bloque trae un tiempo sugerido — es una guía, no un cronómetro estricto; prioriza hablar natural sobre cumplir el segundo exacto.

**Formato de cada bloque:**
- 🖥️ **PANTALLA** — qué debe estar visible/qué clic hacer, en orden.
- 🎙️ **DECIR** — el texto tal cual, en primera persona, para leer o parafrasear mientras grabas.
- ✅ **Cubre** — qué criterio del baremo o literal del informe demuestra este bloque (para que no se te escape ninguno).

---

## Antes de grabar — checklist de preparación

- [ ] Tener listas las 3 cuentas de prueba y sus contraseñas a la mano: `admin@simdes.com`, `directiva@simdes.com`, `cuadrilla@simdes.com`.
- [ ] Cerrar sesión de cualquier cuenta antes de empezar a grabar (para arrancar desde la landing pública, sin sesión).
- [ ] Tener Telegram abierto (móvil o escritorio) en el canal/chat donde llegan las alertas de la cuadrilla — para capturar en vivo la alerta real cuando dispares "Simular lectura" (bloque 7). Si no es posible en el momento, ten a mano una captura de una alerta real ya recibida como respaldo (ver `docs/BITACORA-LOCAL.md`, corridas del simulador).
- [ ] Tener un contenedor de nivel medio-alto identificado de antemano (revisa `/contenedores` y anota un código, ej. uno entre 60-80%) para que "Simular lectura" lo empuje a crítico de forma creíble en un solo clic, no en varios.
- [ ] Silenciar notificaciones del sistema operativo (para que no aparezcan pop-ups encima de la grabación).
- [ ] Resolución de pantalla recomendada: 1920×1080 o similar — el navbar y las tarjetas están pensados para ese ancho.
- [ ] Ensayar una vez sin grabar el tramo del bloque 7 (disparador → predicción → alerta), porque tiene un tiempo de espera real (unos segundos mientras n8n procesa) — así sabes cuánto silencio/narración de relleno necesitas ahí.

---

## Bloque 1 — Apertura: el problema (0:00–0:45)

🖥️ **PANTALLA:** Landing pública de SIMDES (`/`, sin sesión iniciada). Deja que se vea completa la imagen del hero (el contenedor inteligente de noche) unos segundos antes de hablar.

🎙️ **DECIR:**
> "En la gestión de desechos sólidos urbanos, el problema no es la falta de contenedores — es no saber cuándo se van a llenar. Las cuadrillas de recolección operan con rutas fijas, sin visibilidad real del estado de cada punto, lo que produce dos fallas constantes: contenedores que rebosan antes de que llegue la ruta programada, y viajes de recolección a puntos que todavía no lo necesitaban. Este es SIMDES: un sistema de monitoreo y predicción de desechos sólidos que resuelve exactamente ese problema, con sensores en tiempo real, predicción por inteligencia artificial, y alertas automáticas — antes de que el desbordamiento ocurra, no después."

✅ **Cubre:** Criterio 1 (Objetivo del proyecto), literal a (Elicitación, implícito en el planteamiento del problema).

---

## Bloque 2 — Cómo lo abordé: enfoque y decisiones clave (0:45–1:45)

🖥️ **PANTALLA:** Sigue en la landing pública; puedes desplazarte lentamente para mostrar el mapa y las tarjetas de contenedores debajo del hero mientras hablas.

🎙️ **DECIR:**
> "El enfoque fue construir el pipeline completo, de punta a punta, no una maqueta: un sensor —o el simulador que lo reemplaza hoy, porque el hardware físico está fuera del alcance de este semestre— envía una lectura real por HTTP a un flujo de automatización en n8n. Ese flujo persiste la lectura, aplica un filtro para descartar falsos positivos —una lectura puntual alta no dispara nada si no se sostiene 20 minutos reales de reloj—, y solo entonces consulta a un modelo de inteligencia artificial, Gemini, para clasificar el riesgo y estimar cuántas horas faltan para la saturación. Si el nivel es crítico y sostenido, el sistema despacha automáticamente una alerta por Telegram a la cuadrilla asignada, con la ubicación exacta.

> Una decisión de diseño importante: el dashboard con el mapa es público, sin necesidad de iniciar sesión — eso es intencional, no un descuido. Es la propuesta de transparencia ciudadana del proyecto: cualquier persona puede consultar el estado de los puntos limpios de su sector. Las funciones operativas — registrar contenedores, gestionar alertas, ver reportes de consumo de IA — sí requieren sesión, con 4 roles distintos que voy a mostrar en un momento."

✅ **Cubre:** Criterio 2 (Herramientas tecnológicas), literal h (Arquitectura general), justificación del modelo de negocio (valor agregado).

---

## Bloque 3 — Identidad visual y landing pública (1:45–2:30)

🖥️ **PANTALLA:** Landing pública completa: desplázate por el hero, el badge "Piloto activo", el título, los botones "Iniciar sesión" / "Ver contenedores", y baja hasta el mapa y las tarjetas de contenedores reales.

🎙️ **DECIR:**
> "Toda la interfaz sigue una identidad de marca consistente: paleta oscura con acento verde esmeralda, tarjetas de vidrio con profundidad real —no planas—, y esta escena del hero es una composición propia, con el molino de luces de Alta Vista, Puerto Ordaz, de fondo. Cada dato que ven aquí es real, no decorativo: el número de puntos monitoreados, el nivel promedio, vienen directo de la base de datos en el momento en que se carga la página."

🖥️ **PANTALLA:** Clic en una tarjeta de contenedor cualquiera del listado (lleva a su detalle) y clic en "← Panel de inicio" del navbar para volver.

🎙️ **DECIR:**
> "Cada tarjeta de contenedor ya lleva directo a su propia ficha de detalle — la navegación está pensada para que lo que ves conecte con adonde te lleva, no listados genéricos desconectados."

✅ **Cubre:** literal g (Prototipo UI/UX), valor agregado (identidad corporativa).

---

## Bloque 4 — Login y el modelo de 4 roles (2:30–3:15)

🖥️ **PANTALLA:** Clic en "Iniciar sesión". Mostrar el formulario de login (correo + contraseña). Iniciar sesión con `admin@simdes.com`.

🎙️ **DECIR:**
> "SIMDES tiene 4 roles, cada uno con permisos acotados a lo que necesita — no es una decisión arbitraria, está fundamentada en el modelo de negocio real de la gestión de aseo urbano: un Administrador que gestiona el catálogo de contenedores y el consumo de IA; una Directiva o gerencia que consulta reportes de servicio; una Cuadrilla de recolección que recibe y resuelve sus propias alertas; y el Sistema mismo — la automatización y la IA — como un actor no humano que valida, predice y dispara alertas por su cuenta."

🖥️ **PANTALLA:** Ya autenticada como Administrador, señala el menú completo (Contenedores, + Registrar, Reportes, Alertas, Sensor) y el avatar de iniciales arriba a la derecha.

🎙️ **DECIR:**
> "Como Administrador veo el menú completo. Este mismo menú, para un visitante sin sesión, solo mostraba 'Contenedores' — el resto son funciones operativas, no algo que un visitante anónimo necesite ver."

✅ **Cubre:** literal c (Historias de usuario, actores), justificación RBAC (valor agregado / modelo de negocio).

---

## Bloque 5 — Dashboard autenticado, mapa y reubicación por arrastre (3:15–4:15)

🖥️ **PANTALLA:** Dashboard (`/`) ya con sesión. Señala las 3 tarjetas de resumen arriba del mapa.

🎙️ **DECIR:**
> "Estas 3 tarjetas de resumen son interactivas, no solo informativas: 'Puntos monitoreados' lleva directo al mapa de abajo, 'En nivel crítico' filtra el catálogo completo mostrando solo los contenedores que de verdad están en riesgo ahora mismo, y 'Nivel promedio de llenado' lleva al histórico de reportes."

🖥️ **PANTALLA:** Clic en "En nivel crítico" para mostrar el filtro real funcionando; volver atrás; luego, en el mapa, arrastrar un marcador de un punto a otra posición cercana y soltarlo.

🎙️ **DECIR:**
> "Y este mapa no es solo de lectura: como Administrador puedo reubicar un punto limpio arrastrándolo directamente, y el sistema confirma la nueva dirección con geocodificación inversa antes de guardar el cambio."

✅ **Cubre:** HU-02 (mapa, la historia de mayor peso del backlog), literal h (Arquitectura general — capa de presentación).

---

## Bloque 6 — Registrar un punto limpio nuevo (4:15–5:00)

🖥️ **PANTALLA:** Clic en "+ Registrar" del menú. Marcar un punto nuevo en el mapa selector, elegir 2 o 3 tipos de residuo (checkboxes), completar el formulario y guardar.

🎙️ **DECIR:**
> "Registrar un punto limpio crea de una vez la isla ecológica completa: un contenedor segregado por cada tipo de residuo que marque, siguiendo la clasificación por color de la norma COVENIN 3838 — no hay texto libre, el código y la capacidad se generan automáticamente según la zona y el tipo, siguiendo la norma EN 840 para el tamaño real de los contenedores."

✅ **Cubre:** HU-01 (catálogo con GPS/tipo/capacidad), literal b (Requerimientos funcionales, validación de datos).

---

## Bloque 7 — El pipeline completo en vivo: disparador → IA → predicción (5:00–6:30)

**Este es el bloque más importante del video — es la demostración en vivo de los criterios 3, 4 y 5 del baremo, no solo mencionados, sino ejecutados frente a cámara.**

🖥️ **PANTALLA:** Entra al detalle del contenedor que identificaste en el checklist previo (nivel medio-alto). Señala el gráfico de "Historial de llenado" y la línea de umbral crítico. Señala el panel "Predicción (IA)" con su estado actual.

🎙️ **DECIR:**
> "Este contenedor está en [di el nivel que veas en pantalla]. Voy a simular una nueva lectura de sensor para mostrarles el flujo completo de automatización tal como ocurriría con un sensor físico real."

🖥️ **PANTALLA:** Clic en el botón "Simular lectura". Esperar (puede tardar unos segundos reales mientras n8n procesa — llena ese tiempo hablando, no cortes el video aquí).

🎙️ **DECIR (mientras esperas):**
> "Ahora mismo esa lectura viaja por HTTP hasta el webhook real de n8n — el mismo endpoint que usaría un sensor físico. n8n la persiste en la base de datos, calcula si el nivel se ha sostenido crítico durante al menos 20 minutos reales de reloj —no solo un pico momentáneo—, y si aplica, le pide a Gemini que clasifique el riesgo y estime las horas hasta la saturación."

🖥️ **PANTALLA:** Cuando la página se actualice, señala el nuevo punto en el gráfico y el panel de "Predicción (IA)" con el nivel de riesgo actualizado (crítico/alto) y las horas estimadas, y el modelo usado (`gemini-2.5-flash`).

🎙️ **DECIR:**
> "Y aquí está: la predicción real de la IA, con el nivel de riesgo y las horas estimadas hasta la saturación. Todo esto en cuestión de segundos, sin intervención humana."

✅ **Cubre:** Criterio 3 (Disparador), Criterio 4 (Procesamiento automático), Criterio 5 (Integración de IA), literal j (Arquitectura de automatizaciones).

---

## Bloque 8 — La alerta llega de verdad (6:30–7:00)

🖥️ **PANTALLA:** Cambia a Telegram (si el nivel disparó una alerta real) y muestra el mensaje recién llegado, con la ubicación y el código del contenedor. Si no llegó a tiempo de grabar, usa la captura de respaldo del checklist y acláralo con audio ("esta captura corresponde a una corrida real de esta misma semana").

🎙️ **DECIR:**
> "Y esta es la salida real del sistema: una alerta de Telegram, generada automáticamente, con la ubicación GPS del contenedor y un mensaje redactado por la propia IA, enviada directo al chat de la cuadrilla asignada a esa zona — sin que nadie la haya escrito a mano."

✅ **Cubre:** Criterio 6 (Salida clara y útil).

---

## Bloque 9 — Panel de alertas y resolución (7:00–7:30)

🖥️ **PANTALLA:** Clic en "Alertas" del menú. Señala una alerta pendiente, clic en "Marcar resuelta" (mostrar el modal de confirmación), confirmar.

🎙️ **DECIR:**
> "Del lado operativo, la cuadrilla ve sus alertas pendientes y las marca resueltas una vez que recogen el contenedor — con confirmación explícita antes de ejecutar la acción, para evitar resoluciones accidentales."

✅ **Cubre:** Criterio 7 (Manejo de errores/casos — el modal de confirmación es parte del manejo cuidadoso de acciones), HU del rol Cuadrilla.

---

## Bloque 10 — Reportes: rango de fechas, gráficas y exportación (7:30–8:45)

🖥️ **PANTALLA:** Clic en "Reportes". Mostrar el selector de rango (clic en "Últimos 30 días", luego abrir "Rango personalizado" y elegir 2 fechas). Señala el donut de alertas por estado y el gráfico de historial diario.

🎙️ **DECIR:**
> "El panel de reportes deja elegir cualquier rango de fechas — hoy, últimos 7 o 30 días, o un rango personalizado — y todo lo de abajo se recalcula para ese período exacto: alertas por estado, historial diario, y el consumo de tokens de inteligencia artificial."

🖥️ **PANTALLA:** Baja hasta "Consumo de tokens de IA" y señala las cifras (llamadas, tokens totales, por modelo).

🎙️ **DECIR:**
> "Este es el registro real de cuánto consume el sistema en cada llamada a Gemini — llamadas, tokens de entrada y salida, por modelo — la trazabilidad de costo de IA que pide el criterio 10 del baremo."

🖥️ **PANTALLA:** Clic en "Exportar PDF"; abrir el archivo descargado y mostrar el encabezado de marca y la banda de período. Volver, clic en "Exportar Excel"; abrir el archivo y mostrar el formato de marca y la barra de datos nativa en una columna numérica.

🎙️ **DECIR:**
> "Y ambos reportes se pueden exportar con el mismo nivel de pulido que la pantalla — PDF con el logo y los colores de marca, y Excel con encabezados formateados y barras de datos nativas de Excel, no una imagen pegada."

✅ **Cubre:** Criterio 10 (Consumo de tokens de IA + sugerencias), HU-06/HU-07 (exportar resúmenes, registrar tokens).

---

## Bloque 11 — Perfil y el modelo de roles hecho visible (8:45–9:10)

🖥️ **PANTALLA:** Clic en el avatar (esquina superior derecha) para ir a `/perfil`. Señala la tarjeta "Capacidades de Administrador".

🎙️ **DECIR:**
> "En el perfil de cada usuario se hace visible el patrón de herencia del modelo de roles: la cuenta base es la misma para todos, y cada rol agrega sus propias capacidades — esto no es solo una tabla en la base de datos, está reflejado directamente en la interfaz."

✅ **Cubre:** literal c (Historias de usuario / actores), justificación del modelo de roles (valor agregado).

---

## Bloque 12 — Ficha técnica del sensor (9:10–9:30)

🖥️ **PANTALLA:** Clic en "Sensor" del menú. Señala la tabla de componentes y costo estimado, y la clasificación por color.

🎙️ **DECIR:**
> "Y esta es la especificación del hardware propuesto para instrumentar cada contenedor físico: un sensor ultrasónico, microcontrolador con conectividad celular, batería de larga duración y carcasa antivandálica — pensado para vía pública sin supervisión, con un costo estimado de 25 a 40 dólares por unidad. Hoy ese sensor está reemplazado por un simulador que envía lecturas reales al mismo flujo de automatización, exactamente como lo haría el hardware una vez fabricado."

---

## Bloque 13 — Cierre: valor agregado y mensaje final (9:30–9:50)

🖥️ **PANTALLA:** Vuelve al dashboard o a la landing pública para cerrar con una vista general del sistema.

🎙️ **DECIR:**
> "SIMDES no es solo un formulario conectado a una base de datos: es un pipeline de automatización real, con inteligencia artificial en el centro de la decisión, una identidad visual propia y cuidada, y un modelo de roles fundamentado en cómo realmente opera la gestión de aseo urbano — pensado para escalar de un piloto de 4 puntos en la Parroquia Universidad a una operación municipal completa. Gracias."

---

## Checklist de cobertura del baremo (verificación final antes de subir el video)

| Criterio del baremo | Bloque que lo demuestra |
| --- | --- |
| 1. Objetivo del proyecto | Bloque 1 |
| 2. Herramientas tecnológicas | Bloque 2 |
| 3. Disparador/entrada del flujo | Bloque 7 |
| 4. Procesamiento automático | Bloque 7 |
| 5. Integración de IA | Bloque 7 |
| 6. Salida clara y útil | Bloque 8 |
| 7. Manejo de errores/casos | Bloque 9 (confirmación); estados vacíos ya cubiertos si algún panel aparece sin datos durante la grabación |
| 8. Explicación clara de la solución | Todo el guion (narración continua) |
| 9. Evidencia funcional | El video completo + repositorio + capturas |
| 10. Consumo de tokens de IA | Bloque 10 |

Si algún bloque queda corto de tiempo el día de la grabación, **prioriza el 7, 8 y 10 antes que el 6, 11 o 12** — son los que el baremo pide demostrar en vivo, no solo mencionar.

---

## Nota sobre el informe en Word/APA (pendiente, coordinación futura)

Johanna mencionó que coordinará por separado (con Claude en chat o en el navegador) la conversión del informe final a un documento Word con formato APA 7ª edición, a color, con los diagramas de `docs/diagramas/` insertados. Esta sesión de Claude Code no generó ese documento — este archivo es solo el guion del video. Cuando se retome esa tarea, los 4 diagramas ya exportados como imagen (`docs/diagramas/*.png`) están listos para insertarse directamente sin volver a generarlos.
