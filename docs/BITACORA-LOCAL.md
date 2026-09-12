# Bitácora local — SIMDES

Registro de trabajo de esta sesión de Claude Code (entorno local, VS Code/terminal). Se actualiza al cerrar cada bloque de trabajo, no solo al final del día.

---

## Bloque 1 — HU-02: Mapa interactivo con semáforo de color (2026-09-11)

### Contexto leído antes de empezar
- `CLAUDE.md` → `AGENTS.md`: este repo corre Next.js 16.3.4, versión con breaking changes respecto al Next.js "clásico". Antes de tocar código de rutas/App Router se leyó `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md` y `server-and-client-boundary.md`.
- `docs/CONTEXTO-ACADEMICO.md`: HU-02 (5 SP, Sprint 1) es la historia de mayor peso del backlog — exige mapa real, no solo tarjetas.
- Backlog completo revisado: HU-01 (catálogo, ya existe la tabla `contenedores` con GPS), HU-02 (este bloque), HU-03 a HU-07 pendientes.

### Breaking change de Next.js 16 detectado y respetado
En Next 16, `next/dynamic(..., { ssr: false })` **ya no se permite dentro de un Server Component** — solo dentro de un Client Component (antes sí se podía llamar directo desde una page server). Por eso el mapa se partió en dos archivos en vez de uno:
- `src/components/mapa-contenedores.tsx` — el mapa real (Leaflet), `'use client'`.
- `src/components/mapa-contenedores-wrapper.tsx` — `'use client'`, hace el `dynamic(..., { ssr: false })` y es lo único que importa `src/app/page.tsx` (que sigue siendo Server Component, sin cambios en su naturaleza async).

Verificado en runtime: el HTML servido por `next dev` muestra explícitamente `BAILOUT_TO_CLIENT_SIDE_RENDERING` para el mapa (comportamiento esperado y documentado, no es un error) y el skeleton "Cargando mapa..." se sirve desde el servidor mientras el cliente monta Leaflet.

### Archivos creados
- **`src/lib/nivel.ts`** — helper compartido con los umbrales de semáforo (≥85% rojo, ≥50% amarillo, resto verde, `null` gris "sin datos"). Antes esta lógica vivía duplicada e implícita solo en `src/app/page.tsx` como clases Tailwind; se extrajo para que el mapa (que necesita colores hex, no clases CSS) y el dashboard usen la misma fuente de verdad y no diverjan los umbrales.
- **`src/components/mapa-contenedores.tsx`** — componente Leaflet imperativo (sin `react-leaflet`). Decisión técnica: se usó `leaflet` puro en vez de `react-leaflet` porque (a) evita el problema clásico de peer-dependencies con React 19 (react-leaflet aún no tiene un major claramente estable para React 19 al momento de escribir esto), y (b) el semáforo de color exige íconos personalizados por nivel — con Leaflet puro se usa `L.divIcon` con un círculo de color inline (evita también el bug histórico de los íconos PNG por defecto de Leaflet rotos con bundlers). El módulo `leaflet` se importa dinámicamente (`import('leaflet')`) dentro de `useEffect`, nunca en el top-level del archivo, para no arriesgar que el bundler intente evaluarlo en un contexto sin `window`/`document`. El CSS (`leaflet/dist/leaflet.css`) sí se importa estático arriba, porque un import de CSS no ejecuta JS y Next.js permite imports de CSS de `node_modules` en cualquier componente del App Router.
  - Los popups de cada marcador se arman con `document.createElement` + `textContent` (no `innerHTML` con template strings) para no interpolar datos de la base de datos directo en HTML, aunque el riesgo es bajo (los datos vienen de Supabase, no de input público sin validar).
  - Centro por defecto del mapa si no hay contenedores con coordenadas: `[8.294, -62.714]` (Parroquia Universidad, Municipio Caroní — el piloto geográfico del proyecto). Si hay contenedores, el centro es el promedio de sus coordenadas.
- **`src/components/mapa-contenedores-wrapper.tsx`** — el wrapper cliente con el `dynamic(ssr:false)` explicado arriba.

### Archivos modificados
- **`src/app/page.tsx`** (dashboard): se agregó `latitud, longitud` al `select()` de `contenedores`, se armó `contenedoresMapa` (filtra los que tengan coordenadas no nulas, castea `latitud`/`longitud` a `Number` porque Postgres/PostgREST devuelve columnas `numeric` como string), y se renderiza `<MapaContenedoresWrapper>` en una tarjeta nueva arriba de la grilla de tarjetas existente. Se reemplazó la función local `nivelColor` (clases Tailwind hardcodeadas) por `nivelClaseTailwind` de `src/lib/nivel.ts`.

### Dependencias instaladas
- `leaflet` (dependencia de producción)
- `@types/leaflet` (devDependency)

No se tocó `react-leaflet` — decisión consciente, ver arriba.

### Verificación hecha esta sesión
- `npx tsc --noEmit` → sin errores.
- `npx eslint src` → 0 errores en los archivos nuevos/modificados. Quedan 3 errores de lint **preexistentes** (no introducidos en este bloque) en `src/app/alertas/page.tsx` y `src/app/contenedor/[id]/page.tsx` (uso de `<a>` en vez de `<Link>`, y un `setState` síncrono dentro de `useEffect`). No se tocaron esos archivos porque están fuera del alcance de HU-02 — quedan anotados abajo como posible bloque de limpieza futuro, a decidir por Johanna si vale la pena antes de la entrega.
- Dashboard servido por `next dev` (ya estaba corriendo en `localhost:3000`) devuelve HTML correcto: los 4 contenedores reales de Supabase llegan al cliente con sus coordenadas y niveles (`PL-041-Y` 96% rojo, `PL-042-A` 54% amarillo, `PL-043-V` y `PL-044-M` sin lecturas → gris).
- **Pendiente: verificación visual en navegador.** Esta sesión no tiene la extensión de Claude en Chrome habilitada (Johanna la rechazó al inicio de este bloque), así que no se pudo confirmar con captura que el mapa se pinta correctamente, que los popups abren, ni que el marcador de color se ve bien. Recomendado: abrir `http://localhost:3000` y confirmar visualmente antes de dar HU-02 por cerrada.

### Pendiente de la otra sesión de Claude (Supabase)
Nada de esquema ni RLS es necesario para HU-02 en sí — la tabla `contenedores` ya tenía `latitud`/`longitud` pobladas para los 4 contenedores de prueba. Sin embargo, al inspeccionar el proyecto con las herramientas de Supabase salió este advisory, no relacionado con HU-02 pero que vale la pena que quede registrado:

> **RLS deshabilitado en `public.spatial_ref_sys`** (tabla de sistema de PostGIS, no de datos de la app). El asesor de seguridad de Supabase lo marca como "crítico" porque cualquier con la anon key podría leer/escribir esa tabla. En la práctica es una tabla de referencia de PostGIS (listado de sistemas de coordenadas), no contiene datos de contenedores ni de usuarios — pero technically está expuesta. No se tocó porque activar RLS sin políticas bloquearía el acceso (PostGIS la necesita internamente) y la decisión de si vale la pena una política de solo-lectura ahí es de la otra sesión de Claude (la que tiene el control de Supabase) o de Johanna. SQL de referencia que dio el propio advisory (no aplicado): `ALTER TABLE "public"."spatial_ref_sys" ENABLE ROW LEVEL SECURITY;` — probablemente necesite además una policy de `SELECT` para `anon`/`authenticated` si se activa, porque si no rompe cualquier función que dependa de esa tabla.

### Preguntas para Johanna (nadie más las puede responder)
1. **Lint preexistente**: ¿vale la pena que arregle en un bloque aparte los 2 archivos con errores de lint que ya existían antes de este bloque (`alertas/page.tsx`, `contenedor/[id]/page.tsx`)? No los toqué porque no eran parte de HU-02, pero si van a correr `next build` en algún punto y ese build falla por lint, hay que decidir cuándo limpiarlo.
2. **`spatial_ref_sys` sin RLS**: ¿lo dejamos así (es una tabla interna de PostGIS, no de negocio) o pedimos a la sesión con Supabase que le active RLS + policy de solo lectura? No bloquea nada del proyecto tal cual está.
3. Confirmar visualmente el mapa en el navegador (ver sección de verificación arriba) — si algo se ve mal (colores, tamaño, popups), decirlo para ajustar en el siguiente bloque.

### Siguiente paso sugerido
Con HU-02 (mapa) resuelto, el siguiente ítem del plan según el backlog sería HU-01 (si el catálogo de alta de contenedores con GPS aún no tiene una pantalla propia — hoy los 4 contenedores de prueba están solo insertados vía Supabase, no hay formulario en la app) o HU-03 (validación de lecturas, descartar picos que no se sostengan 20 min). A confirmar con Johanna cuál sigue.

---

## Bloque 2 — Ícono personalizado + selector de punto en mapa para HU-01 (2026-09-11)

Johanna pidió dos cosas relacionadas con el mapa: (1) reemplazar el marcador del dashboard por un ícono con forma de contenedor de basura, y (2) que el futuro formulario de alta (HU-01) tenga un mapa donde ella pueda marcar el punto con un clic en vez de escribir latitud/longitud a mano, porque solo ella conoce los puntos reales. Dado que ya había una pregunta abierta en la bitácora sobre si seguir con HU-01, se interpretó esto como luz verde para construir el formulario de alta ahora, no solo dejarlo anotado para después.

### Archivo nuevo: ícono compartido
- **`src/lib/icono-contenedor.ts`** — `crearIconoContenedor(L, color, tamaño?)`: genera un `L.divIcon` con un SVG simple de bote de basura (silueta + tapa + 3 rayas verticales), coloreado por el parámetro `color`. Es puramente tipos + una función que recibe `L` ya importado (no importa `leaflet` como valor), para no arriesgar ejecución en el servidor. El ancla del ícono queda en la punta inferior (la base del bote), no en el centro, para que la coordenada exacta marcada/mostrada corresponda al punto donde "toca el suelo" el ícono. Se usa en dos lugares con dos semánticas de color distintas:
  - Dashboard (`mapa-contenedores.tsx`): color = semáforo de nivel de llenado (`nivelColorHex` de `src/lib/nivel.ts`).
  - Selector de punto (`mapa-selector-punto.tsx`): color fijo azul (`#2563eb`, el mismo acento que ya usa la app en links) porque un contenedor recién creado todavía no tiene lecturas de llenado — usar un color de semáforo ahí hubiera sido engañoso.

  Nota técnica: se auditó el bug reportado ("ícono roto") revisando cómo Turbopack resuelve el import dinámico de `leaflet` (es un bundle UMD que expone `exports.divIcon`, `exports.map`, etc. igual que `exports.marker`/`exports.tileLayer`, que sí funcionaban) — no se encontró una causa técnica de que `L.divIcon` fallara y cayera al pin azul por defecto de Leaflet. Es posible que el circulito de color de la versión anterior simplemente no se leyera como "un marcador" a simple vista. En cualquier caso, el ícono SVG de bote de basura reemplaza esa implementación por completo.

