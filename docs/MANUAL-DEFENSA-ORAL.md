# Manual de Defensa Oral — SIMDES

**Para Johanna, de cara a la sustentación con la profesora.** Esto no es el informe técnico — es la versión que puedes leer, entender de un tirón, y explicar con tus propias palabras. Si te preguntan algo técnico muy específico, el informe (`INFORME-FINAL.md`) tiene el detalle; esto es para defender el *por qué* de las decisiones, no el *cómo* del código.

---

## 1. El problema y la solución, en una frase

**Problema (enunciado de la cátedra, N.° 9):** nadie sabe cuándo un contenedor de basura va a llenarse hasta que ya rebosó — la recolección es reactiva, no preventiva.

**Solución SIMDES:** cada contenedor reporta su nivel de llenado, una IA predice cuántas horas faltan para que se sature, y en cuanto cruza un umbral crítico se avisa automáticamente por Telegram a la cuadrilla responsable — sin que nadie tenga que estar revisando reportes.

Si te piden resumirlo en una sola frase: **"SIMDES reemplaza la suposición por el dato: sabe cuándo un contenedor se va a llenar antes de que pase, y avisa solo cuando hace falta."**

---

## 2. Qué SIMDES hace y qué NO hace (pregunta que casi seguro te van a hacer)

Esto es importante porque puede sonar como que el sistema "organiza la recolección de basura" completa, y no es así.

- **SIMDES SÍ hace:** monitorea, predice, avisa. Visibilidad en tiempo real + predicción + notificación automática.
- **SIMDES NO hace:** no decide qué camión va a dónde, no calcula rutas óptimas, no reemplaza a la cuadrilla. Eso sigue siendo una decisión humana — la cuadrilla recibe la alerta por Telegram y decide cómo actuar.

**Por qué esto es una decisión de diseño consciente, no una limitación que se te olvidó cubrir:** el valor de SIMDES está en la *información* (saber a tiempo), no en la *ejecución* (mover camiones). Construir un motor de ruteo real sería un proyecto aparte, mucho más grande, y no es lo que pide el enunciado — el enunciado pide prever la saturación, no optimizar rutas. Si la profesora pregunta "¿y por qué no ruteo automático?", la respuesta es: **eso es una capa operativa distinta, ejecutada por humanos, y agregarla habría sido resolver un problema que no nos pidieron, en vez de resolver bien el que sí.**

Esto también explica por qué el modelo de datos de "cuadrillas" es simple (una cuadrilla = un equipo con su canal de Telegram y su zona) y no una jerarquía compleja de empresas-rutas-vehículos: SIMDES solo necesita saber *a quién avisar*, no *cómo* esa persona hace su trabajo después.

---

## 3. El flujo principal, paso a paso (para explicar la demo)

1. **El sensor mide** el nivel de llenado de un contenedor (hoy, simulado — el hardware real es una propuesta de escalamiento, sección "Modelo de Viabilidad" del informe).
2. **Un webhook HTTP** envía esa lectura a n8n (la herramienta de automatización).
3. **n8n guarda la lectura** en la base de datos (Supabase/PostgreSQL).
4. **n8n revisa si el nivel se sostiene alto** (no una sola lectura puntual, para evitar falsas alarmas por un pico raro del sensor).
5. **Si se sostiene, le pregunta a la IA (Gemini)** qué tan urgente es y en cuántas horas se saturaría.
6. **Si la IA confirma que es crítico, n8n dispara la alerta**: la guarda en la base de datos y manda un mensaje de Telegram con la ubicación GPS a la cuadrilla asignada a esa zona.
7. **La cuadrilla ve la alerta en su teléfono**, va, recoge, y marca "resuelta" en la app cuando termina.

Esto ya se probó en vivo múltiples veces con datos reales — no es una maqueta, es el flujo real corriendo (ver sección 4.6 y 10.4 del informe para la evidencia técnica exacta).

---

