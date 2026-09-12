![](assets-informe/logo1.png)

![](assets-informe/logo2.png)

República Bolivariana de Venezuela\
Universidad Nacional Experimental de Guayana\
Vicerrectorado Académico\
Asignatura: Ingeniería de Software I\
Proyecto de Carrera: Ingeniería en Informática

# INFORME DE AVANCE DEL PROYECTO

SIMDES — Sistema Inteligente de Monitoreo y Predicción de Desechos Sólidos

**Profesora:**\
Ing. Dubraska Roca

**Estudiante:**\
Guédez, Johanna / C.I.: V\-14.089.807

Ciudad Guayana, Venezuela\
09 de septiembre de 2026 — Semana 3 del intensivo (avance parcial)

> **Nota de esta versión (11/09/2026):** este documento es la base de contenido para que Claude Code (CLI local, con acceso directo al código y a la bitácora del repositorio) redacte la **versión final del informe desde cero** — no una edición del `informe_v4.docx` original, que quedó fuera de su alcance por vivir fuera del repositorio. La sustancia (contexto, requisitos, historias de usuario, arquitectura, modelo de calidad) sigue siendo válida y no se reescribe aquí; lo que se actualiza es el **estado de ejecución** de cada sección, con los hallazgos técnicos reales del 11/09 (bugs de n8n corregidos, modelo de roles, autenticación, RLS real). Ver la sección "Estado General y Próximos Pasos" al final para el resumen ejecutivo del avance, y la nueva sección "n. Modelo de Roles y Autenticación" para el trabajo de hoy.

# Índice

Table of Contents

## Introducción

La gestión de desechos sólidos en Ciudad Guayana —como en la mayoría de las ciudades venezolanas— sigue operando bajo un modelo reactivo: las cuadrillas de aseo urbano recorren rutas y horarios fijos, sin ningún dato real sobre cuánto residuo hay acumulado en cada punto limpio o papelera pública en un momento dado. El resultado es previsible: contenedores que rebosan días antes de que pase la ruta programada, vertederos espontáneos en las aceras, focos sanitarios agravados por el clima tropical, y cuadrillas que terminan recorriendo puntos casi vacíos mientras otros, saturados, quedan sin atender. Ese es exactamente el Problema N.° 9 asignado por la cátedra: la incapacidad de prever cuándo un contenedor alcanzará su capacidad máxima.

**SIMDES** (Sistema Inteligente de Monitoreo y Predicción de Desechos Sólidos) ataca ese problema reemplazando la suposición por el dato. Cada contenedor reporta su nivel de llenado; un modelo de inteligencia artificial (Google Gemini) proyecta, a partir del histórico de lecturas, cuántas horas faltan para su saturación; y un flujo de automatización construido en n8n despacha la alerta directamente a la cuadrilla asignada por Telegram en cuanto se cruza el umbral crítico, sin que nadie tenga que revisar reportes al final del día. La plataforma se construye sobre Next.js, Supabase (PostgreSQL) y Vercel, con un mapa geoespacial en tiempo real como interfaz principal para el coordinador de servicios públicos.

El proyecto se delimita como un piloto urbano escalable: un circuito inicial de puntos limpios en un sector mixto —comercial y residencial— de Ciudad Guayana (Municipio Caroní), sobre una arquitectura modular que permite extender la cobertura al resto del municipio una vez validada su viabilidad técnica y operativa. **A la fecha de esta actualización (11/09), el sistema ya está funcionando de punta a punta**: mapa interactivo con contenedores reales, flujo de automatización n8n validado end-to-end (predicciones y alertas reales por Telegram), seguridad de base de datos resuelta, y autenticación con modelo de roles en construcción — lo que resta es completar CRUD, reportes, la sección de especificaciones del sensor y el pulido visual final, para llegar con el sistema funcionando, capturas reales y video a la entrega de la semana del 14 al 18 de septiembre de 2026.

## Planteamiento del Problema

A nivel internacional, la gestión de desechos sólidos urbanos opera bajo esquemas de recolección de rutas y frecuencias fijas, que asumen una generación de residuos homogénea y predecible cuando en realidad es dinámica. Esta desarticulación genera altos costos operativos y la incapacidad de prever cuándo un punto limpio o papelera pública alcanzará su capacidad máxima, ocasionando acumulación de basura en la vía pública — el Problema N.° 9 asignado por la cátedra.

En el contexto de Ciudad Guayana (Municipio Caroní), este colapso se agrava por cinco factores propios de la realidad operativa local. Primero, una asimetría territorial en la recolección: la escasez de combustible y una flota de camiones compactadores reducida llevan a las empresas de aseo a priorizar los corredores comerciales, desatendiendo durante semanas las calles internas de las urbanizaciones. Segundo, la generación de vertederos espontáneos en avenidas, cuando los residentes trasladan su basura hacia las esquinas y frentes comerciales ante la falta de recolección en sus viviendas. Tercero, una aceleración sanitaria propia del clima tropical, que pudre los desechos orgánicos en menos de 24 horas y genera lixiviados, vectores y malos olores. Cuarto, la vulnerabilidad del hardware instalado en la vía pública ante el hurto y el vandalismo. Y quinto, los falsos positivos mecánicos: un sensor óptico simple se deja engañar por bolsas infladas o cartón atascado en la boca del contenedor, reportando saturación cuando aún hay capacidad disponible.

### Contexto Institucional: la Crisis del Servicio de Aseo Urbano

Estos cinco factores no ocurren en el vacío: responden a una crisis institucional concreta del servicio de aseo urbano en el municipio. Hasta diciembre de 2025, la recolección estuvo a cargo de Fospuca, empresa privada concesionaria; su salida del municipio —reportada en prensa local y redes sociales como una combinación de quiebra financiera y disputas por las tarifas cobradas a locales comerciales por metro cuadrado— derivó en la rescisión unilateral del contrato ese mes, decisión atribuida a la Gobernación del Estado Bolívar, encabezada por la Gobernadora Yulisbeth García. La recolección fue reasignada a **SupraGuayana S.A.** (Sistema Urbano de Procesamiento y Recolección de Aseo de Guayana), un ente que ya había operado el servicio años atrás bajo la administración del entonces alcalde Tito Oviedo (Alcaldía de Caroní) y que ahora opera bajo tutela de la Gobernación en lugar de la alcaldía. Según un volante de asignación de rutas distribuido por el nuevo operador entre los vecinos, la frecuencia actual de recolección es de una vez por semana en zonas residenciales e interdiaria en zonas comerciales.

*Nota metodológica: estos datos institucionales provienen de fuentes secundarias —prensa local, redes sociales y un volante oficial de asignación de rutas— recopiladas por la autora del proyecto como contexto motivacional; no constituyen una verificación independiente y se presentan con ese alcance.*

Contrastada con el dato ya establecido de que la materia orgánica se descompone en menos de 24 horas bajo el clima tropical de la región, una frecuencia de recolección semanal en zonas residenciales garantiza, de por sí, varios días de acumulación y descomposición activa en cada punto limpio, independientemente de cualquier mejora tecnológica. SIMDES no puede resolver esa causa raíz —de naturaleza institucional y presupuestaria—, pero sí puede maximizar la eficiencia de la capacidad de recolección que sí existe: dirigiendo a las cuadrillas, dentro del esquema de frecuencias que la gobernación defina, hacia los puntos que real y objetivamente lo requieren primero, en lugar de operar a ciegas.