### Archivos nuevos: selector de punto en mapa
- **`src/components/mapa-selector-punto.tsx`** — mapa Leaflet (mismo patrón imperativo que `mapa-contenedores.tsx`: `'use client'`, `import('leaflet')` dentro de `useEffect`, nunca estático). Al hacer clic en el mapa, coloca/mueve un marcador con el ícono de contenedor (azul) y llama `onSeleccionar(lat, lng)` con las coordenadas redondeadas a 6 decimales. Si el formulario ya trae latitud/longitud (p. ej. al reabrir con un valor previo), el mapa arranca centrado ahí con el marcador ya puesto. Decisión: no se sincroniza el mapa cuando el usuario edita los campos manualmente después del clic (solo mapa → formulario, no formulario → mapa) — el flujo principal pedido es "clic en el mapa llena los campos", y sincronizar en ambos sentidos hubiera agregado recentrados de mapa molestos sin que se pidiera.
- **`src/components/mapa-selector-punto-wrapper.tsx`** — wrapper `'use client'` con `dynamic(..., { ssr: false })`, mismo motivo que el wrapper del mapa del dashboard (regla de Next 16 sobre `ssr:false` fuera de Server Components).

### Archivo nuevo: formulario de alta de contenedor (HU-01, alcance: creación)
- **`src/app/contenedores/nuevo/page.tsx`** — formulario con código, tipo de residuo (`<select>` con las 4 opciones que permite el CHECK de la tabla: plástico/papel/vidrio/orgánico), capacidad en litros, y el mapa selector de punto en vez de inputs de lat/long editables a mano. El botón de guardar queda deshabilitado hasta que haya código, capacidad > 0 y un punto marcado. Al enviar, hace `supabase.from('contenedores').insert(...)` (sin tocar `estado`, que ya tiene default `'activo'` en la tabla) y redirige al dashboard si sale bien.
- **`src/app/page.tsx`** — se agregó el link "+ Registrar contenedor" junto a "Ver alertas →".

### ⚠️ Bloqueante real encontrado: falta política de INSERT en `contenedores`
Antes de escribir el formulario se revisaron las políticas RLS de la tabla con `pg_policies` (proyecto Supabase `hprgnnfjnjxovfkbhfmj`). Resultado: **la tabla `contenedores` solo tiene una política, de `SELECT` público** (`"lectura publica"`, `cmd: SELECT`, `roles: {public}`). No existe ninguna política de `INSERT`. Esto significa que el formulario que acabo de construir **no va a poder guardar todavía** — Supabase va a rechazar el insert con un error de RLS (código Postgres `42501`), que el formulario ya maneja mostrando un mensaje explicativo en vez de fallar en silencio o mostrar un error críptico.

No apliqué ninguna política yo mismo porque es exactamente el tipo de cambio que Johanna pidió dejar para la otra sesión de Claude (la que tiene el control de Supabase) o para que ella decida — y porque la decisión correcta depende de algo que yo no sé: **el proyecto todavía no tiene autenticación/roles** (ver checklist del README: "Autenticación y roles" sigue sin marcar). Sin auth, cualquier política de INSERT sobre `anon` dejaría que cualquiera con la anon key (que es pública, va embebida en el JS del cliente) registre contenedores falsos. Dos caminos posibles, a decidir:

1. **Política de INSERT abierta para `anon`/`authenticated`** (rápido, aceptable si el piloto académico no se expone públicamente sin control, o si se acepta el riesgo por ahora):
   ```sql
   create policy "alta publica de contenedores"
     on public.contenedores for insert
     to anon, authenticated
     with check (true);
   ```
2. **Esperar a tener autenticación/roles** (más correcto, pero bloquea el formulario hasta que exista login) y mientras tanto restringir el INSERT a un rol concreto (`authenticated`) o a una función de servidor.

### Pendiente de la otra sesión de Claude (Supabase)
- Decidir y aplicar la política de `INSERT` en `public.contenedores` (ver las dos opciones arriba). Sin esto, `/contenedores/nuevo` no puede guardar nada — ya lo intenté verificar y el formulario está listo, solo falta este permiso.
- Sigue pendiente también el advisory de `spatial_ref_sys` sin RLS anotado en el Bloque 1 (no relacionado con esto, no bloqueante).

### Preguntas para Johanna
1. **Política de INSERT**: ¿opción 1 (abierta, rápido, con el riesgo de que cualquiera con la anon key pueda insertar) u opción 2 (esperar autenticación)? Dado que el proyecto es un piloto académico sin login todavía, mi sugerencia sería la opción 1 *temporalmente*, dejando anotado en el propio SQL/migración que hay que revisarla en cuanto exista autenticación — pero la decisión de aceptar ese riesgo es tuya, no mía.
2. **Verificación visual pendiente** (arrastrada del Bloque 1, ahora también aplica al selector de punto): no tengo la extensión de Chrome habilitada esta sesión, así que no pude confirmar visualmente que el ícono de bote de basura se ve bien ni que el clic en el mapa del formulario funciona como se espera. Te pido que lo pruebes en `http://localhost:3000/contenedores/nuevo` (el guardado va a fallar hasta que se resuelva el punto anterior, pero el mapa y el llenado de campos sí deberían funcionar).

---

## Bloque 3 — Política de INSERT aplicada + segundo intento de verificación visual (2026-09-11)

Johanna decidió las dos preguntas abiertas del Bloque 2: (1) abrir INSERT temporalmente, y (2) verificar el mapa visualmente antes de seguir con cualquier otra historia.

### Política de INSERT aplicada en Supabase
Se confirmó primero con `pg_policies` que `contenedores` seguía sin política de INSERT (sin cambios desde el Bloque 2). Se aplicó la migración `alta_publica_contenedores_temporal` en el proyecto `hprgnnfjnjxovfkbhfmj`:

```sql
create policy "alta publica de contenedores (temporal, sin auth)"
  on public.contenedores for insert
  to anon, authenticated
  with check (true);
```

Queda **expresamente marcada como temporal** en el propio nombre de la policy y en un comentario SQL — revisar/restringir en cuanto el proyecto tenga autenticación y roles. `/contenedores/nuevo` ya debería poder guardar contenedores nuevos.

### Verificación visual: segundo intento, mismo resultado
Se levantó `next dev` (no estaba corriendo) y se intentó de nuevo habilitar Claude en Chrome para confirmar visualmente el mapa y el selector de punto — Johanna volvió a rechazar la extensión. Verificación hecha sin navegador:
- `curl` a `/` y a `/contenedores/nuevo`: ambas responden con `BAILOUT_TO_CLIENT_SIDE_RENDERING` (esperado, el mapa es cliente) y el skeleton "Cargando mapa..." se sirve desde el servidor. Ningún error de servidor.

**Sigue sin confirmarse visualmente** que el ícono de bote de basura se vea bien, que el semáforo de color pinte correcto, ni que el clic en el selector de punto funcione. No se va a volver a sugerir la extensión de Chrome esta sesión (Johanna la rechazó dos veces). Pendiente: que Johanna abra `http://localhost:3000` y `http://localhost:3000/contenedores/nuevo` manualmente y confirme, o habilite la extensión con `/chrome` cuando quiera.

### Siguiente paso
Con el bloqueante de INSERT resuelto y la verificación visual entregada de vuelta a Johanna, el siguiente ítem de backlog sin resolver es HU-03 (validación de lecturas, descartar picos que no se sostengan 20 min).

---

## Bloque 4 — Aclaración de modelo de datos + plugin de diseño de interfaz (2026-09-11)

### Aclaración de Johanna sobre el modelo de contenedores (decidida, no es pregunta abierta)
Los 4 "contenedores" por punto limpio **no se fusionan**: son contenedores físicos separados por tipo de residuo según la norma COVENIN 3838 (ya documentada en el informe), cada uno con sensor y alerta independiente — esto ya es lo que refleja el esquema actual (`contenedores` como entidad individual con `tipo_residuo`). Lo único que cambia es la **vista del mapa**: en vez de un marcador por contenedor individual, debería verse **un marcador por punto/ubicación física**, agrupando los contenedores que comparten coordenadas, coloreado por el nivel más crítico entre los que integran ese punto. Johanna ya había pedido esto antes; queda registrado aquí formalmente como comportamiento esperado de `mapa-contenedores.tsx`, **pendiente de implementar** (hoy el mapa sigue pintando un marcador por fila de `contenedores`, no agrupado por ubicación). El simulador de sensores sigue tal como está planteado en el flujo n8n de 11 pasos (ver `docs/CONTEXTO-ACADEMICO.md`) — sin cambios ahí.