## 4. El modelo de negocio, en corto

- **No se vende el sensor al ciudadano.** El canal real es contratación pública municipal — se lo vende (o presta como piloto) a la alcaldía/ente de aseo, igual que hacen Barcelona, Singapur o Nueva York con sus sistemas de contenedores inteligentes.
- **En Ciudad Guayana, el ente real es SupraGuayana** (el operador de aseo urbano ya existente) — SIMDES no reemplaza a SupraGuayana, le da información que hoy no tiene.
- **El valor no está en el sensor** (es barato, ~25-40 USD), **está en el dato**: saber cuándo recoger, en vez de recoger "porque toca" según un horario fijo.
- **Esto es una propuesta, no un contrato firmado** — si te preguntan "¿ya tienen el contrato con la alcaldía?", la respuesta honesta es: no, es la ruta de viabilidad que el proyecto debería recorrer para dejar de ser un piloto académico, documentada como tal en el informe.

---

## 5. Por qué existen estos 4 roles (y no otros) — la parte más importante para defender

Este es el punto que más te van a cuestionar, porque agregar el rol "Directiva" **no estaba en el plan original** — se agregó después de una autocrítica real. Contarlo así (como un proceso, no como algo que "ya sabíamos desde el principio") es más creíble y más fuerte que fingir que siempre estuvo claro.

### La historia real (cuéntala así)

1. Primera pasada: se pensó en 3 roles (Administrador, Cuadrilla, Sistema/Automatización), anclados directamente en las 7 historias de usuario del backlog.
2. Alguien preguntó: **"si SIMDES se le vende a una alcaldía, ¿no hace falta un rol para la gerencia del ente de aseo, además de quien opera el sistema técnicamente?"** — esa pregunta viene del modelo de negocio real (contratación pública), no de las historias de usuario.
3. Se revisó otra vez con un criterio de calidad de software real: **ISO/IEC 25010, característica de seguridad, control de acceso** — la pregunta correcta no era "¿estos roles necesitan permisos distintos entre sí?" sino **"¿una misma información en modo LECTURA necesita separarse de la misma información en modo ESCRITURA?"**. La respuesta fue sí: alguien que solo necesita *ver* reportes no debería tener el mismo permiso que alguien que *opera* el sistema.
4. De ahí nació el 4to rol: **Directiva**.

### Cada rol, explicado como si fuera una persona real

**Administrador** — es quien opera el sistema técnicamente día a día: registra contenedores nuevos, corrige errores de datos, resuelve cualquier alerta. Tiene el permiso más amplio porque es el único que *escribe* en el sistema de forma libre. En la vida real: el técnico de SupraGuayana o de SIMDES que mantiene la plataforma.

**Directiva** — es la gerencia del ente de aseo (o de la alcaldía). Necesita *ver* reportes y KPIs para tomar decisiones de presupuesto y despacho de camiones, pero **no necesita ni debería poder editar contenedores ni resolver alertas** — esa separación (leer sí, operar no) es exactamente lo que dice ISO 25010 sobre control de acceso: cada quien con el permiso mínimo que su función requiere, ni más ni menos. En la vida real: el gerente que decide "necesitamos comprar otro camión" con base en lo que ve en el reporte, no metiéndose a cambiar el estado de un contenedor.

**Cuadrilla** — es el equipo operativo que físicamente va y recoge la basura. Recibe la alerta por Telegram y solo puede resolver las alertas de *su propia* zona, no las de otras cuadrillas — esto evita que una cuadrilla marque como resuelto algo que no atendió. En la vida real: los trabajadores de recolección con su camión.

**Sistema/Automatización** — no es una persona, es n8n + la IA actuando de forma autónoma: lee sensores, calcula predicciones, dispara alertas. Se documenta como actor porque *hace cosas* dentro del sistema (inserta datos, decide cuándo alertar), aunque no inicia sesión como un usuario humano.

### Si te preguntan "¿por qué no un quinto rol para X?"