### Consecuencias Sanitarias y Ambientales

La acumulación prolongada de desechos en la vía pública no es solo un problema estético u operativo: tiene consecuencias sanitarias directas sobre la ciudadanía. Los residuos orgánicos en descomposición atraen roedores y aves carroñeras (zamuros), vectores asociados a enfermedades como leptospirosis y afecciones gastrointestinales; los lixiviados contaminan suelo y fuentes de agua cercanas; y la acumulación de agua estancada en envases y bolsas favorece la proliferación de mosquitos vectores de dengue. Este componente de salud pública es, junto con el operativo, parte de la motivación del proyecto: un sistema de alerta temprana no solo optimiza rutas, sino que reduce el tiempo de exposición de la comunidad a estos focos.

### Delimitación Geográfica del Piloto

El Municipio Caroní está dividido oficialmente en 11 parroquias, según la Alcaldía de Caroní: en el sector Puerto Ordaz (margen oeste del río Caroní) las parroquias Unare, Universidad y Cachamay; en el sector San Félix (margen este) las parroquias Dalla Costa, Simón Bolívar, 11 de Abril, Chirica y Vista al Sol; y tres parroquias rurales (Pozo Verde, Yocoima y 5 de Julio).

Frente a esta realidad, SIMDES se delimita como un **proyecto piloto urbano escalable**\: un circuito inicial de puntos limpios en la **Parroquia Universidad** (sectores Alta Vista Norte y Sur, Los Olivos, Villa Asia), la parroquia cuya propia caracterización oficial la describe como zona de uso mixto —"concentra importantes zonas residenciales y comerciales"—, lo que la hace representativa del patrón de vertedero espontáneo descrito en el Planteamiento del Problema sin sesgar el piloto hacia un extremo puramente residencial o puramente comercial. Sobre una arquitectura modular en la nube, el sistema puede extenderse progresivamente a las 10 parroquias restantes del municipio una vez validada su viabilidad técnica en este sector piloto. **A la fecha de esta actualización, el piloto ya cuenta con 4 puntos reales georreferenciados** (Los Olivos, Alta Vista Norte, Alta Vista Sur, Villa Asia), 16 contenedores agrupados por tipo de residuo, más los 4 contenedores de prueba originales.

*Nota: la división parroquial citada corresponde a la organización político\-territorial oficial de la Alcaldía de Caroní; los sectores y urbanizaciones mencionados dentro de cada parroquia siguen la nomenclatura de uso común (cartografía y registros municipales), no un levantamiento catastral propio.*

### Análisis Competitivo: SIMDES frente a Soluciones Existentes

Durante la revisión de soluciones similares se identificó Sortyx, un contenedor inteligente con pantalla táctil integrada y panel de analítica corporativa, orientado a espacios interiores supervisados —oficinas y centros comerciales— donde el contenedor forma parte del mobiliario y del recorrido de usuarios internos, y el vandalismo o el hurto no son un riesgo relevante. Ese enfoque es correcto para su contexto, pero es inverso al de SIMDES: el Problema N.° 9 ocurre en la vía pública, sin supervisión, con exposición directa a intemperie, hurto y vandalismo.

|  | Sortyx | SIMDES |
| --- | --- | --- |
| Ambiente | Interiores controlados (oficinas, centros comerciales) | Espacios públicos urbanos, sin supervisión |
| Hardware | Contenedor físico completo con pantalla táctil | Módulo sensor compacto sobre contenedor existente |
| Costo por unidad | ~500 a 2.000 USD (referencial, no verificado) | ~25 a 40 USD (ver Modelo de Viabilidad) |
| Clasificación | Por tipo de residuo, con cámara e IA visual | Por nivel de llenado, con sensor ultrasónico |
| Riesgo físico asumido | Ninguno (entorno controlado) | Hurto y vandalismo (diseño antivandálico embebido) |

Por eso el diseño de hardware de SIMDES —definido desde la planificación inicial del proyecto— privilegia un sensor discreto, económico y embebido dentro del contenedor existente, sin pantalla ni componentes expuestos, que reporta su lectura a un dashboard remoto en lugar de mostrarla localmente. Esta comparación no cambia el diseño ya adoptado; lo confirma como la decisión correcta para el entorno del problema asignado.

Lo único que SIMDES sí adopta de la referencia visual de Sortyx es la estética del dashboard —no el hardware ni el modelo de negocio—: tema oscuro, gráficas de anillo (*donut*) para el nivel de llenado agregado, gráfica de tendencia diaria y barra lateral de navegación. Esa dirección visual se retoma en la sección Prototipo UI/UX.

### Modelo de Viabilidad y Sostenibilidad (Propuesta)

SIMDES es, en su núcleo, una aplicación web progresiva (PWA): un panel de monitoreo y alertas al que el coordinador de servicios públicos y las cuadrillas acceden desde el navegador de un computador o teléfono, sin necesidad de instalar nada desde una tienda de aplicaciones. El proyecto no fabrica contenedores: la propuesta es instrumentar con sensores los puntos limpios y papeleras públicas ya existentes en el municipio, lo que reduce significativamente la barrera de entrada frente a un despliegue que requiriera mobiliario urbano nuevo.

Este enfoque no es una construcción puramente teórica: en despliegues documentados de gestión inteligente de residuos —Barcelona (sensores ultrasónicos para optimizar rutas de recolección), la Agencia Nacional del Ambiente de Singapur (red de contenedores inteligentes a escala nacional), Helsinki, y los contenedores solares Bigbelly instalados en Nueva York y Londres— el canal dominante es la contratación pública municipal, no la venta directa al ciudadano; el valor comercial no reside en el sensor en sí, sino en el servicio de datos y optimización de rutas que genera para el operador. SIMDES se alinea con ese mismo patrón de adopción. **Este modelo de adopción (contratación pública municipal) es, además, la base del análisis de stakeholders que fundamenta el modelo de roles de acceso implementado hoy** (ver sección "n. Modelo de Roles y Autenticación").

Para que un piloto público de este tipo sea viable en el contexto venezolano actual —donde este ecosistema aún no existe— se proponen, con carácter de propuesta y no de acuerdo ya suscrito, tres frentes de trabajo: primero, un aliado institucional operativo, natural pero no exclusivamente el ente de aseo urbano vigente (SupraGuayana) o la Gobernación, bajo un esquema de piloto público\-privado en el que el sector académico documenta y desarrolla, y el ente público autoriza la instalación en su mobiliario; segundo, el suministro de los sensores, que podría explorarse como manufactura local a pequeña escala —una oportunidad de generación de empleo técnico en la región— antes que como importación, dado el componente relativamente simple del sensor (ultrasónico o infrarrojo más un módulo de conectividad); y tercero, un modelo de sostenibilidad económica basado en contrato de servicio con el ente operador (pago por optimización de rutas y reducción de kilometraje/combustible) más, a mediano plazo, la venta de datos agregados de generación de residuos a fines de planificación urbana. Ninguno de estos tres frentes cuenta hoy con un acuerdo real; se documentan aquí como la hoja de ruta de viabilidad que el proyecto debería recorrer para dejar de ser un piloto académico y convertirse en un servicio sostenido.

**Estimación de costos del módulo sensor (SIMDES\-Node), a precio de componente:**