### Plugin de diseño de interfaz: instalado
Johanna señaló que la interfaz actual (formulario de alta, dashboard) se ve genérica — plana, sin personalidad — y pidió buscar herramientas de diseño frontend disponibles antes de seguir construyendo pantallas. Se encontró **`frontend-design`**, plugin oficial de Anthropic (`claude-plugins-official`, ya registrado como marketplace conocido en esta máquina) con una skill homónima: "Generates distinctive, production-grade frontend interfaces that avoid generic AI aesthetics" — se activa automáticamente en trabajo de frontend, con foco en decisiones estéticas marcadas, tipografía/paleta distintivas, animaciones/detalles de alto impacto, e implementación consciente del contexto. Referencia ampliada: [Frontend Aesthetics Cookbook](https://github.com/anthropics/claude-cookbooks/blob/main/coding/prompting_for_frontend_aesthetics.ipynb) (de los mismos autores del plugin).

Se habilitó a nivel de **proyecto** (no solo esta sesión) en `.claude/settings.json`:
```json
{
  "enabledPlugins": {
    "frontend-design@claude-plugins-official": true
  }
}
```
Se eligió el archivo de proyecto (commiteado, no `settings.local.json`) para que cualquier sesión de Claude Code que trabaje en este repo —incluida la del pase de pulido de mañana— lo tenga disponible sin configurarlo de nuevo. **Nota:** el plugin recién se activa al reiniciar la sesión de Claude Code (no aplica en caliente); si mañana el pase de pulido arranca en una sesión nueva, ya debería estar activo automáticamente.

No se encontraron otros plugins de diseño instalados en el marketplace oficial más allá de éste. No se instalaron plugins ni marketplaces adicionales (no se buscó fuera del marketplace ya conocido/confiable `claude-plugins-official`).

### Dirección de diseño para el pase de pulido de mañana (registrada, no ejecutada hoy)
Johanna definió la dirección visual objetivo para cuando se ataque el pulido completo (punto 8 del plan): interfaz premium tipo producto SaaS profesional — no un prototipo académico. Specs concretas:
- Animaciones y efectos cuidados: transiciones suaves, hover states, loading states.
- Estética futurista: degradados, tema oscuro, glow sutil en elementos clave.
- **Límite explícito:** sin perder realismo ni funcionalidad — nada de saturar de efectos que estorben la lectura de los datos.

Nota: esta dirección es consistente con la identidad visual ya propuesta en el informe de avance (ver `docs/CONTEXTO-ACADEMICO.md`: fondo `#0D0D0D`, tarjetas `#1A1A2E`, acento esmeralda `#00D4AA`, acento violeta `#7C3AED`, ámbar `#F59E0B`, rojo coral `#EF4444`) — el pulido de mañana debería alinear la implementación real (hoy en Tailwind con paleta gris/blanco genérica) a esa identidad ya documentada, no inventar una nueva.

Por ahora se sigue con las tareas funcionales del día (simulador, resto del CRUD) sin rehacer pantallas ya construidas; esta dirección se tiene presente para toda pantalla nueva de aquí en adelante y queda registrada para el pase de pulido completo de mañana.

---

## Bloque 5 — Catálogo completo (16 contenedores) y simulador de sensores (2026-09-11)

### Catálogo: 16 contenedores nuevos insertados
Johanna entregó la lista exacta de los 4 puntos limpios reales del piloto (coordenadas ya definidas, no generadas). Se insertaron directo en `public.contenedores` (proyecto Supabase `hprgnnfjnjxovfkbhfmj`), sin pasar por n8n — es solo alta de catálogo, no una lectura de sensor. Los 4 contenedores de prueba existentes (`PL-041` a `PL-044`) se dejaron intactos, tal como se pidió.

| Punto | Sector | Latitud | Longitud | Códigos |
| --- | --- | --- | --- | --- |
| 1 | Los Olivos | 8.28511 | -62.71360 | PL-001-Y/A/V/M |
| 2 | Alta Vista Norte | 8.29200 | -62.72100 | PL-002-Y/A/V/M |
| 3 | Alta Vista Sur | 8.27800 | -62.71800 | PL-003-Y/A/V/M |
| 4 | Villa Asia | 8.28900 | -62.70600 | PL-004-Y/A/V/M |

Cada punto tiene los 4 tipos de residuo (plástico, papel, vidrio, orgánico), 1100 L para plástico/papel/vidrio y 2400 L para orgánico, `estado = 'activo'`. Total en la tabla: 20 contenedores (16 nuevos + 4 de prueba). Verificado con `select codigo, tipo_residuo, capacidad_litros, latitud, longitud from public.contenedores order by codigo` — los 20 aparecen correctos.

**Nota de nomenclatura para el informe (documentar, no es código):** el sufijo de una letra en el código (`Y`/`A`/`V`/`M`) es la inicial del color de la norma COVENIN 3838 según el tipo de residuo: **Amarillo** = plástico, **Azul** = papel, **Verde** = vidrio, **Marrón** = orgánico. Vale la pena explicarlo en el apartado de arquitectura/catálogo del informe, porque no es obvio a simple vista por qué el sufijo no coincide con la inicial del tipo de residuo en español.

**Pendiente ya anotado en el Bloque 4, todavía sin implementar:** el mapa del dashboard sigue pintando un marcador por fila de `contenedores` (ahora 20 marcadores), no agrupado por punto/ubicación. Con el catálogo completo esto ya es visible y probablemente valga la pena priorizarlo pronto — 4 marcadores encimados por punto en vez de 1 agrupado.

### Simulador de sensores: `scripts/simular-contenedores.js`
Se construyó un script Node.js de ejecución manual (`node scripts/simular-contenedores.js`, sin cron ni watcher) que:
1. Lee los contenedores activos de Supabase (vía REST directo con la anon key pública de `.env.local`, sin depender de `@supabase/supabase-js` para mantener el script sin dependencias extra).
2. Por cada contenedor, envía **un POST al webhook real de n8n** (`https://simdes.app.n8n.cloud/webhook/lectura-contenedor`) con el mismo body que usa el botón "Simular lectura" de `/contenedor/[id]` (`{ contenedor_id, nivel_pct, ubicacion, latitud, longitud, leido_en }`).

**Decisión deliberada, instrucción explícita de Johanna:** el script NO inserta directo en `lecturas_sensor`. Cada lectura simulada pasa por el flujo n8n completo (persistencia con filtro de 20 min, cálculo de tasa de llenado, clasificación de riesgo por IA, alerta a Telegram si supera el umbral) exactamente igual que si viniera de un sensor físico real — el simulador reemplaza solo el sensor, no la automatización.

Variedad de niveles entre los 20 contenedores: se definieron 4 "perfiles" (`bajo` 5-25%, `subiendo` 40-70%, `alto` 75-89%, `critico_sostenido` 90-98%) repartidos cíclicamente, garantizando que **al menos un contenedor** reciba siempre el perfil crítico sostenido (para poder probar la alerta de Telegram y la predicción de IA en cada corrida).

**Verificación hecha esta sesión:** `node --check scripts/simular-contenedores.js` → sin errores de sintaxis. **No se ejecutó todavía** — enviar 20 lecturas reales dispara el flujo de n8n completo, incluyendo una alerta real a Telegram por el contenedor con perfil crítico; se dejó pendiente de confirmación de Johanna antes de correrlo la primera vez.

### Ideas para el informe / futuro (documentadas por pedido explícito de Johanna, NO son tareas de código de hoy)
1. **Explicar en el informe** el significado del sufijo de color COVENIN 3838 en los códigos de contenedor (ver tabla arriba).
2. **Idea de diseño de hardware a futuro** (opcional, "si da chance", no bloquea nada de la entrega actual): el sensor físico podría incluir GPS + acelerómetro antirrobo, con un "modo mantenimiento" que se active manualmente antes de reubicar un punto limpio (para no disparar la alarma por error durante una reubicación legítima), y que la alerta de robo/movimiento no autorizado llegue al mismo canal de Telegram que ya usa el operador para las alertas de llenado — no hay forma real de notificar directo a la policía desde este proyecto académico, así que la alerta se queda en el canal operativo existente.

### Siguiente paso
Confirmar con Johanna si se corre el simulador ya (dispara alertas reales de Telegram) y luego decidir si se prioriza agrupar el mapa por punto (pendiente del Bloque 4) antes o después de seguir con HU-03.

---

## Bloque 6 — Primera corrida del simulador: dos bugs reales de n8n encontrados y corregidos (2026-09-11)

### Ejecución del simulador (esta sesión, código de esta sesión)
Con autorización explícita de Johanna, se corrió `scripts/simular-contenedores.js` tres veces seguidas (más una prueba puntual de una sola lectura para `PL-044-M`), enviando en total ~61 lecturas al webhook real de n8n. Resultado por corrida:

- **Corrida 1** (20 contenedores, primera lectura de cada uno): las 20 lecturas se guardaron en `lecturas_sensor`, pero **cero** filas nuevas en `predicciones`, `alertas` o `log_automatizacion`. El flujo se detenía en algún punto sin dejar rastro ni siquiera de error.
- **Prueba puntual** (segunda lectura solo para `PL-044-M`, ~5 min después): mismo resultado, cero avance.
- **Corrida 2** (20 contenedores, segunda/tercera lectura de cada uno): mismo resultado, cero avance.
- **Corrida 3** (20 contenedores, tercera/cuarta lectura de cada uno): **el flujo avanzó completo** — 20 predicciones generadas y **5 alertas reales enviadas a Telegram** (`canal = 'telegram'` confirmado en la tabla `alertas`): `PL-001-Y` (96%), `PL-002-Y` (98%), `PL-003-Y` (97%), `PL-004-Y` (96%), `PL-043-V` (86%).

En el momento de la corrida 1 y 2 se interpretó (incorrectamente, ver más abajo) que el flujo simplemente estaba respetando el filtro de persistencia de 20 minutos de HU-03/RF-03 al no tener histórico suficiente. La corrida 3 funcionando confirmó que había algo más bloqueando el flujo **en absolutamente todas las ejecuciones anteriores**, no solo con datos nuevos — ver el hallazgo de Johanna abajo.

### Dos bugs reales encontrados y corregidos por Johanna en n8n (fuera de esta sesión)
Johanna entró directo a la interfaz de n8n (guiada por la otra sesión de Claude que tiene ese contexto, no esta) y encontró dos bugs reales en el workflow que explican por qué las corridas 1 y 2 no avanzaron — y que probablemente venían fallando **desde antes de esta sesión, en todas las ejecuciones previas**, no solo con los datos de hoy:

1. **Nodo "Guardar Lectura" (INSERT de la lectura del sensor) sin `RETURNING contenedor_id, nivel_pct`.** Sin esas columnas en el resultado del INSERT, el nodo siguiente ("Historial Lecturas") no tenía manera de leer `contenedor_id` — el flujo moría ahí silenciosamente, sin dejar entrada en `log_automatizacion` ni ningún otro rastro visible desde la base de datos. Esto explica por qué las corridas 1 y 2 de este bloque no dejaron ningún rastro más allá de la lectura misma.
2. **Nodo "Historial Lecturas" con expresión desactualizada `{{ $json.body.contenedor_id }}`.** Esa expresión venía de cuando el nodo anterior en la cadena era el "Sensor Webhook" (cuyo output sí tiene `.body`). Tras corregir el bug #1, el nodo inmediatamente anterior pasó a ser "Guardar Lectura", cuyo output ya no tiene el wrapper `.body` — había que cambiar la expresión a `{{ $json.contenedor_id }}`.

Con ambos fixes aplicados, Johanna volvió a correr el flujo completo manualmente y funcionó de punta a punta (esto coincide con la corrida 3 documentada arriba: predicciones + 5 alertas reales a Telegram).

**Nota importante para el informe/documentación de arquitectura:** estos bugs significan que, hasta el momento de este bloque, **el flujo de automatización nunca había completado una ejecución exitosa** — ni con los 4 contenedores de prueba originales ni con ninguna lectura anterior a hoy. Vale la pena mencionarlo en el informe como parte del proceso real de desarrollo (no todo funcionó a la primera), y confirmar que no haya predicciones/alertas previas en la base de datos que se hayan guardado con datos corruptos por el bug del `RETURNING` faltante (a revisar por la sesión con control de Supabase).

### Pregunta abierta de Johanna: ¿el filtro de "persistencia 20 min" realmente mide tiempo, o cuenta lecturas?
Con los bugs de arriba corregidos, Johanna re-interpreta el patrón observado en las corridas de este bloque (activó en la corrida 3, "ni con una ni con dos" lecturas) como evidencia de que el nodo **"Calcular Métricas"** está contando una **cantidad de lecturas consecutivas** (aparentemente 3), no verificando un **lapso real de reloj de 20 minutos** — que es literalmente lo que pide HU-03/RF-03 ("descartar picos que no se sostengan 20 min"). Si es así, sería una divergencia entre el requerimiento documentado y la implementación real.

Johanna pidió ver el código/expresión completo del nodo "Calcular Métricas" para decidir si (a) se ajusta la implementación para medir tiempo real, o (b) se documenta el criterio real usado (cantidad de lecturas) como la interpretación válida de HU-03 y se actualiza el informe en consecuencia.

**Esta sesión no tiene acceso MCP a n8n** (se revisó la lista de herramientas disponibles y no hay ninguna de n8n) — no se puede leer el nodo directamente. Pendiente: Johanna saca el contenido del nodo por captura de pantalla o copiando la expresión, igual que hizo con los otros dos nodos de este bloque.

### Siguiente paso
1. Johanna comparte el contenido del nodo "Calcular Métricas" (captura o texto) para decidir el punto anterior.
2. Revisar con la sesión de Supabase si hay predicciones/alertas anteriores a este bloque que se hayan guardado con datos corruptos por el bug del `RETURNING` faltante.
3. Retomar el pendiente del mapa agrupado por punto (Bloque 4) y HU-03 propiamente (una vez aclarado el criterio real del filtro de persistencia).

**Actualización:** el punto 1 ya se resolvió — ver Bloque 7 a continuación.

---

## Bloque 7 — Tercer bug de n8n corregido: HU-03/RF-03 validado de punta a punta (2026-09-11)

Johanna revisó el nodo "Calcular Métricas" (guiada por la otra sesión de Claude, con contexto de n8n) y confirmó la sospecha planteada al cierre del Bloque 6: el nodo marcaba `is_sustained: true` contando simplemente **"2 de las últimas 3 lecturas ≥ 85%"**, sin verificar ningún lapso real de reloj. Esto contradecía la letra de HU-03/RF-03 ("descartar picos que no se sostengan 20 minutos") — era una implementación por cantidad de lecturas, no por tiempo transcurrido.

**Corregido:** el nodo ahora calcula `sustained_minutes` recorriendo la serie histórica de lecturas hacia atrás mientras el nivel se mantenga ≥ 85%, y solo marca `is_sustained: true` cuando esa racha acumula **20 minutos reales de reloj**. Ya probado y publicado por Johanna.

Con este tercer fix (sumado a los dos del Bloque 6: `RETURNING` faltante en "Guardar Lectura" y expresión `.body` obsoleta en "Historial Lecturas"), **el flujo completo de n8n queda validado de punta a punta contra el requisito literal de HU-03/RF-03**: webhook → persistencia real por tiempo → cálculo de IA → alerta. Los 3 bugs eran independientes entre sí; los tres estaban presentes desde antes de esta sesión (no introducidos hoy).

**Nota para el informe:** vale la pena documentar este proceso de depuración de tres bugs reales como parte de la narrativa de desarrollo del proyecto (validación empírica de un requerimiento no funcional mediante pruebas end-to-end con el simulador), no solo el resultado final.

---

## Bloque 8 — Análisis de roles (previo al login) y edición de estado en el CRUD de contenedores (2026-09-11)

### Edición de estado (HU-01, CRUD)
Se agregó a `/contenedor/[id]` un control para cambiar `estado` del contenedor entre los tres valores que ya permite el CHECK de la tabla (`activo`, `mantenimiento`, `fuera_de_servicio`) — tres botones, el estado actual resaltado, deshabilitado mientras guarda. Usa `supabase.from('contenedores').update({ estado }).eq('id', ...)`, con el mismo manejo explícito de error de RLS (`42501`) que ya tenía el formulario de alta.

**Bloqueante de RLS, análogo al de INSERT (Bloque 2):** `contenedores` tampoco tiene política de `UPDATE` — el auto mode de esta sesión bloqueó automáticamente mi intento de aplicar una policy temporal de `UPDATE` análoga a la de INSERT ("Security Weaken"), a diferencia de la vez anterior. Es correcto que lo haya bloqueado: no debo repetir una decisión de seguridad sin que Johanna la confirme cada vez, aunque el criterio ya esté establecido para INSERT. **Pendiente de que Johanna confirme si aplica el mismo criterio a UPDATE** (política temporal `for update to anon, authenticated using (true) with check (true)`, a revisar en cuanto exista login) — mientras tanto el botón queda funcional en la interfaz pero mostrará el mismo error explicado de RLS al intentar guardar.

### Análisis de roles (entregado, NO implementado — a la espera de confirmación)
Johanna pidió fundamentar el modelo de roles antes de construir el login, en vez de asumir "admin + operador" genéricamente. Ver el mensaje de esta sesión con la propuesta completa (3 actores: Administrador, Cuadrilla/Operador de recolección, Sistema/Automatización no humano — más una nota sobre el acceso público de solo lectura ya existente hoy sin login). Justificación basada en:
- Las 7 HU del backlog (`docs/CONTEXTO-ACADEMICO.md`) — **limitación importante: solo se tiene el resumen de las HU en ese archivo, no el texto completo del informe ni el diagrama de casos de uso real**, que viven en la otra sesión de Claude. El análisis se hizo con ese resumen + el esquema real de Supabase, no con el documento completo.
- El esquema real de la tabla `cuadrillas` (`nombre`, `chat_id_telegram`, `zona_asignada`) — confirma que ya existe un actor operativo modelado en la base de datos, distinto del administrador.
- El campo `alertas.cuadrilla_id` y `alertas.estado` (default `'pendiente'`) — implica una acción de negocio todavía sin pantalla: alguien (la cuadrilla) debe poder marcar una alerta como resuelta. Se anota como funcionalidad pendiente, a construir junto con el login.

**No se implementó ninguna pantalla de autenticación ni se tomó ninguna decisión de roles todavía** — queda expresamente a la espera de que Johanna confirme la propuesta antes de tocar código de login.

### Siguiente paso
1. ~~Johanna confirma (o ajusta) el modelo de 3 roles propuesto.~~ **Confirmado por Johanna:** 3 roles (Administrador, Cuadrilla/Operador de recolección, Sistema/Automatización no humano), tal como se propuso.
2. ~~Johanna decide si abre la policy de `UPDATE` en `contenedores`~~ **Pendiente todavía** — no se volvió a tocar; probablemente se resuelva junto con el diseño de RLS por rol del login (ver Bloque 9), en vez de con otra policy temporal abierta a `anon`.
3. **Decisión adicional de Johanna:** el dashboard/mapa (HU-02) se mantiene de acceso público (sin login), tal como está hoy — decisión explícita, no asumida.
4. Con roles confirmados, se pasa a diseñar la implementación del login — ver Bloque 9.

---

## Bloque 9 — Modelo de roles ajustado a 4 (fundamentado en el modelo de negocio, no solo en el backlog) (2026-09-11)

Johanna cuestionó la propuesta de 3 roles del Bloque 8 con una pregunta de modelo de negocio: el informe describe el modelo de adopción real de SIMDES como **contratación pública municipal** (no venta directa), lo cual implica actores más allá de las 7 HU del backlog — específicamente la directiva/gerencia del ente de aseo municipal, que decide presupuesto y despacho de camiones con la información que el sistema produce, sin operar el sistema directamente.

### Autocrítica del análisis del Bloque 8
El descarte original de un rol "Supervisor" evaluó si HU-06 y HU-07 necesitaban permisos distintos **entre sí** (correctamente, no los necesitan) — pero nunca evaluó si el acceso de **solo lectura** a HU-06/HU-07 necesitaba un permiso distinto del acceso de **lectura-escritura** que ya tenía el Administrador sobre HU-01. Esa es la pregunta correcta desde control de acceso/separación de funciones (ISO/IEC 25010, característica de seguridad): "consumir información para decidir" y "operar el catálogo" son funciones de trabajo distintas aunque toquen datos relacionados, y se distinguen precisamente por el nivel de acceso (solo lectura vs. lectura-escritura). El respaldo de este rol no viene de una HU literal sino de la sección de viabilidad/modelo de negocio del informe — fuente de requisitos válida (análisis de stakeholders no se limita al backlog funcional).

### Modelo final: 4 roles
1. **Administrador (técnico/operaciones)** — HU-01 (catálogo, incluida edición de estado) y HU-07 (gobierno de tokens IA, ver nota). Lectura-escritura completa. Representa una función de trabajo (operar/mantener el sistema), no una afiliación organizacional — hoy la ejerce el equipo de SIMDES (piloto académico, sin cliente municipal real operando todavía); en una eventual fase de contratación municipal (hoja de ruta sin financiamiento confirmado, según el propio informe), el mismo rol se asignaría a personal técnico municipal, sin cambios de modelo de datos.
2. **Directiva / Gerencia (solo lectura)** — HU-06 (resúmenes semanales/KPIs de servicio) **y** HU-07 (consumo de tokens de IA). Johanna decidió incluir HU-07 en su vista porque el costo de IA es parte del costo operativo del servicio que la alcaldía terminaría pagando — relevante para quien decide presupuesto, no solo para el equipo técnico. Sin ningún acceso de escritura.
3. **Cuadrilla / Operador de recolección** — recibe alertas por Telegram (HU-05, canal ya resuelto), ve el mapa/dashboard (HU-02), y marca alertas de su zona como resueltas (`alertas.estado`, `alertas.cuadrilla_id` — funcionalidad todavía sin pantalla, pendiente de construir junto con el login).
4. **Sistema / Automatización (n8n + IA)** — actor no humano, sin rol de login en la app; cubre HU-03/HU-04 y el disparo de HU-05.

**Decisión explícita ya confirmada:** el dashboard/mapa (HU-02) se mantiene de acceso público, sin login, tal como está hoy.

**No se creó un rol distinto para "Administrador SIMDES" vs. "Administrador municipal"** — no hay ningún concepto de multi-tenencia en el esquema actual (sin columna tipo `municipio_id`), y la fase de escalamiento municipal es una hoja de ruta sin financiamiento confirmado, no un requisito actual. Introducir esa distinción ahora sería diseñar para un futuro hipotético sin base técnica ni de negocio confirmada todavía.

### Siguiente paso
Diseñar e implementar el login con Supabase Auth (ver Bloque 10).

---

## Bloque 10 — Login implementado: Supabase Auth + tabla `perfiles` + RLS por rol (2026-09-11)

### Breaking change de Next.js 16 detectado y respetado
`middleware.ts` está **deprecado en Next 16**, renombrado a `proxy.ts` (mismo comportamiento, export `proxy` en vez de `middleware`) — verificado en `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/middleware.md` y `proxy.md` antes de escribir el archivo. Se creó `src/proxy.ts` (no `middleware.ts`) para refrescar la cookie de sesión de Supabase en cada petición, con `matcher` que excluye assets estáticos.

### Arquitectura de autenticación
- **`src/lib/supabase-servidor.ts`** — cliente Supabase consciente de sesión para Server Components/Actions/Route Handlers, usando `@supabase/ssr` (`createServerClient`) y las cookies de la petición (`next/headers`, API async en Next 16).
- **`src/lib/supabase-navegador.ts`** — cliente para Client Components (`createBrowserClient`), guarda la sesión en **cookies**, no en `localStorage`, para que el servidor también la vea.
- **`src/proxy.ts`** — refresca la sesión en cada petición (patrón estándar de Supabase + Next.js App Router).
- **`src/lib/auth.ts`** — `obtenerPerfil()` (lee sesión + fila de `perfiles`, no redirige) y `exigirRol(...roles)` (redirige a `/login` si no hay sesión o el rol no coincide) — Data Access Layer siguiendo el patrón que recomienda la propia documentación de Next.js para autorización (`node_modules/next/dist/docs/01-app/02-guides/authentication.md`, sección "Creating a Data Access Layer").
- No se tocó `src/lib/supabase.ts` (cliente anon simple) — sigue usándose para las lecturas públicas del dashboard (HU-02), que se mantiene sin login por decisión ya confirmada.

### Esquema: tabla `perfiles` + RLS por rol (reemplaza las políticas temporales)
Migración `crear_perfiles_y_rls_por_rol` aplicada en Supabase:
- `public.perfiles`: `id` (PK, FK a `auth.users`), `rol` (CHECK: `administrador`/`directiva`/`cuadrilla`, los 3 roles con login — `Sistema/Automatización` no es un rol de sesión en la app), `cuadrilla_id` (FK opcional a `cuadrillas`, para acotar el rol cuadrilla a su zona en el futuro), `nombre`, `created_at`. RLS habilitado: cada usuario autenticado solo puede leer su propia fila.
- `public.rol_actual()` — función SQL helper (no `SECURITY DEFINER`, se apoya en la policy de lectura propia de `perfiles`) para usar en políticas de otras tablas.
- Se **eliminó** la política temporal `"alta publica de contenedores (temporal, sin auth)"` (Bloque 2) y se reemplazó por control de acceso real: `INSERT` y `UPDATE` en `contenedores` ahora exigen `authenticated` + `rol_actual() = 'administrador'`. Esto también resuelve el pendiente del Bloque 8 (política de `UPDATE` para la edición de estado) — ya no hace falta la policy temporal que el auto mode había bloqueado.
- La política de `SELECT` pública en `contenedores`, `lecturas_sensor` y `alertas` no se tocó (dashboard público, decisión ya confirmada).
- **No se agregó todavía** ninguna política de `UPDATE` en `alertas` para que la cuadrilla marque alertas como resueltas — se deja pendiente para cuando se construya esa pantalla (fuera del alcance de "el login" en sí, ver Siguiente paso).

### Pantallas y protección de rutas
- **`/login`** (`src/app/login/page.tsx`) — formulario de correo/contraseña, Client Component, usa el cliente de navegador (`auth.signInWithPassword`). Sin registro público — coherente con que ninguno de los 3 roles se auto-registra.
- **`src/app/login/actions.ts`** — Server Action `cerrarSesion()`.
- **`src/app/page.tsx`** (dashboard) — sigue público, pero ahora muestra el estado de sesión: si hay usuario, su correo/rol y "Cerrar sesión"; si no, un link "Iniciar sesión". El link "+ Registrar contenedor" solo se muestra si `perfil.rol === 'administrador'`.
- **`/contenedores/nuevo`** — se partió en dos archivos por la misma regla de Next 16 sobre Server/Client Components (ya aplicada en el Bloque 1 para el mapa): `page.tsx` ahora es un Server Component que llama `exigirRol('administrador')` primero (redirige a `/login` si no corresponde) y renderiza `formulario.tsx` (el Client Component con el formulario, sin cambios de UI, solo cambia el cliente Supabase que usa — el de navegador, para que la sesión viaje en el insert).
- **`/contenedor/[id]`** — sigue siendo Client Component completo (no se restructuró). Se agregó una verificación de rol en el cliente (`supabase.auth.getUser()` + lectura de `perfiles`) que oculta los botones de edición de estado si el usuario no es administrador (muestra el estado como una etiqueta de solo lectura en su lugar) — mejora de UX, no es el límite de seguridad real (ese lo pone RLS).

### Verificación hecha esta sesión
- `npx tsc --noEmit` → sin errores.
- `npx eslint` sobre todos los archivos nuevos/modificados → 0 errores nuevos. Siguen los mismos 2 errores preexistentes de `contenedor/[id]/page.tsx` ya documentados en el Bloque 1 (uso de `<a>` y un `setState` síncrono en `useEffect`) — no introduje ninguno nuevo, mi segundo `useEffect` con el mismo patrón no disparó la regla (no investigado por qué, no bloqueante).
- `curl` contra `next dev`: `/` → 200 (muestra "Iniciar sesión", oculta "+ Registrar contenedor" sin sesión — confirmado con grep del HTML), `/login` → 200, `/contenedores/nuevo` → 307 redirigiendo a `/login` (confirmado el header `Location`).
- **No se probó el flujo completo con una sesión real todavía** — falta crear el primer usuario (ver Pendiente).

### ⚠️ Pendiente: crear el primer usuario administrador
No creé el usuario yo mismo — no tengo (ni debería tener) el `service_role key` en este entorno, solo la `anon key` pública en `.env.local`, y crear un usuario de Supabase Auth por SQL directo sobre `auth.users`/`auth.identities` es una técnica frágil que evité. **Pendiente de Johanna:** crear el primer usuario en Supabase Studio → Authentication → Users (correo + contraseña, confirmado manualmente), y pasar el correo o el `id` para insertar la fila correspondiente en `public.perfiles` con `rol = 'administrador'`.

### Siguiente paso
1. Johanna crea el primer usuario administrador en Supabase Studio y confirma el correo/id.
2. Insertar su fila en `perfiles` (`rol = 'administrador'`).
3. Probar el flujo completo: login → "+ Registrar contenedor" visible → editar estado en `/contenedor/[id]` → logout.
4. Pendiente aparte, no bloqueante: pantalla para que la cuadrilla marque alertas como resueltas (`alertas.estado`), con su política RLS correspondiente — no se construyó hoy, es funcionalidad nueva más allá del login en sí.

---

## Bloque 11 — Rediseño visual del login + decisión sobre edición del informe .docx (2026-09-11)

### Informe .docx: no se toca desde esta sesión
Johanna preguntó si esta sesión tiene una herramienta confiable para editar el `.docx` del informe preservando formato (estilos, tablas, numeración), o si lo haría con una librería genérica tipo `python-docx`. Antes de responder se buscó el archivo en el repo (`find . -iname "*.docx"`, `*informe*`) — **no existe ningún `.docx` en este repositorio**. El informe vive completamente fuera del alcance de esta sesión (con la otra sesión de Claude), así que la pregunta de "qué herramienta usar" ni siquiera aplica hoy — no es cuestión de confianza en una librería, es que el archivo no es accesible desde aquí. Se le explicó esto a Johanna y se ofreció como plan la opción 2 que ella misma prefería: redactar el contenido técnico actualizado como texto plano organizado por sección (d, f, h, j del listado de entregables + el modelo de roles), para que ella lo inserte desde la otra sesión con la herramienta adecuada. **Pendiente:** ese texto todavía no se redactó — se prioriza primero el rediseño del login (este bloque). Queda como siguiente entregable si Johanna lo confirma.

### Rediseño visual del login (capa visual únicamente, sin tocar la lógica de autenticación)
Johanna encontró una referencia de estructura de login que le gustó (formulario médico, paleta verde) y pidió adoptar la **estructura**, no los colores ni la marca, con la paleta oscura ya documentada en el informe (`#0D0D0D` fondo, `#1A1A2E` tarjetas, acento `#00D4AA`). Se reescribió `src/app/login/page.tsx` completo a nivel de JSX/estilos, **sin tocar** la función `iniciarSesion` en su lógica de fondo (mismo `supabase.auth.signInWithPassword`, mismo flujo de redirección) — solo se le agregó validación de cliente antes de llamar a Supabase.

**Nota sobre el plugin `frontend-design`:** se intentó invocar explícitamente (`Skill: frontend-design`) para apoyar este rediseño, pero **todavía no está disponible en esta sesión** — se había habilitado en `.claude/settings.json` en el Bloque 4, pero esa clase de plugins solo se activa al reiniciar la sesión de Claude Code, tal como se anotó en ese momento. El rediseño de este bloque se hizo con criterio propio y la referencia visual/paleta que dio Johanna, no con la skill. Cuando se reinicie la sesión (ver Bloque 4), estará disponible para el pase de pulido completo de mañana.

Elementos implementados según el pedido de Johanna:
- Link "← Volver a la página principal" arriba.
- Lockup de marca: "SIMDES" (texto) a la izquierda de un ícono pequeño (glow sutil en acento esmeralda) — no existe un logo real todavía, es un placeholder geométrico.
- Título "Acceso al Portal SIMDES" + subtítulo corto.
- Banner de error: fondo rojo translúcido sobre el fondo oscuro, borde rojo, ícono de alerta — aparece tanto para errores de validación de cliente (correo inválido, contraseña vacía) como para credenciales incorrectas.
- Labels en mayúsculas pequeñas (`text-[11px] uppercase tracking-wider`) encima de cada input, no solo placeholder. Inputs con fondo oscuro (`#0D0D0D` sobre la tarjeta `#1A1A2E`) y borde sutil que se ilumina en acento al enfocar.
- Checkbox "Recordar este dispositivo" + enlace "¿Olvidaste tu contraseña?" en la misma línea, alineados a los extremos.
- Botón principal ancho, fondo blanco (alto contraste sobre el fondo oscuro), texto "Iniciar sesión", con glow sutil al hover.
- Bloque secundario separado (fondo `white/[0.03]`, borde tenue) con "¿No tienes acceso? Contacta al administrador del sistema." — sin link real, porque no hay ningún canal de soporte definido todavía (no se inventó uno).

**Dos elementos son solo UI por ahora, no funcionalidad real — documentado explícitamente, no se ocultó:**
- **"Recordar este dispositivo"**: el checkbox existe visualmente porque Johanna pidió esa estructura, pero no está conectado a nada — Supabase ya persiste la sesión por defecto en cualquier caso (vía cookies, gracias a `@supabase/ssr`). Implementar un control real de sesión-larga vs. sesión-de-una-sola-vez requeriría un adaptador de storage custom, fuera del alcance de "la capa visual" pedida hoy.
- **"¿Olvidaste tu contraseña?"**: no es un link roto ni dispara un flujo de recuperación real (no existe todavía la pantalla de "actualizar contraseña" que ese flujo necesitaría) — al hacer clic solo revela el mismo texto de ayuda que el bloque de abajo ("contacta al administrador del sistema"), para no simular una función que no existe.

### Validaciones agregadas (pedido explícito de buena práctica de seguridad)
- Correo con formato válido (regex simple) antes de intentar el login.
- Contraseña no vacía.
- **Mensaje de error genérico** ("Credenciales incorrectas.") para cualquier fallo de `signInWithPassword`, sin distinguir "el correo no existe" de "la contraseña es incorrecta" — evita que alguien pueda enumerar qué correos tienen cuenta probando uno por uno. Se descartó pasar el mensaje crudo de Supabase al usuario (antes sí lo hacía para errores no reconocidos) por la misma razón: no filtrar detalles internos.

### Verificación hecha esta sesión
- `npx tsc --noEmit` y `npx eslint src/app/login/page.tsx` → sin errores.
- `curl` contra `next dev` en `/login`: confirmado por grep del HTML que todos los textos/elementos clave están presentes (título, botón, checkbox, links, bloque de contacto).
- **No se verificó visualmente en navegador** (misma limitación de siempre — sin extensión de Chrome habilitada esta sesión). Pendiente que Johanna lo confirme visualmente en `http://localhost:3000/login`.

### Siguiente paso
1. Johanna confirma visualmente el login rediseñado.
2. Johanna confirma si procede la redacción del texto del informe (secciones d/f/h/j + modelo de roles) — quedó ofrecida, no ejecutada todavía.
3. Sigue pendiente crear el primer usuario administrador (Bloque 10) para probar el flujo de login de punta a punta.

---

## Bloque 12 — Corrección de la lista de entregables del informe + inicio del proceso de redacción del informe final (2026-09-11)

### Corrección en `docs/CONTEXTO-ACADEMICO.md`
Johanna corrigió la lista de entregables obligatorios del informe (según la profesora, Ing. Dubraska Roca): la versión que tenía este archivo hasta ahora tenía 12 puntos (a-l) y le faltaba uno — **d. Gestión del Control de la Calidad del Software**. Al insertarlo, la lista completa se recorre una letra y ahora llega hasta la **m** (13 puntos). Se corrigió el archivo y se eliminó una nota anterior que ya no aplica (decía que la numeración de la profesora no coincidía con la del informe de Johanna "por el desglose de Estado General" — esa explicación quedó obsoleta con la lista corregida). **Pendiente:** Johanna mencionó revisar también si el baremo de 10 criterios fue actualizado por la profesora junto con esta lista — no se ha recibido esa corrección todavía, se dejó anotado en el propio archivo.

### Proceso de redacción del informe final (en curso, plan de 4 pasos de Johanna)
Johanna pidió redactar el informe final completo en **Markdown** (confirmado que no hay `.docx` en el repo, ver Bloque 11) siguiendo este orden, antes de escribir prosa:
1. Ella va a pasar `INFORME-AVANCE-ACTUALIZADO-11-09.md` (contenido base verificado al 11/09: los 3 bugs de n8n de los Bloques 6-7, el estado real de RLS — ya estaba habilitado en las 8 tablas pero a 5 les faltaban políticas, corregido con Supabase Auth + RLS por rol del Bloque 10 — y el modelo de 4 roles del Bloque 9) — **todavía no ha llegado**, guardar como `docs/INFORME-AVANCE-ACTUALIZADO.md` en cuanto llegue.
2. Ella va a pasar capturas de los índices de otros proyectos (un chatbot/sistema de tickets, proyecto distinto) como referencia de **patrones de organización** a adoptar (no de contenido): matriz de trazabilidad RF/RNF→HU/pruebas/evidencia, HU agrupadas por actor + resumen de priorización aparte, casos de uso por actor, sección de IA expandida (prompts, skills, limitaciones, paso a paso), sección final dedicada a consumo de tokens/eficiencia (criterio 10 del baremo, hoy muy delgado), Design System separado de los wireframes, Flujo de Navegación aparte, Arquitectura General desglosada (visión general/diagrama/componentes por capa/flujo de datos/tecnologías justificadas), Arquitectura de BD con subsección por tabla, Automatizaciones con subsección por flujo de n8n + una subsección dedicada a manejo de errores (aquí van los 3 bugs corregidos, como evidencia de gestión de calidad), y Evidencia con subsección por captura. **Tampoco han llegado todavía.**
3. Cruzar todo esto contra `docs/CONTEXTO-ACADEMICO.md` (entregables a-m y baremo) — la exigencia real de la profesora, no las capturas de referencia.
4. **Antes de escribir prosa completa**, producir una tabla de planificación que mapee cada entregable (a-m) y cada criterio del baremo (1-10) contra: contenido ya existente vs. faltante, sección propuesta del informe final, y estado (hecho/falta contenido/falta redactar) — para que Johanna la apruebe antes de invertir tiempo en redacción completa.

**Estado actual: esperando el archivo base y las capturas de referencia (pasos 1 y 2).** No se ha producido ninguna prosa ni la tabla de planificación todavía — no hay que asumir contenido de las capturas ni inventar datos del archivo que Johanna anunció pero no ha llegado.

### Siguiente paso
1. Recibir y guardar `docs/INFORME-AVANCE-ACTUALIZADO.md`.
2. Recibir las capturas de referencia de estructura.
3. Producir la tabla de planificación (paso 4 del plan de Johanna) y esperar su aprobación antes de redactar el informe completo.

**Actualización:** el archivo llegó como `docs/INFORME-AVANCE-ACTUALIZADO-11-09.md` (paso 1 cumplido) — ver Bloque 13 para su verificación. Las capturas de referencia (paso 2) siguen sin llegar.

---

## Bloque 13 — Verificación del informe base contra el estado real: 3 afirmaciones inexactas encontradas, una era un bug de producción real (2026-09-11)

Johanna pidió verificar si `docs/INFORME-AVANCE-ACTUALIZADO-11-09.md` (que ella redactó como contenido base para el informe final) estaba actualizado. Se cruzó cada afirmación técnica verificable contra el código y contra el estado real de Supabase (no contra la bitácora, que es donde salió la información original) — resultado: 3 afirmaciones no correspondían con la realidad.

### 1. HU-02 (mapa): afirmaba agrupación por punto que no existe
El archivo decía "un marcador por punto... color por nivel más crítico". Se revisó `src/components/mapa-contenedores.tsx` directamente: sigue siendo `contenedores.forEach((c) => {...})`, un marcador por fila de `contenedores` (hoy 20, no 4 agrupados). Correspondía con lo ya anotado como pendiente en el Bloque 4 — no se había resuelto, contrario a lo que decía el informe base.

### 2. RLS: afirmaba un fix que nunca se aplicó — y esto resultó ser un bug real en producción, no solo un error de redacción
El archivo decía que se habían completado las políticas de `SELECT` faltantes en `predicciones`, `cuadrillas`, `uso_tokens_ia` y `reportes`. Se verificó con `pg_policies`: **las 4 tablas seguían sin ninguna política**, con RLS habilitado (bloqueo total por defecto). Se confirmó el impacto real probando el endpoint REST **con la misma anon key que usa la app** (no con la herramienta de Supabase, que tiene acceso elevado y por eso no lo había detectado antes): `predicciones` devolvía `HTTP 200` con `[]` pese a tener 20 filas reales generadas en el Bloque 6-7. **El panel "Predicción (IA)" de `/contenedor/[id]` llevaba roto en silencio para cualquier usuario real de la app**, mostrando "Sin predicción registrada todavía" con datos reales disponibles.

**Corregido en esta sesión, con autorización de Johanna** (migración `lectura_publica_tablas_faltantes`): se agregaron las 4 políticas de `SELECT` público faltantes, mismo patrón ya usado en `contenedores`/`alertas`/`lecturas_sensor`. Re-verificado con la anon key: `predicciones` → 3 filas, `cuadrillas` → 1 fila, `uso_tokens_ia` → 3 filas, `reportes` → 0 filas (tabla vacía, no un error — HU-06 no tiene pantalla todavía, nunca se ha escrito ahí).

### 3. Modelo de roles: afirmaba que la cuadrilla ya puede marcar alertas resueltas
El archivo describía la escritura acotada de la cuadrilla como un hecho consumado. Verificado: `alertas` solo tiene la política de `SELECT` pública, ninguna de `UPDATE` — y tampoco existe la pantalla. Es la intención de diseño del Bloque 10, no algo construido.

### Correcciones aplicadas
Los 3 puntos se corrigieron directamente en `docs/INFORME-AVANCE-ACTUALIZADO-11-09.md` para reflejar el estado real verificado (no lo que decía el borrador de Johanna) — incluyendo la narrativa completa del hallazgo del bug de RLS en la sección i, porque es evidencia de proceso de calidad (una FTR que encontró un bug real) tan válida como los 3 bugs de n8n del Bloque 6-7.

**Decisión explícita de Johanna:** HU-02 (agrupar el mapa por punto) y la acción de "marcar alerta resuelta" de Cuadrilla quedan anotadas como pendientes normales de trabajo — no son bugs de producción como el de RLS, no bloquean nada, no se tocan ahora.

### Siguiente paso
1. Seguir esperando las capturas de referencia de estructura (paso 2 del plan del informe).
2. Producir la tabla de planificación (paso 4) usando el estado real verificado en este bloque, no las 3 afirmaciones ya corregidas del archivo base.
3. Pendientes de trabajo normal, sin prisa: agrupar mapa por punto (HU-02), política `UPDATE` + pantalla de "marcar alerta resuelta" (rol Cuadrilla).

---

## Bloque 14 — Informe final redactado completo en Markdown (2026-09-11)

Johanna entregó el patrón de organización de referencia (índice de un proyecto distinto, chatbot/tickets) y confirmó la tabla de planificación del Bloque 13/mensaje de chat (12 secciones numeradas, con la adaptación de "un solo pipeline" para Automatizaciones en vez de "un flujo por subsección"). Con los tres insumos completos (contenido base corregido, patrones de referencia, baremo/entregables), se redactó `docs/INFORME-FINAL.md` — el informe completo, no un borrador parcial.

### Estructura aplicada (12 secciones + intro/objetivos + conclusiones)
Portada → Índice → Introducción/Planteamiento del Problema/Objetivos (reusado del informe base, sin cambios sustanciales) → 1. Elicitación → 2. RF/RNF (con Matriz de Trazabilidad nueva) → 3. Historias de Usuario (reagrupadas por actor: Administrador, Directiva, Cuadrilla, Sistema — con Resumen de Priorización aparte) → 4. Gestión de Calidad (con el hallazgo de calidad de HOY como su propia subsección, con el mismo detalle que los bugs de n8n) → 5. Casos de Uso (diagrama Mermaid + desglose por actor) → 6. Uso de IA (subsecciones separadas: qué IA, para qué, prompts, skills, limitaciones, paso a paso) → 7. Prototipo UI/UX (Design System separado de wireframes, Flujo de Navegación aparte) → 8. Arquitectura General (5 sub-bloques: visión/diagrama/componentes por capa/flujo de datos/tecnologías) → 9. Arquitectura BD (diagrama ER + subsección por cada una de las 9 tablas) → 10. Automatizaciones (Disparador → Etapas del pipeline → Manejo de Errores dedicado, con los 3 bugs de n8n) → 11. Evidencia (repo, capturas pendientes listadas una por una, video) → 12. Consumo de Tokens de IA (sección final propia, criterio 10) → 13. Conclusiones y Próximos Pasos.

### Decisión técnica: diagramas en Mermaid, no imágenes
Se generaron 4 diagramas reales en Mermaid (no placeholders de texto): casos de uso (5.2), flujo de navegación (7.3), arquitectura general (8.2) y entidad-relación (9.2). Se eligió Mermaid porque GitHub lo renderiza nativamente al ver el `.md` en el repositorio, y porque permite generar diagramas **verificados contra el esquema/código real** (el ER, por ejemplo, usa exactamente las 9 tablas y columnas confirmadas hoy por `information_schema`), en vez de dejar "diagrama pendiente" en 3 secciones distintas. Se dejó anotado explícitamente en la sección 11.1 que si la entrega final necesita un formato que no renderiza Mermaid (Word, PDF), estos bloques deben exportarse a imagen aparte — no se generó ningún archivo de imagen en esta sesión.

### Qué se reusó tal cual vs. qué se redactó nuevo
Se reusó sin cambios sustanciales: Introducción, Planteamiento del Problema completo (contexto institucional, análisis competitivo, modelo de viabilidad), Objetivos, tablas de RF/RNF, DoR/DoD, plan de pruebas, riesgos de calidad, los 11 pasos del pipeline de n8n y la narrativa completa de los 3 bugs — todo esto ya estaba bien redactado en el informe base y verificado. Se redactó nuevo: la Matriz de Trazabilidad (2.3), la reagrupación de HU por actor (3.2-3.7) con el resumen de priorización, el desglose de casos de uso por actor (5.3), la expansión de la sección de IA con prompts reales citados textualmente de esta misma conversación (6.3), el Design System y Flujo de Navegación (7.1, 7.3), la reorganización de Arquitectura General en 5 bloques con diagrama (8), la reorganización de Arquitectura BD por tabla con diagrama ER (9), la reorganización de Automatizaciones con Manejo de Errores como subsección propia (10), la lista de evidencia pendiente por captura (11), y la sección completa de Consumo de Tokens (12) con datos reales extraídos de `uso_tokens_ia` (28 llamadas, 6.613 tokens, 231.1 tokens/contenedor en la corrida exitosa).

### Honestidad sobre lo que no se pudo verificar ni inventar
Se marcó explícitamente como pendiente, sin estimar: los prompts literales de las fases 1-5 (anteriores a esta sesión, no accesibles desde aquí), el consumo de tokens de Claude Code como herramienta (no hay forma de leerlo desde dentro de la sesión), la tipografía/espaciado del Design System (no definidos todavía), y la medición formal de RNF-02 (tiempo de respuesta <1s). El análisis de eficiencia de tokens (12.4) declara explícitamente que no hay una comparación A/B real "con vs. sin optimización" — solo el razonamiento de diseño de cada estrategia — para no presentar una estimación como si fuera una medición.

### Verificación hecha esta sesión
`wc -l` → 1010 líneas. Verificado que los 4 bloques ```mermaid``` están presentes y en las secciones correctas. No se ejecutó un renderizador de Mermaid real (no disponible en esta sesión) — la sintaxis se escribió con cuidado pero no está renderizada y verificada visualmente.

### Siguiente paso
Johanna revisa `docs/INFORME-FINAL.md` completo y da su primera ronda de feedback. Pendiente aparte: decidir si los diagramas Mermaid se quedan así para la entrega en GitHub, o si hace falta exportarlos a imagen para el documento final (según el formato que pida la profesora).

---

## Bloque 15 — Informe en pausa, prioridad al software: Plan de Cierre (2026-09-11)

Johanna puso el informe en pausa ("buen borrador, lo retomamos más adelante") y dio el Plan de Cierre con 5 pendientes en orden de prioridad. Se aclaró primero que 2 de los 5 puntos ya estaban resueltos desde bloques anteriores de hoy (edición de estado del Bloque 8, y la mayor parte de autenticación/RLS por rol del Bloque 10) — el plan de Johanna parecía basarse en un estado anterior al de esta sesión. Orden de trabajo acordado: **1. Mapa agrupado por punto → 3b. Resolver alertas (Cuadrilla) → 4. Panel de Reportes → 5. Especificaciones del sensor.**

### 1. Mapa agrupado por punto (HU-02) — resuelto
Se reescribió `src/components/mapa-contenedores.tsx`: antes pintaba un marcador por fila de `contenedores` (`contenedores.forEach`); ahora agrupa por coordenadas exactas (`agruparPorPunto`, clave `lat.toFixed(6),lng.toFixed(6)`) y pinta **un marcador por punto físico**, coloreado por el **nivel más crítico** (`Math.max`) entre los contenedores de ese punto (`null` si ninguno tiene lecturas todavía). El popup ahora lista todos los contenedores del punto (tipo de residuo + nivel, ordenados de mayor a menor nivel), cada uno con su propio link a `/contenedor/[id]` — antes el popup era de un solo contenedor. La etiqueta del punto se deriva del código quitándole el último segmento (`PL-001-Y` → `PL-001`), consistente con la convención de nomenclatura ya usada.

Con los 20 contenedores reales de hoy, esto reduce el mapa de 20 marcadores sueltos a **8 puntos** (4 puntos reales de 4 contenedores cada uno + 4 contenedores de prueba, cada uno su propio punto de 1). Verificado con `tsc`/`eslint` (sin errores) y `curl` (dashboard sigue respondiendo 200).

### 3b. Política `UPDATE` en `alertas` + pantalla "marcar resuelta" — resuelto
Johanna aprobó el alcance acotado (cuadrilla solo puede resolver alertas de su propia cuadrilla, administrador puede cualquiera). Migración `alertas_update_cuadrilla_propia`: policy `UPDATE` en `alertas` con `using`/`with check` que permite `rol_actual() = 'administrador'` o (`rol_actual() = 'cuadrilla'` y `cuadrilla_id` de la alerta coincide con el `cuadrilla_id` del `perfil` del usuario). Se creó `src/app/alertas/boton-resolver.tsx` (Client Component) y se modificó `src/app/alertas/page.tsx` para llamar `obtenerPerfil()` server-side y renderizar el botón "Marcar resuelta" solo cuando `perfil` cumple la condición (administrador, o cuadrilla dueña de esa alerta específica) y la alerta no está ya resuelta. Verificado: las 9 alertas reales existentes están todas vinculadas a "Cuadrilla Norte" (única cuadrilla registrada), estado `pendiente`.

### 4. Panel de Reportes (HU-06/HU-07) — construido
`src/app/reportes/page.tsx`, protegido con `exigirRol('administrador', 'directiva')` (redirige a `/login` si no corresponde — verificado con `curl`, 307 a `/login` sin sesión). Contenido: resumen de alertas por estado (pendiente/enviada/resuelta) con tasa de resolución, y resumen de consumo de `uso_tokens_ia` (llamadas, tokens totales, promedio por llamada, desglose por modelo) — mismos datos reales ya usados en la sección 12 de `docs/INFORME-FINAL.md`. Link "Reportes →" agregado al dashboard, visible solo para Administrador/Directiva.

### 5. Especificaciones técnicas del sensor — construido
`src/app/sensor/page.tsx`, pantalla pública (sin protección, es contenido informativo). Reusa la tabla de costos del módulo SIMDES-Node y la nota de clasificación por color COVENIN 3838, ya redactadas en el informe. Link "Especificaciones del sensor" agregado al dashboard, visible para todos.

### Verificación hecha esta sesión
`npx tsc --noEmit` sin errores. `npx eslint src` (barrido completo) → exactamente los mismos 3 errores preexistentes ya documentados desde el Bloque 1 (ninguno nuevo introducido por el trabajo de hoy). `curl` contra `next dev`: `/alertas` 200, `/sensor` 200, `/reportes` 307→`/login` sin sesión, dashboard muestra los links nuevos correctamente gateados por rol.

### Siguiente paso
Los 5 puntos del Plan de Cierre de Johanna quedan resueltos a nivel de código. Pendiente de ella: crear el primer usuario administrador (y opcionalmente uno de cada rol) para probar todo el flujo end-to-end con sesión real — sin eso, nada de lo protegido por rol se puede verificar con una cuenta de verdad todavía. También sigue pendiente la verificación visual en navegador (arrastrada desde el Bloque 1, nunca resuelta esta sesión).

**Corrección de Johanna:** no debía yo crear el usuario administrador — es una decisión de seguridad ya tomada (Bloque 3.8 del informe, ver también Bloque 10 de esta bitácora): el primer admin lo crea ella directamente en Supabase Studio (Authentication → Users → Add user, "Auto Confirm User"), nunca una herramienta de IA, porque implica manejar una contraseña. Aclarado que no se había intentado crear ningún usuario — solo se señaló que faltaba. Johanna va a pasar el UUID del usuario ya creado para vincularlo a `perfiles` con `rol = 'administrador'`.

---

## Bloque 16 — README actualizado al estado real (2026-09-11)

Con la verificación visual bloqueada (extensión de Chrome rechazada dos veces, no se vuelve a sugerir esta sesión) y sin sesión de administrador todavía, se actualizó `README.md` a la raíz del repo — quedaba desde antes de esta sesión completa (roles inventados "supervisor, coordinador" que nunca existieron, checklist de estado desactualizado, y afirmaba que el informe "se documenta fuera de este repositorio", ya falso desde el Bloque 14).

Cambios: lista de funcionalidades actualizada (mapa agrupado por punto, reportes, roles reales, simulador); estructura del proyecto con árbol real de `src/app`, `scripts/`, `docs/`; checklist de estado con 7 de 11 puntos ya marcados (autenticación, roles, simulador, n8n end-to-end, pantallas principales) y 4 honestamente pendientes (primer admin real, verificación visual, despliegue en Vercel — no se encontró carpeta `.vercel` ni config, no se pudo confirmar si ya está desplegado, así que se dejó sin marcar en vez de asumir — capturas/video); enlace final corregido para apuntar a `docs/INFORME-FINAL.md` en vez de decir que el informe vive fuera del repo.

### Siguiente paso
Esperar el UUID del primer usuario administrador de Johanna para vincularlo en `perfiles`. Sin más tareas de código independientes pendientes de la lista de hoy — a la espera de la siguiente instrucción.

**Actualización:** el UUID llegó (`9ae7ef32-f279-45f6-9315-9511c195b10c`, correo `guayanaspaces@gmail.com`, creado por Johanna en Supabase Studio con Auto Confirm) — ver Bloque 17.

---

## Bloque 17 — Primer administrador vinculado y RLS por rol verificado a nivel de base de datos (2026-09-11)

### Vinculación del perfil
Confirmado que el UUID existe en `auth.users` (correo verificado, `email_confirmed_at` con fecha). Se insertó la fila en `public.perfiles`: `id = 9ae7ef32-f279-45f6-9315-9511c195b10c`, `rol = 'administrador'`, `cuadrilla_id = null` (no aplica para administrador), `nombre = 'Johanna Guédez (Administrador)'`.

### Verificación de RLS por rol — hecha a nivel de SQL, no de navegador
No fue posible probar el login real vía la interfaz (sin contraseña, correctamente — Johanna no la comparte; sin extensión de Chrome, rechazada dos veces). En su lugar, se verificó el comportamiento real de las políticas RLS **suplantando el JWT dentro de una transacción con rollback** (`set local role authenticated; set local "request.jwt.claims" = '{"sub": "<uuid>", ...}'`), la misma mecánica que usa internamente PostgREST/Supabase para aplicar RLS — no es un atajo que bypasee las políticas, es la forma correcta de probarlas sin depender de la capa HTTP.

**Pruebas positivas (como el administrador real):**
- `rol_actual()` resuelve correctamente a `'administrador'`.
- `INSERT` en `contenedores` — exitoso.
- `UPDATE` en `contenedores.estado` — exitoso.
- `UPDATE` en `alertas.estado` — exitoso (administrador puede resolver cualquier alerta, no solo las de su cuadrilla).
- Lectura de `perfiles` — visible su propia fila.

**Prueba de control negativo (para descartar que las pruebas de arriba pasaran por un bypass silencioso, no por RLS real):** el mismo `INSERT` en `contenedores`, con un UUID aleatorio sin fila en `perfiles`, fue **rechazado** con `ERROR 42501: new row violates row-level security policy` — confirma que las políticas se están evaluando de verdad, no que la conexión tiene privilegios elevados que las ignoran.

Todas las pruebas se hicieron dentro de `begin; ... rollback;` — no quedó ningún dato de prueba (`TEST-RLS-ADMIN`, etc.) en la base de datos.

### Lo que sigue sin poder verificarse desde esta sesión
La capa de UI/sesión real (formulario de login → cookie → dashboard reflejando la sesión → redirecciones) no se probó, porque requiere la contraseña real (que Johanna correctamente no comparte) o la extensión de Chrome (rechazada). **Pendiente de Johanna:** iniciar sesión de verdad en `/login` con esta cuenta y confirmar que ve su correo/rol en el dashboard, que "+ Registrar contenedor" y "Reportes →" aparecen, y que puede editar el estado de un contenedor y resolver una alerta (como administrador, cualquiera).

### Siguiente paso
Johanna prueba el login real en el navegador y reporta qué ve. Mientras tanto, sin tareas de código pendientes de la lista de hoy.

---

## Bloque 18 — Assets de marca definitivos aplicados (2026-09-11)

Johanna avisó que había colocado los assets de marca; la primera vez no aparecieron en el repo (búsqueda exhaustiva por extensión, cero resultados) — se le pidió confirmar, y en el segundo intento sí llegaron, pero en `./images/` (raíz del repo) en vez de `public/images/`, y con nombres distintos a los que ella misma había descrito (`favicon_1.ico` en vez de `favicon.ico`, `apple-icon-180.png` en vez de `apple-icon.png`, `logo-full.png` en vez de `logo.png`, más un `icon-512.png` extra no mencionado). Se reorganizaron a las rutas que Next.js espera por convención de archivo (`app-icons.md` de la documentación de Next 16, sin cambios de convención respecto a versiones anteriores):

- `src/app/favicon.ico` ← `favicon_1.ico`
- `src/app/icon.png` ← `icon-512.png` (se usó la versión de mayor resolución como fuente)
- `src/app/apple-icon.png` ← `apple-icon-180.png`
- `public/icons/icon-192.png` y `public/icons/icon-512.png` — para un futuro manifest PWA (no existe todavía ningún `manifest.json`/`.webmanifest` en el proyecto, no se creó uno hoy, fuera de alcance de este pedido)
- `public/images/logo.png` ← `logo-full.png`
- `public/images/hero-background.jpg` y `public/images/device-showcase.png` — guardados para el hero de la landing, sin usar todavía (explícitamente pospuesto por Johanna)

La carpeta de staging `./images/` se eliminó después de confirmar las copias.

**Verificación del favicon/iconos:** no hizo falta reiniciar el servidor — Turbopack detectó los archivos nuevos en caliente (confirmado con `curl`: los tres `<link>` de `<head>` — `favicon.ico` 32×32, `icon.png` 512×512, `apple-icon.png` 180×180 — aparecen con hash de contenido nuevo, no el de antes).

**Logo en el navbar:** se vio el archivo con la herramienta de lectura de imágenes antes de usarlo (1254×1254 px). Es un lockup **apilado** (ícono de Wi-Fi + reciclaje arriba, wordmark "SIMDES" debajo), no horizontal — importante para el pulido de mañana: **al tamaño pedido (~32-40px de alto), el wordmark del isotipo queda ilegible** porque son dos elementos apilados dentro de un cuadrado, no un lockup pensado para una barra angosta. Se aplicó igual, tal como se pidió (`h-9`, 36px), en el header del dashboard (`src/app/page.tsx`, junto al título, reemplazando el "SIMDES —" del `<h1>` ya que el logo lo cubre) y en el login (`src/app/login/page.tsx`, reemplazando el placeholder de texto+cuadrado de color que se había usado en el Bloque 11). **Sugerencia para el pase de pulido:** si se quiere legibilidad real en la barra, pedir a Johanna un recorte solo del ícono (sin el wordmark) para usos pequeños, y reservar el lockup completo para contextos grandes (login más grande, hero de la landing).

De paso, se actualizó `src/app/layout.tsx`: el `<title>`/`<meta description>` seguían en el placeholder genérico de `create-next-app` ("Create Next App") — se corrigió al nombre y descripción reales del proyecto.

### Verificación hecha esta sesión
`npx tsc --noEmit` y `npx eslint` sobre los 3 archivos tocados → sin errores. `curl` confirma: los `<link>` de ícono en `<head>` apuntan a los archivos nuevos, el `<img>` del logo aparece en el HTML de `/` y `/login`, y el `<title>` ya no dice "Create Next App".

### Siguiente paso
Sigue pendiente que Johanna pruebe el login real (Bloque 17) y confirme visualmente cómo se ve el logo en la barra (dado el problema de legibilidad ya señalado). El hero de la landing con `hero-background.jpg` queda explícitamente pospuesto, tal como pidió.

**Actualización:** Johanna confirmó que `public/icons/icon-192.png` es el ícono solo, sin wordmark (la misma pieza usada antes de agregarle el texto para el favicon/apple-icon) — se cambió el navbar del dashboard (`src/app/page.tsx`) de `logo.png` a `icons/icon-192.png`, verificado visualmente con la herramienta de lectura de imágenes antes del cambio. El login se dejó con `logo.png` (lockup completo), como pidió — ahí sí hay espacio para que el wordmark se lea.

**Segunda actualización — tamaños:** se veían muy chicos (36px en ambos lados). Subidos a `h-11` (44px) en el navbar del dashboard y `h-16` (64px) en el login, dentro de los rangos pedidos. Sin riesgo de pixelado: `icon-192.png` (fuente 192×192) y `logo.png` (fuente 1254×1254) se están reduciendo, no ampliando, a esos tamaños de despliegue.

---

## Bloque 19 — Login probado con la cuenta admin + bug de "Jest worker" investigado y descartado como código (2026-09-11)

Johanna confirmó que el login ya funciona de verdad con la cuenta administrador vinculada en el Bloque 17 — sin problemas, cierra el pendiente de verificación de esa parte.

### Bug reportado: "Jest worker encountered 2 child process exceptions" al abrir `/contenedor/[id]`
Se revisó primero el log del servidor en curso (el que quedó corriendo desde bloques anteriores, con historial acumulado desde hace horas): confirmaba el error exacto para la ruta `/contenedor/816bfab5-196c-4e26-a643-13489ebb8571`, rodeado de una cantidad grande de errores `write EPIPE` repetidos — síntoma de un pipe de stdout roto, consistente con la advertencia de "sistema bajo de memoria" que ya se había recibido antes en esta sesión (bloque del reinicio fallido del servidor).

**Diagnóstico:** se listaron los procesos `node.exe` con su relación padre-hijo (`Get-CimInstance Win32_Process`): el servidor de desarrollo (un solo proceso legítimo) tenía 2 procesos hijo de compilación (workers de Turbopack) — coincide exactamente con el "2 child process exceptions" del mensaje de error. Se mató el árbol de procesos completo (`taskkill /F /PID <pid_servidor> /T`), se borró `.next`, y se reinició limpio.

**Resultado tras el reinicio limpio:** la misma ruta compiló correctamente en el primer intento (10.6s, tiempo normal de primera compilación) y respondió `200` en 5 intentos consecutivos posteriores (56-82ms cada uno, ya con la página compilada en caché). **No se volvió a reproducir.** No se encontró nada en el código de `/contenedor/[id]` (edición de estado, verificación de rol) que explique un crash del compilador — son componentes React simples, sin nada que estresara inusualmente a Turbopack. Conclusión: fue una condición transitoria de recursos del sistema (memoria), no un bug de código introducido por el CRUD de edición de estado. No se descarta que vuelva a pasar si el sistema vuelve a quedar bajo de memoria — en ese caso, el mismo procedimiento (matar el árbol de procesos + borrar `.next` + reiniciar) es el remedio, no un cambio de código.

### Siguiente paso
Sin pendientes de código nuevos. Login validado end-to-end con cuenta real. A la espera de la siguiente instrucción de Johanna.

---

## Bloque 20 — Marca del navbar: vuelta a `logo.png` (recortes descartados) (2026-09-11)

Johanna probó los recortes de ícono que había preparado (`icon-tight-192.png` y variantes) y los descartó — se veían cortados/mal recortados. Decisión: usar `public/images/logo.png` (el lockup completo, mismo archivo del login) también en el navbar del dashboard, en vez de seguir con `public/icons/icon-192.png`. Se pidió explícitamente **no tocar** `favicon.ico`/`icon.png`/`apple-icon.png` (ya confirmados funcionando) — no se tocaron.

Cambio en `src/app/page.tsx`: `<img>` del navbar pasa de `icons/icon-192.png` a `images/logo.png`, tamaño `h-14` (56px) con `w-auto shrink-0` (evita que el flex del header lo deforme o recorte si el espacio se aprieta). Criterio de tamaño: suficientemente grande para que el wordmark apilado tenga presencia, sin superar la altura del bloque de título+subtítulo de al lado ("Panel de Contenedores" + "Estado actual..."). `icons/icon-192.png` queda en el repo sin usar por ahora (seguía siendo válido para un futuro manifest PWA, no se borró).

### Verificación
`npx eslint` sin errores. `curl` confirma el `<img>` con la ruta y clases correctas en el HTML servido.

### Siguiente paso
Que Johanna confirme visualmente el tamaño en el navbar. Sigue pendiente su respuesta sobre qué ve realmente en los marcadores del mapa (pregunta del bloque anterior, sobre si el ícono SVG propio se está renderizando o si cae al de Leaflet por defecto).