La respuesta general: **se evaluó explícitamente y se descartó con el mismo criterio de ISO 25010** ("functional appropriateness" — no agregar funciones/roles que el sistema no necesita). Ejemplo ya documentado: se descartó un rol "Supervisor" separado porque no había ninguna historia de usuario ni necesidad real de permisos que Cuadrilla y Administrador no cubrieran ya. Si la profesora insiste en un caso concreto, la respuesta honesta es: "no lo evaluamos para ese caso específico, pero el criterio que usamos fue X — se puede aplicar el mismo razonamiento".

---

## 6. Preguntas típicas y cómo responderlas

**"¿Por qué usaron n8n y no lo construyeron directo en el backend?"**
Porque el desacople importa: n8n reacciona a cada lectura de forma asíncrona, y si falla el nodo de IA o el de Telegram, no se pierde la lectura original (ya quedó guardada antes). Es una decisión de arquitectura consciente, no solo "porque era más fácil".

**"¿Qué pasa si el sensor manda un dato falso (un pico)?"**
Hay un filtro de persistencia: el sistema exige que el nivel se sostenga, no dispara con una sola lectura puntual — evita falsas alarmas. (Nota honesta si te preguntan el detalle exacto: ese filtro está confirmado que funciona, pero no se verificó al 100% si mide minutos de reloj reales o cuenta lecturas consecutivas — está declarado así en el informe, no se ocultó.)

**"¿Por qué el borrado de un contenedor no es un DELETE real?"**
Porque ya tiene historial real asociado (lecturas, predicciones, alertas) — borrarlo de verdad rompería esa evidencia o la destruiría. Se implementó como "borrado lógico" (se oculta, no se destruye), y es distinto de marcar un contenedor "fuera de servicio" (que es el retiro operativo real de algo que sigue existiendo físicamente).

**"¿Cómo garantizan que un usuario no vea los datos de otro rol?"**
Con RLS (Row Level Security) directo en la base de datos, no solo validación en la interfaz — aunque alguien intente saltarse la app y llamar la base de datos directamente, la base misma bloquea lo que no le corresponde a ese rol. Esto se verificó en vivo más de una vez durante el proyecto (ver sección 4.6 del informe).

**"¿Cuánto le costaría esto a un municipio real?"**
El sensor por unidad cuesta entre 25 y 40 USD a precio de componente (no es una cotización real de proveedor). El modelo de sostenibilidad propuesto es contrato de servicio (pago por optimización de rutas/combustible) más venta de datos agregados a mediano plazo — nada de esto tiene un acuerdo firmado todavía, es la hoja de ruta de viabilidad.

---

## 7. Glosario rápido (por si necesitas explicar un término técnico)

- **Isla ecológica:** la agrupación de varios contenedores (uno por tipo de residuo) en un mismo punto físico. El "punto limpio" es el sitio; la isla ecológica es lo que hay dentro.
- **RLS (Row Level Security):** reglas de seguridad puestas directamente en la base de datos, no solo en la pantalla — para que ni siquiera alguien con acceso técnico directo a la base pueda ver/tocar lo que su rol no permite.
- **RBAC (Role-Based Access Control):** control de acceso basado en el rol del usuario (lo que se explicó en la sección 5).
- **Borrado lógico:** marcar algo como "eliminado" sin borrarlo de verdad de la base de datos, para no perder su historial.
- **Webhook:** una URL que otro sistema puede llamar para avisar "pasó algo" — así es como el sensor (o el simulador) le avisa a n8n que hay una lectura nueva.

---

*Este manual se generó el 2026-09-12 a partir del razonamiento ya documentado en `docs/INFORME-FINAL.md` (secciones 3.8, 4.6, 5, y "Modelo de Viabilidad"). Si algo aquí no coincide con lo que dice el informe técnico, el informe es la fuente autoritativa — este documento es una guía de lenguaje, no una fuente nueva de decisiones.*