| Componente | Costo aproximado | Función |
| --- | --- | --- |
| Sensor ultrasónico HC\-SR04 | ~3 USD | Medición de distancia / nivel de llenado |
| Microcontrolador ESP32 + módulo SIM 4G | ~15 USD | Procesamiento local y transmisión de datos |
| Batería LiSOCl2 | incluido | Autonomía de 3 a 5 años sin recarga |
| Carcasa IP68 + resina antivandálica | incluido | Resistencia a intemperie, hurto y vandalismo |
| **Total estimado por unidad** | **25 a 40 USD** | Ensamblaje localizable en Ciudad Guayana |

Esta cifra es una estimación de componente a precio de catálogo, no una cotización real de proveedor; se documenta para dar magnitud a la propuesta, no como compromiso de costo. **Esta tabla ya tiene una sección visible dentro de la aplicación misma** (no solo en el informe), pendiente de construir (ver Estado General).

**Fases de implementación propuestas:**

| Fase | Alcance | Plazo | Costo |
| --- | --- | --- | --- |
| 1. Piloto digital (este proyecto) | Solo software, datos simulados o ingresados manualmente por SupraGuayana, en la Parroquia Universidad | Actual | Vercel + Supabase, plan gratuito: 0 USD/mes |
| 2. Piloto con hardware básico | 10 a 20 módulos sensor en la Parroquia Universidad | 6 a 12 meses | ~500 a 800 USD en hardware; financiamiento a explorar (Gobernación, empresa privada local) |
| 3. Escalamiento municipal | Red de sensores en las 11 parroquias del Municipio Caroní; posible alianza de fabricación local | 2 a 3 años | Modelo SaaS municipal (licencia recurrente a la Gobernación); exportable a otras ciudades venezolanas |

Como en el resto de este apartado, ninguna de las tres fases cuenta con financiamiento o acuerdo confirmado: es la ruta de escalamiento que el proyecto debería recorrer, no un plan ya en ejecución.

## Objetivos del Proyecto

### Objetivo General

Desarrollar una plataforma web progresiva para el monitoreo en tiempo real y la predicción del estado de llenado en puntos limpios de desechos sólidos, integrando modelos de inteligencia artificial y flujos de automatización para la optimización de rutas de recolección municipal bajo estándares de ingeniería de software.

### Objetivos Específicos

**1.** Formular la especificación formal de requerimientos funcionales, no funcionales y criterios de aceptación en sintaxis Gherkin BDD, considerando restricciones físicas de bajo costo y protección antivandálica.

**2.** Diseñar el modelo de datos relacional en PostgreSQL mediante Supabase y la interfaz de usuario en Next.js con Tailwind CSS para la representación geoespacial del estado de los contenedores.

**3.** Implementar un módulo de procesamiento predictivo basado en inteligencia artificial que estime el tiempo restante hasta la saturación del contenedor según el historial de llenado.

**4.** Construir flujos de trabajo automatizados en n8n que procesen eventos de umbral crítico y despachen notificaciones operativas hacia el personal de recolección vía Telegram.

**5.** Evaluar la calidad del producto software bajo las características de Inocuidad (Safety), Fiabilidad y Seguridad establecidas en el estándar ISO/IEC 25010:2023.

## a. Proceso de Elicitación

El levantamiento de requisitos de SIMDES combinó cinco fuentes:

**1. Revisión formal del enunciado del problema.** Análisis del Problema N.° 9 tal como fue asignado por la cátedra, identificando el vacío central: ausencia de visibilidad en tiempo real sobre el nivel de llenado de los puntos limpios.

**2. Investigación contextual local.** Se documentaron cinco factores determinantes del contexto operativo real de Ciudad Guayana (Municipio Caroní) —asimetría territorial, vertederos espontáneos, aceleración sanitaria, vulnerabilidad del hardware y falsos positivos mecánicos— junto con el contexto institucional de la crisis del servicio de aseo (transición Fospuca → SupraGuayana) y sus consecuencias sanitarias y ambientales, desarrollados en el Planteamiento del Problema de este informe.

**3. Análisis competitivo.** Revisión de Sortyx, contenedor inteligente con pantalla orientado a espacios interiores supervisados, para confirmar que el diseño de hardware de SIMDES —sensor discreto sin pantalla, propio de un entorno público no supervisado— responde correctamente al Problema N.° 9.

**4. Elicitación asistida por IA.** Se empleó un prompt formal (documentado íntegramente en el literal f de este informe, Fase 1 de la bitácora) para estructurar los requisitos considerando de forma explícita las restricciones físicas y normativas identificadas.

**5. Delimitación del alcance.** A partir de lo anterior, el proyecto se acotó a un **piloto urbano escalable**\: un circuito inicial de puntos limpios en la Parroquia Universidad (Municipio Caroní) —la única de las 11 parroquias caracterizada oficialmente como de uso mixto, residencial y comercial—, con arquitectura modular en la nube que permite extender el sistema progresivamente a las 10 parroquias restantes del municipio una vez validada su viabilidad técnica.

**Nota metodológica — cliente hipotético.** La elicitación toma a SupraGuayana S.A. como stakeholder primario y cliente hipotético del sistema: los requerimientos, historias de usuario y criterios de aceptación de este informe se formulan como si SIMDES fuera a entregarse a su Dirección de Servicios Públicos. En un escenario real, esta propuesta se presentaría formalmente a esa dirección o a la Gobernación del Estado Bolívar; el proyecto no cuenta hoy con un contrato o acuerdo real con ninguna de las dos. **El análisis de stakeholders de este cliente hipotético se amplió hoy (11/09) para fundamentar el modelo de roles de acceso** — ver sección "n" más abajo.

## b. Requerimientos Funcionales y No Funcionales

### Requerimientos Funcionales

| ID | Requerimiento | Historia de Usuario |
| --- | --- | --- |
| RF-01 | Registrar y georreferenciar contenedores con código, tipo de residuo y capacidad | HU-01 |
| RF-02 | Visualizar en un mapa el nivel de llenado de cada contenedor mediante semáforo de color (verde <50%, amarillo 50–84%, rojo ≥85%) | HU-02 |
| RF-03 | Validar cada lectura entrante y descartar picos momentáneos que no se sostengan 20 minutos (filtro anti-falsos positivos) | HU-03 |
| RF-04 | Calcular, mediante IA, la hora estimada de desbordamiento según la tasa histórica de llenado | HU-04 |
| RF-05 | Despachar automáticamente una notificación por Telegram a la cuadrilla asignada cuando un contenedor supera el umbral crítico | HU-05 |
| RF-06 | Exportar resúmenes periódicos de vaciados y tiempos de atención | HU-06 |
| RF-07 | Registrar el consumo de tokens de cada llamada a la IA, para control de costos operativos | HU-07 |

### Requerimientos No Funcionales

Formulados bajo el marco ISO/IEC 25010:2023 que rige la calidad del proyecto, desarrollado en la sección d. de este informe:

| ID | Característica ISO 25010 | Requisito medible |
| --- | --- | --- |
| RNF-01 | Inocuidad (Safety) | Prevención de riesgo biológico por desbordamiento orgánico no detectado |
| RNF-02 | Eficiencia de desempeño | Tiempo de respuesta del mapa web < 1 segundo |
| RNF-03 | Fiabilidad | Tolerancia a fallos de sensores mediante predicción basada en histórico, no en lectura única |
| RNF-04 | Seguridad | Credenciales y firmas criptográficas de los webhooks fuera del código fuente (archivo `.env`); acceso de escritura restringido por rol autenticado (RLS + Supabase Auth) |
| RNF-05 | Mantenibilidad | Código organizado por componentes, con historial de commits trazable en GitHub |
| RNF-06 | Capacidad de interacción | Un usuario nuevo identifica el estado de un contenedor sin explicación adicional, por color |
| RNF-07 | Control de acceso | Separación de funciones por rol (Administrador, Directiva, Cuadrilla) según el principio de mínimo privilegio — ver sección n |

## c. Historias de Usuario

El Product Backlog completo consta de 7 historias, estimadas en Story Points bajo escala Fibonacci (1, 2, 3, 5, 8) y organizadas en 3 Sprints. Cada historia se rige por las siguientes políticas de calidad ágil:

**Definition of Ready (DoR) — para iniciar una historia:**

**1.** Formato estructurado: Como [rol] / Quiero [funcionalidad] / Para [beneficio].

**2.** Criterios de aceptación en sintaxis formal Given-When-Then (Gherkin BDD).

**3.** Estimación acordada en Puntos de Historia (escala Fibonacci).

**4.** Modelo de tablas validado en PostgreSQL / Supabase.

**Definition of Done (DoD) — para cerrar una historia:**

**1.** Código fuente en ramas de Git siguiendo principios SOLID.

**2.** Interfaz web responsive en Next.js + Tailwind CSS sin errores en consola.

**3.** Pruebas unitarias ejecutadas satisfactoriamente (cobertura mínima del 80% — decisión de alcance pendiente de confirmar según el tiempo disponible; no es un criterio explícito del baremo oficial de 10 puntos).

**4.** Despliegue automático actualizado y operativo en Vercel.

**5.** Base de datos documentada y migrations aplicadas en Supabase.

**Product Backlog:**

| ID | Historia de Usuario | Módulo | SP | Sprint | Estado (11/09) |
| --- | --- | --- | --- | --- | --- |
| HU-01 | Como coordinador de servicios públicos, quiero registrar puntos limpios con coordenadas GPS, tipo de desecho y capacidad, para mantener el inventario georreferenciado | Catálogo | 3 | 1 | ✅ Creación con mapa clicable; edición de estado en curso |
| HU-02 | Como supervisor de aseo, quiero visualizar en un mapa interactivo el nivel de llenado por semáforo de colores, para identificar puntos críticos de forma inmediata | Dashboard | 5 | 1 | ⚠️ Construido y funcionando con ícono de contenedor y semáforo de color — **pero todavía un marcador por contenedor, no agrupado por punto** (con los 20 contenedores reales hoy se ven varios marcadores superpuestos por ubicación). Agrupar por punto (1 marcador por ubicación, color = nivel más crítico entre sus contenedores) sigue pendiente, verificado directo contra el código el 11/09 |
| HU-03 | Como sistema, quiero validar lecturas descartando picos momentáneos (persistencia de 20 min), para evitar falsos positivos | Ingesta | 3 | 1 | ✅ Corregido y validado con tiempo real de reloj (ver hallazgo en sección j) |
| HU-04 | Como planificador de rutas, quiero que la IA calcule la hora estimada de desbordamiento, para programar el vaciado preventivo | IA | 5 | 2 | ✅ Funcionando end-to-end (Gemini vía n8n) |
| HU-05 | Como conductor de recolección, quiero recibir notificación automática por Telegram al superar el 85%, para ajustar mi recorrido | Automatización | 3 | 2 | ✅ Alertas reales confirmadas por Telegram; falta acción de "marcar resuelta" en la app (rol Cuadrilla) |
| HU-06 | Como director de servicios públicos, quiero exportar resúmenes semanales de vaciados, para auditar el rendimiento del servicio | Reportes | 3 | 3 | ⚠️ Pantalla de reportes pendiente de construir |
| HU-07 | Como administrador, quiero registrar los tokens consumidos en cada inferencia, para garantizar eficiencia de costos | Gobierno IA | 2 | 3 | ⚠️ Datos ya se registran en `uso_tokens_ia`; pantalla de reportes pendiente |

**Especificación Gherkin de HU-05 (Despacho Automatizado por Telegram)**, la historia que conecta directamente con la automatización n8n desarrollada en la sección j. de este informe:

```
Característica: Disparo de Alerta Inteligente por n8n
  Como Sistema de Gestión de Residuos
  Quiero enviar un mensaje con la orden de vaciado automático
  Para evitar que los desechos se desborden en la vía pública.

Escenario: Disparo de alerta al cruzar el umbral del 85%
  Dado que un contenedor supera el 85% de su capacidad
  Cuando la base de datos PostgreSQL emite el evento hacia n8n
  Entonces n8n solicita a la IA el cálculo del tiempo restante
  Y envía un mensaje por Telegram a la cuadrilla con la ubicación
  GPS y la ruta de recolección recomendada.
```

Las especificaciones Gherkin de HU-01 y HU-02 siguen la misma estructura Dado/Cuando/Entonces sobre el registro georreferenciado y el cambio de color del semáforo, respectivamente.

## d. Gestión del Control de la Calidad del Software

El plan de Aseguramiento de la Calidad del Software (SQA) se formalizó el 09/09/2026, bajo el estándar **IEEE 730-2014** y el ciclo de mejora continua **PHVA (ISO 9001:2015)** — el mismo marco desarrollado en la Unidad IV del curso —, aplicando en la práctica el marco de normas ya definido para el proyecto (ISO/IEC 25010:2023, ISO/IEC 27001:2022, ISO 14001:2015, EN 840, COVENIN 3838).

**Objetivos de calidad del proyecto:**

**1.** Garantizar que el sistema clasifique correctamente el nivel de llenado y que el filtro de persistencia de 20 minutos elimine los falsos positivos por bolsas u objetos atravesados en la boca del contenedor.

**2.** Asegurar que toda alerta de umbral crítico (nivel ≥85%) se despache de forma confiable por Telegram hacia la cuadrilla asignada, sin pérdidas silenciosas por fallos del flujo de n8n.

**3.** Proteger las credenciales del sistema (Supabase, API de IA, bot de Telegram) conforme a ISO/IEC 27001:2022, manteniéndolas fuera del repositorio público de GitHub.

**4.** Mantener el código organizado y trazable a pesar de que una sola desarrolladora asume los tres roles Scrum (Product Owner, Scrum Master y Development Team).

### Componentes de Aseguramiento de la Calidad (IEEE 730-2014)

| Componente SQA | Aplicación en SIMDES |
| --- | --- |
| Revisiones técnicas formales (FTR) | Autorevisión de cada Historia de Usuario contra sus criterios de aceptación Gherkin antes de marcarla como Done, y del flujo n8n antes de cada demostración. **Evidencia real (11/09):** una FTR del flujo n8n encontró y corrigió 3 bugs reales que impedían que el pipeline completo funcionara desde su creación — ver detalle en la sección j |
| Estándares de código | Principios SOLID (exigidos en el DoD) y convenciones de Next.js/ESLint sobre el código del Development Team |
| Estrategia de pruebas | Pruebas unitarias con cobertura mínima del 80% (exigidas en el DoD, decisión de alcance pendiente) más verificación manual de los escenarios críticos del flujo n8n (ver Plan de Pruebas abajo) |
| Recolección de métricas | Story Points ejecutados por Sprint, tasa de falsos positivos filtrados y eventos con error registrados en base de datos |
| Gestión de la configuración | Control de versiones en GitHub con ramas por Historia de Usuario; credenciales en archivo `.env` fuera del repositorio |
| Auditoría de proceso | Revisión de cierre de cada Sprint (Sprint Review) contra la Definition of Done antes de iniciar el siguiente |

### Ciclo de Mejora Continua (PHVA — ISO 9001:2015)

**Planificar:** definición del Product Backlog priorizado (sección c. de este informe) y del objetivo de cada Sprint.

**Hacer:** ejecución de los tres Sprints del cronograma — Sprint 1 (Días 1-6): fundamentos, requisitos y prototipo; Sprint 2 (Días 7-10): arquitectura, backend e integración n8n; Sprint 3 (Días 11-16): calidad, DevOps y entrega final.

**Verificar:** revisión de cada Historia de Usuario contra su Definition of Done y sus criterios Gherkin al cierre de cada Sprint. **Ejemplo concreto documentado (11/09):** la verificación de HU-03 contra el criterio "descartar picos que no se sostengan 20 min" encontró que la implementación inicial solo contaba lecturas consecutivas sin medir tiempo real — no conformidad corregida antes de continuar (ver sección j).

**Actuar:** corrección de no conformidades antes de iniciar el Sprint siguiente, documentada en el historial de commits y en la bitácora del proyecto.

### Plan de Pruebas Mínimo

| Escenario | Entrada | Resultado esperado | Estado (11/09) |
| --- | --- | --- | --- |
| Lectura válida | Nivel de llenado 0-100%, contenedor existente | Se registra, se evalúa el filtro de persistencia y se actualiza el estado del contenedor | ✅ Verificado end-to-end con el simulador |
| Pico de falso positivo | Lectura puntual elevada que no se sostiene 20 minutos | El sistema descarta el pico y no genera alerta | ✅ Ahora sí verificable de verdad: tras corregir el filtro de persistencia (que antes solo contaba lecturas, no tiempo real), se probó con un caso real de 11.8 minutos sostenidos y correctamente NO disparó alerta |
| Contenedor inexistente | `contenedor_id` que no existe en la base de datos | El sistema rechaza el evento con error controlado y lo registra | Pendiente de prueba explícita |
| Umbral crítico sostenido | Nivel ≥85% sostenido durante la ventana de persistencia | n8n dispara la predicción de IA y despacha la orden por Telegram con ubicación GPS | ✅ Verificado — 20 predicciones y 5 alertas reales entregadas por Telegram en la corrida de prueba del 11/09 |

### Riesgos de Calidad y Mitigación

**1. Al ser un proyecto individual, no existe revisión de código por un tercero.** Mitigación: autorevisión estructurada (FTR) como paso separado de la construcción, nunca en el mismo momento en que se escribe el código. **Este riesgo se materializó y se mitigó con éxito el 11/09**: una revisión FTR del flujo n8n (motivada por la ausencia total de predicciones/alertas al probar con datos simulados) encontró que el pipeline llevaba muerto desde su creación por un bug silencioso — sin esa revisión activa, el problema habría llegado sin detectar hasta la entrega.

**2. El hardware antivandálico no puede validarse físicamente en el plazo del proyecto.** Mitigación: el piloto se valida por software con datos simulados que reproducen los escenarios de sensor descritos, dejando la validación física como trabajo futuro documentado.

**3. La API de IA podría responder en un formato inesperado y romper el flujo n8n.** Mitigación: el nodo de decisión valida el esquema JSON de la respuesta antes de usarla; si falla, se registra como error controlado sin detener el flujo.

**4. El plan gratuito de n8n Cloud es un trial de 14 días (09–23/09/2026), y una entrega retrasada podría dejarlo vencido.** Mitigación: el flujo de automatización se exporta periódicamente como archivo `.json` (control de configuración), de modo que puede reimportarse en minutos en una cuenta nueva sin perder el trabajo; alternativamente, n8n puede autoalojarse (self-hosted) de forma gratuita y sin límite de tiempo.

## e. Diagramas de Caso de Uso

El diagrama identifica actores primarios y uno secundario externo (Motor de IA / Gemini API), y casos de uso, uno por cada Historia de Usuario del backlog. La relación `«include»` entre *Validar lectura y filtrar falsos positivos* (HU-03) y *Despachar alerta por Telegram* (HU-05) refleja que el despacho de una alerta siempre requiere, primero, que la lectura haya superado el filtro de persistencia.

**Actualización de actores (11/09):** el modelo de actores/roles se revisó y amplió con el modelo de 4 roles de acceso confirmado hoy — ver sección "n. Modelo de Roles y Autenticación" para el detalle y su justificación técnica (RBAC, ISO/IEC 25010) y de negocio (análisis de stakeholders). El diagrama de casos de uso debe regenerarse incorporando: Administrador, Directiva/Gerencia, Cuadrilla y Sistema/Automatización (n8n+IA) como actor no humano explícito.

## f. Uso de Inteligencia Artificial

Bitácora de prompts, modelos y consumo de tokens por fase de desarrollo, registrada a la fecha:

| Fase | Modelo | Objetivo | Tokens |
| --- | --- | --- | --- |
| 1. Elicitación y viabilidad | Claude 3.7 Sonnet / Gemini | Levantar requisitos con contexto venezolano | 1.300 |
| 2. Planificación Scrum | Gemini / ChatGPT-4o | Roles, DoR/DoD y las 7 Historias de Usuario | 1.300 |
| 3. Especificación BDD | Claude 3.7 Sonnet | Escenarios Gherkin de HU-01, HU-02 y HU-05 | 930 |
| 4. Calidad y Casos de Uso (09/09) | Claude (Sonnet, Claude Code) | Plan SQA, diagrama de casos de uso, informe | *Pendiente cifra exacta* |
| 5. Profundización técnica (10/09) | Claude (Sonnet, Claude Code) | Análisis Sortyx, viabilidad, auditoría de BD, diagramas UML/E-R/secuencia, revisión cruzada | *Pendiente cifra exacta* |
| 6. Construcción funcional (11/09) | Claude (Sonnet, Claude Code CLI local + sesión cloud) | Mapa, RLS real, diagnóstico y corrección de 3 bugs de n8n, simulador, modelo de roles, autenticación | *Pendiente cifra exacta — recolectar de `uso_tokens_ia` y del uso de Claude Code* |

**Estrategias de optimización de tokens ya aplicadas:** respuestas de la IA forzadas a JSON estricto sin texto introductorio (~30% de ahorro en salida); poda de contexto en la ingesta (solo las últimas 3 lecturas en vez del historial completo, de ~1.200 a menos de 200 tokens por consulta); y caché de predicciones en PostgreSQL para evitar llamadas redundantes cuando la tasa de llenado no ha cambiado en la última hora.

**Nota de trazabilidad.** Los modelos y cifras de las fases 1–3 provienen del trabajo previo documentado por la autora. Las fases 4, 5 y 6 corresponden a sesiones de Claude Code y se registran solo con el nombre de familia del modelo (Sonnet), sin un número de versión específico no verificable desde dentro de la sesión misma — evitando atribuir a la IA una identidad de versión que ni ella misma puede confirmar con certeza.

**Nota para la versión final del informe (dirigida a quien lo redacte):** el criterio 10 del baremo oficial pide explícitamente "explicar el proceso de recolección de información del uso de Tokens de las herramientas IA utilizadas y presentar sugerencias para mejorar el consumo de tokens" — esta sección debería, en la versión final, expandirse con una tabla de consumo real por tarea (tomada de `uso_tokens_ia`), un análisis de eficiencia con vs. sin las estrategias de optimización ya aplicadas, y una conclusión explícita de sugerencias — no basta con la tabla de fases de arriba.

## g. Prototipo UI/UX

**Estado (11/09): en construcción activa, con piezas reales ya funcionando.** Pantallas confirmadas funcionando: mapa interactivo (HU-02), formulario de registro de contenedores con mapa clicable (HU-01), login con Supabase Auth (funcionando, con diseño ya aplicado — estructura tipo "portal de acceso": lockup de marca, título+subtítulo, banner de error, labels en mayúsculas, checkbox+enlace en línea, botón de alto contraste, bloque de contacto separado). Pendientes: panel de reportes (HU-06/07), sección de especificaciones técnicas del sensor, modo oscuro/interfaz "premium" definitiva en el resto de las pantallas. Esta sección se completa con capturas reales de la interfaz desplegada — no se incluyen bocetos como evidencia para no confundir diseño planificado con producto funcional.

Pantallas previstas, derivadas directamente del backlog:

**1. Dashboard principal** (HU-02): mapa interactivo con semáforo de color por contenedor y filtro por zona. ✅ Construido.

**2. Detalle de contenedor:** historial de lecturas, predicción vigente de la IA (HU-04) y estado del filtro de persistencia (HU-03).

**3. Panel de alertas:** historial de despachos por Telegram (HU-05) con su estado.

**4. Panel de reportes y gobierno de IA** (HU-06, HU-07): resúmenes de gestión y consumo de tokens. Visible para roles Administrador y Directiva (ver sección n).

**5. Pantalla de login** (nueva, no estaba en la planificación original): ✅ construida y funcionando — acceso único para los 3 roles con sesión (Administrador, Directiva, Cuadrilla); el dashboard/mapa se mantiene público sin login, por transparencia municipal.

**6. Sección de especificaciones técnicas del sensor** (nueva, pedida el 11/09): expone al usuario final del sistema —no solo al lector del informe— las especificaciones de hardware ya documentadas en el Modelo de Viabilidad.

### Identidad Visual

Paleta propuesta —tema oscuro, coherente con la dirección visual descrita en Análisis Competitivo—, ya aplicada en el login y el mapa:

| Rol | Color | Hex |
| --- | --- | --- |
| Fondo principal | Negro profundo | `#0D0D0D` |
| Fondo de tarjetas | Gris oscuro azulado | `#1A1A2E` |
| Acento primario | Verde esmeralda | `#00D4AA` |
| Acento secundario | Violeta | `#7C3AED` |
| Alerta - nivel medio | Ámbar | `#F59E0B` |
| Alerta - nivel crítico | Rojo coral | `#EF4444` |
| Texto principal | Blanco | `#F9FAFB` |
| Texto secundario | Gris claro | `#9CA3AF` |

**Concepto de isotipo** (pendiente de generar): un contenedor estilizado con una onda de señal IoT sobre él y una hoja que emerge de la boca del contenedor, en verde esmeralda y violeta sobre fondo oscuro.

## h. Arquitectura General de la Aplicación

La arquitectura de SIMDES se organiza en tres dimensiones:

| Dimensión | Contenido |
| --- | --- |
| **1. Física** | Contenedores HDPE (norma EN 840), clasificación por color COVENIN 3838 (código de un carácter en cada contenedor — Y/A/V/M — inicial del color oficial de cada tipo de residuo: Amarillo→Plástico, Azul→Papel/cartón, Verde→Vidrio, Marrón→Orgánico), módulo sensor SIMDES-Node (IP68, batería LiSOCl2, resina antivandálica) |
| **2. Lógica / IA** | PostgreSQL (Supabase), interfaz Next.js + Tailwind, filtro anti-falsos positivos (persistencia real de 20 min, verificada contra tiempo de reloj), motor de predicción horaria, autenticación y control de acceso por rol (Supabase Auth) |
| **3. Operativa** | Flujos n8n automatizados (validados end-to-end), despacho vía Telegram, panel web de supervisión, alertas tempranas (umbral ≥85%), reportes de gestión |

### Stack Tecnológico y Justificación Técnica

| Componente | Tecnología | Justificación |
| --- | --- | --- |
| Frontend | Next.js + Tailwind CSS | SSR nativo, arquitectura de componentes reutilizables y estilos rápidos; permite construir un dashboard interactivo moderno en pocos días sin configurar Webpack ni servidores manuales |
| Backend y Base de Datos | Supabase (PostgreSQL) | Elimina semanas de desarrollo backend tradicional: BD relacional robusta, API REST automática, autenticación integrada (Supabase Auth) y Row Level Security por rol |
| Automatización | n8n | Motor de flujos visuales que conecta la base de datos, el modelo de IA y el bot de Telegram en minutos, evitando codificar microservicios a mano |
| Inteligencia Artificial | API Gemini | Inferencia estructurada en JSON de bajo costo y alta velocidad, fácilmente integrable en n8n mediante prompts concisos |
| Despliegue | Vercel | Integración continua nativa con GitHub; compila y despliega en menos de 60 segundos por commit, disponible 24/7 sin costo de infraestructura |
| Control de Versiones | GitHub | Repositorio central, gestión de ramas y tablero de seguimiento ágil |

### Patrón de Arquitectura

SIMDES adopta una **arquitectura en capas** (Presentación en Next.js + Tailwind, Lógica de Negocio y Orquestación en Supabase + n8n, Persistencia en PostgreSQL). El disparador real del flujo de automatización es un **Webhook HTTP invocado explícitamente por el frontend/simulador** (POST directo al webhook de n8n en cada lectura), no el Database Webhook de Supabase originalmente propuesto — decisión de ingeniería consciente, documentada en la sección j, que simplificó la implementación sin perder el desacoplamiento: n8n sigue reaccionando a cada lectura de forma asíncrona respecto al resto del sistema, y un fallo puntual del nodo de IA o de Telegram no bloquea ni pierde el registro de la lectura original, ya persistida antes de que el flujo continúe.

Las ocho entidades originales del dominio se relacionan así: un `Contenedor` genera múltiples `LecturaSensor`, produce múltiples `Prediccion` y origina múltiples `Alerta`; cada `Prediccion` de riesgo alto escala como máximo a una `Alerta` (0..1); y cada `Cuadrilla` recibe múltiples `Alerta`. `Reporte`, `LogAutomatizacion` y `UsoTokensIA` son entidades transversales de trazabilidad y gobierno. **Nueva entidad (11/09):** `Perfil` (1:1 con el usuario de Supabase Auth), con un atributo `rol` que vincula a `Cuadrilla` cuando corresponde — ver sección n.

## i. Arquitectura de la Base de Datos

Esquema relacional en PostgreSQL (Supabase), diseñado a partir de los campos que exige cada Historia de Usuario del backlog (sección c. de este informe):

| Tabla | Columnas clave | Notas |
| --- | --- | --- |
| `contenedores` | id, codigo (ej. "PL-001-Y"), tipo_residuo, capacidad_litros, latitud, longitud, geog (generada), estado, created_at | tipo_residuo según código de colores COVENIN 3838; 20 contenedores reales agrupados en 4 puntos, más 4 de prueba |
| `lecturas_sensor` | id, contenedor_id (FK), nivel_pct, timestamp, fuente | fuente: simulado (reemplaza el sensor físico) |
| `predicciones` | id, contenedor_id (FK), horas_estimadas_saturacion, nivel_riesgo, modelo_ia, generado_en | Generada por el nodo IA de n8n (HU-04) |
| `alertas` | id, contenedor_id (FK), prediccion_id (FK), canal, estado, creado_en, resuelto_en | canal = "telegram" (HU-05); `estado` pasará a incluir "resuelto" cuando el rol Cuadrilla pueda cerrarla desde la app |
| `cuadrillas` | id, nombre, chat_id_telegram, zona_asignada | ej. "Parroquia Universidad - Alta Vista (piloto)"; se vincula 1:1 con un `perfil` de rol cuadrilla |
| `perfiles` | id (FK a auth.users), rol (administrador / directiva / cuadrilla), cuadrilla_id (FK, nullable) | **Nueva (11/09)** — modelo de roles y control de acceso, ver sección n |
| `reportes` | id, periodo, generado_en, url_pdf | Resúmenes exportados (HU-06) |
| `log_automatizacion` | id, workflow, contenedor_id (FK, nullable), resultado, detalle, timestamp | Evidencia de manejo de errores (criterio 7 del baremo) |
| `uso_tokens_ia` | id, workflow, modelo, prompt_tokens, completion_tokens, total_tokens, timestamp | Gobierno de tokens (HU-07, criterio 10 del baremo) |

**Relaciones:** `contenedores` 1→N `lecturas_sensor`, `predicciones` y `alertas`; `predicciones` 1→0..1 `alertas`; `cuadrillas` 1→N `alertas`; `auth.users` 1→1 `perfiles`; `perfiles` N→0..1 `cuadrillas` (solo cuando `rol = cuadrilla`).

### Decisiones de Modelado Propias del Dominio de SIMDES

**1. Índices sobre claves foráneas.** Las tablas `alertas`, `predicciones` y `log_automatizacion` operan por y para `contenedor_id`. Se agregaron cinco índices sobre las FK sin cobertura.

**2. Tipo de dato geoespacial (PostGIS).** Se habilitó la extensión `postgis` y se agregó una columna generada `geog geography(Point, 4326)` con índice GiST, verificado con una consulta de distancia real entre contenedores.

**3. Volumen de series de tiempo: dimensionado al piloto, no sobre-diseñado.** `lecturas_sensor` no justifica partición ni TimescaleDB en esta fase — documentado como punto de escalamiento futuro.

**4. Seguridad de acceso (RLS) — ✅ resuelta el 11/09, con un bug de producción real detectado y corregido en el proceso.** El estado real, verificado directamente en Supabase, resultó distinto del documentado en un primer borrador de esta misma actualización: Row Level Security **ya estaba habilitado** en las 8 tablas originales, pero **sin ninguna política en 5 de ellas** (`predicciones`, `cuadrillas`, `uso_tokens_ia`, `reportes` y `log_automatizacion`) — bloqueo total de lectura por defecto de PostgreSQL cuando RLS está activo sin políticas. Una primera verificación creyó erróneamente que esto ya se había corregido; una segunda verificación, probando el endpoint REST con la **misma anon key que usa la aplicación real** (no con herramientas de acceso elevado), confirmó que `predicciones` devolvía `HTTP 200` con arreglo vacío pese a tener 20 filas reales — **el panel "Predicción (IA)" de `/contenedor/[id]` llevaba roto en silencio para cualquier usuario real de la app**, mostrando "Sin predicción registrada todavía" con datos reales disponibles. Se agregaron las 4 políticas de `SELECT` público faltantes (mismo patrón ya usado en `contenedores`/`alertas`/`lecturas_sensor`) y se re-verificó con la anon key que las tablas ya devuelven datos reales. Además se implementó control de escritura real: en vez de la `service_role key` originalmente propuesta, se optó por **Supabase Auth + RLS por rol**, alineado con el modelo de roles de la sección n: solo un usuario autenticado con rol `administrador` puede escribir en `contenedores`. La escritura de "marcar alertas resueltas" por el rol `cuadrilla` **sigue pendiente** (ni la política de `UPDATE` en `alertas` ni la pantalla existen todavía) — no confundir con una función ya construida.

## j. Arquitectura de Automatizaciones (n8n)

Flujo único que cubre disparador, procesamiento, IA, salida y manejo de errores — los cinco criterios centrales del baremo:

**1. Simulador de sensores** (script Node.js, `scripts/`) inserta directamente en Supabase el catálogo de contenedores (dato de configuración, no telemetría), pero **envía las lecturas simuladas por POST HTTP al webhook real de n8n** — igual que haría un sensor físico — para que cada lectura pase por el flujo completo real (persistencia, IA, alerta), nunca insertada directo en `lecturas_sensor`.

**2. Webhook HTTP de n8n** (disparador — criterio 3 del baremo): recibe el POST del simulador o del botón "Simular lectura" de la app. **Nota de arquitectura:** el disparador real terminó siendo este webhook HTTP explícito, no el Database Webhook de Supabase originalmente propuesto — decisión de ingeniería consciente.

**3. Nodo "Guardar Lectura"** (Postgres, INSERT) — persiste la lectura en `lecturas_sensor`.

**4. Nodo "Historial Lecturas"** (Postgres, SELECT) — obtiene el histórico de las últimas 24 horas del contenedor para calcular tendencia.

**5. Nodo "Calcular Metricas"** (Code/JavaScript) — calcula la tasa de llenado, las horas estimadas hasta saturación, y aplica el filtro de persistencia de 20 minutos (RF-03/HU-03) — ver hallazgo de calidad abajo.

**6. Nodo "Clasificar Riesgo (Gemini)"** — solicita la clasificación de riesgo y el mensaje de alerta a la IA (integración de IA — criterio 5).

**7. Nodo IF ("¿Nivel sostenido ≥85%?")** — evalúa la condición de alerta.

**8. Rama verdadera:** Insert en `alertas` + envío por Telegram a la cuadrilla asignada con ubicación GPS (salida clara y útil — criterio 6).

**9. Rama falsa:** Insert en `predicciones` únicamente.

**10. Manejo de errores:** cualquier fallo se registra en `log_automatizacion`, sin detener el flujo (criterio 7).

**11. Nodo "Registrar Consumo Tokens"** — registra los tokens consumidos en cada llamada a Gemini (criterio 10).

### Hallazgo de calidad real: tres bugs encontrados y corregidos el 11/09

Esta es la evidencia más concreta de gestión de calidad (FTR — ver sección d) que produjo el proyecto hasta ahora, y debería narrarse en la versión final del informe con el mismo nivel de detalle técnico:

**Bug 1 — el pipeline completo estaba muerto desde su creación.** El nodo "Guardar Lectura" (INSERT) no tenía cláusula `RETURNING`, así que el nodo siguiente ("Historial Lecturas") no podía leer el `contenedor_id` de la lectura recién guardada — cada ejecución moría silenciosamente ahí, en absolutamente todas las ejecuciones históricas revisadas, no solo las de prueba de hoy. **Fix:** agregar `RETURNING contenedor_id, nivel_pct` al INSERT.

**Bug 2 — referencia obsoleta tras el fix 1.** "Historial Lecturas" seguía leyendo `{{ $json.body.contenedor_id }}`, una expresión válida cuando el nodo anterior era el Webhook (cuyo payload sí trae `.body`), pero inválida tras el fix 1, donde el nodo anterior pasó a ser "Guardar Lectura" (cuyo output ya no tiene `.body`). **Fix:** `{{ $json.contenedor_id }}`.

**Bug 3 — el filtro de persistencia de 20 minutos no era real.** Tras corregir los dos bugs anteriores, el flujo funcionó de punta a punta por primera vez (20 predicciones, 5 alertas reales por Telegram) — pero reveló un tercer problema: "Calcular Metricas" marcaba una lectura como "sostenida" contando simplemente "2 de las últimas 3 lecturas ≥85%", sin verificar el tiempo real transcurrido entre ellas, contradiciendo el texto literal de HU-03/RF-03 ("descartar picos que no se sostengan 20 minutos"). **Fix:** se reescribió la lógica para recorrer la serie histórica desde la lectura actual hacia atrás mientras el nivel se mantenga ≥85%, calcular cuántos minutos reales de reloj abarca esa racha (`sustained_minutes`), y solo marcar la lectura como sostenida si esa racha llega a 20 minutos reales. Verificado: un contenedor con 11.8 minutos reales de racha correctamente NO disparó alerta (antes del fix sí la habría disparado).

## k. Repositorio GitHub

**Estado (11/09):** repositorio creado y activo, con desarrollo en curso vía Claude Code CLI local. Enlace y README documentado (estructura, arquitectura y guía de instalación) pendientes de incorporar a la versión final de este informe antes de la entrega 14–18/09.

## l. Capturas de Pantalla

**Estado (11/09):** pendiente — se incorporan una vez terminadas todas las pantallas (semana del 13-14/09), como evidencia real de la aplicación desplegada en producción, no como bocetos de diseño.

## m. Video Explicativo

**Estado (11/09):** pendiente — se graba en la fase de cierre (14-15/09) y se sube a Google Drive. Guion actualizado: problema → login → mapa con puntos reales → especificaciones del sensor → flujo n8n → alerta real por Telegram → reportes.

## n. Modelo de Roles y Autenticación (nuevo, 11/09)

No estaba en la planificación original del informe; se agregó tras un pushback justificado de la autora sobre el modelo de negocio real del proyecto (contratación pública municipal, ya documentado en el Modelo de Viabilidad): si SIMDES se vende a una alcaldía o gobernación, ¿no hace falta un rol para la directiva del ente de aseo, más allá de quien opera el sistema técnicamente?

**Proceso de definición (relevante para la sección d. y f. — evidencia de análisis, no de suposición):** el modelo de roles se derivó en dos pasadas. La primera propuso 3 roles (Administrador, Cuadrilla, Sistema/Automatización) anclados en el backlog de 7 HU y en el esquema real de Supabase (la tabla `cuadrillas` ya anticipaba ese actor operativo). La segunda pasada, motivada por el pushback de negocio, revisó el descarte inicial de un cuarto rol y encontró un hueco de análisis: se había evaluado si dos historias (HU-06, HU-07) necesitaban permisos distintos *entre sí* (no), pero no si una misma historia en modo **lectura** necesita un permiso distinto del que ya tiene el Administrador en modo **escritura** — la pregunta correcta de separación de funciones (ISO/IEC 25010, característica de seguridad, control de acceso). La respuesta fue sí.

**Modelo final — 4 roles, cada uno con su respaldo:**

| Rol | Acceso | Respaldo |
| --- | --- | --- |
| **Administrador** (técnico/operaciones) | Lectura-escritura completa | HU-01 (catálogo, incl. edición de estado) y HU-07 (gobierno de tokens de IA) |
| **Directiva / Gerencia** | Solo lectura | HU-06 (KPIs de servicio) y HU-07 (costo de IA como costo operativo trasladable al presupuesto municipal) — respaldo en el análisis de stakeholders del Modelo de Viabilidad, no en una HU funcional |
| **Cuadrilla / Operador de recolección** | Lectura del mapa (HU-02); escritura acotada a su zona (marcar alertas resueltas) — **diseñado, pendiente de implementar**: no existe todavía ni la política de `UPDATE` en `alertas` ni la pantalla | Lado humano de HU-05; principio de mínimo privilegio |
| **Sistema / Automatización** (n8n + IA) | N/A — actor no humano, sin login | HU-03, HU-04 y disparo de HU-05; se incluye en el diagrama de casos de uso por corrección técnica |

El **dashboard/mapa público (HU-02) se mantiene sin login**, coherente con la narrativa de transparencia municipal ya presente en el Modelo de Viabilidad.

**Implementación técnica:** Supabase Auth (correo/contraseña, sin OAuth externo); tabla `perfiles` 1:1 con `auth.users`, campo `rol` con restricción de valores válidos; políticas RLS de escritura reescritas para exigir `authenticated` + rol correspondiente. Pantalla de login ya construida y funcionando (ver sección g).

**Decisión operativa de seguridad:** el primer usuario administrador se crea manualmente en el panel de Supabase (no mediante un script ni compartiendo la contraseña con ninguna herramienta de IA) — práctica básica de higiene de credenciales, coherente con RNF-04.

## Estado General y Próximos Pasos

| Punto del informe | Estado (11/09) |
| --- | --- |
| a. Elicitación | ✅ Completo |
| b. Requerimientos F/NF | ✅ Completo (incluye RNF-07, control de acceso) |
| c. Historias de usuario | ✅ Completo — 5 de 7 HU con implementación funcional confirmada |
| d. Gestión de calidad | ✅ Completo, con evidencia real de FTR (3 bugs de n8n encontrados y corregidos) |
| e. Diagramas de caso de uso | ⚠️ Diagrama debe regenerarse con el modelo de 4 roles |
| f. Uso de IA | ⚠️ Completo en estructura; falta cifra exacta de tokens de las fases 4-6 y expandir el análisis de eficiencia (criterio 10 del baremo) |
| g. Prototipo UI/UX | ⚠️ En construcción activa — mapa, CRUD de alta y login funcionando; reportes y especificaciones pendientes |
| h. Arquitectura general | ✅ Completo |
| i. Arquitectura de BD | ✅ Completo — RLS real resuelto (incluye un bug de producción detectado y corregido el 11/09: 4 tablas sin política de lectura, ver sección i), tabla `perfiles` incorporada |
| j. Automatización n8n | ✅ Validado end-to-end, con hallazgo de calidad documentado |
| k. Repositorio GitHub | ⚠️ Activo, falta incorporar enlace y README final al informe |
| l. Capturas de pantalla | ❌ Pendiente (semana del 13-14/09) |
| m. Video explicativo | ❌ Pendiente (semana del 14-15/09) |
| n. Modelo de roles y autenticación | ✅ Modelo confirmado y fundamentado; login construido, RLS por rol en curso |

Dado que la planificación, el backlog, la arquitectura, el marco de calidad, el modelo de roles y la bitácora de IA ya están completos — y que el sistema ya funciona de punta a punta en sus flujos centrales (mapa, ingesta, IA, alerta) —, el trabajo restante es mayormente de construcción de pantallas ya diseñadas y de documentación/evidencia, no de decisiones de diseño pendientes.
