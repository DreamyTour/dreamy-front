# Turismo inclusivo en Cusco

Ruta: `/es/turismo-inclusivo-cusco/`. Landing en español integrada en el sistema de contenido Astro existente, con metadatos resueltos durante la generación desde Strapi.

## Archivos de esta implementación

- `src/content/pages/es/turismo-inclusivo-cusco.astro`: entrada mediante `getFrontmatter`, sin peticiones en el ámbito global del Worker.
- `src/components/content/InclusiveTourismContent.astro`: composición editorial, títulos alternados, cinco experiencias, información de accesibilidad, pasos, FAQ y CTA.
- `src/components/content/InclusiveEnquiryForm.astro`: formulario accesible conectado al endpoint existente.
- `src/data/inclusiveTourism.ts`: contenido aprobado en español.
- `src/lib/inclusiveTourism.ts`: productos y duraciones originales, metadatos e interfaz para futuras evaluaciones documentadas de accesibilidad.
- `src/components/sections/PurposeTourism.astro`: activa el enlace del home y sustituye el espacio pendiente por una fotografía auténtica de viajeros en Chinchero.
- `src/i18n/ui.ts`: textos alternativos del nuevo card en los tres idiomas del componente, sin crear traducciones de la landing.

Se reutilizan DynamicContentPage con variante landing, Layout, SEO, BreadcrumbList, HeroImage, SectionDivider, TourCard, helpers de imágenes, países y la API de contacto. No se modifica el esquema de Strapi ni la landing sostenible.

## Productos y enlaces

Comprobados en la nueva arquitectura local, todos con respuesta 200:

- `/es/city-tour-cusco/` — duración original: 4 Horas.
- `/es/valle-sur-cusco/` — duración original: Dia Completo.
- `/es/valle-sagrado-incas-full-day/` — duración original: Dia Completo.
- `/es/machu-picchu-full-day/` — duración original: Dia Completo.
- `/es/cusco-machu-picchu-5-dias/` — duración original: 5 Días / 4 Noches.
- `/es/cusco/`, `/es/planea-tu-viaje/`, `/es/politicas-privacidad/` y `/es/turismo-sostenible-peru/`.

No se encontró una página equivalente en los contenidos locales o en las páginas publicadas de Strapi. No se consultaron artículos antiguos de WordPress para esta evaluación.

## Fotografías y accesibilidad

Fotografías oficiales de los productos en Strapi. Hero: viajeros en Chinchero; secciones editoriales: Sacsayhuamán y Machu Picchu. No se generaron imágenes ni se muestran servicios adaptados no confirmados.

La colección `accessibilityAssessments` está vacía. Su estructura permite registrar documentId del tour, fecha, fuente y condiciones con los estados Verificado, Disponible previa coordinación, No disponible o Pendiente de confirmar. La leyenda de la página explica que son estados previstos para futuras evaluaciones; no se asignan a los tours actuales.

Referencia conceptual: [Guía de Turismo Accesible «Turismo para Todos», R. M. N.° 074-2026-MINCETUR](https://www.gob.pe/institucion/mincetur/normas-legales/7937694-074-2026-mincetur). No constituye una certificación de la página ni de los servicios.

## Formulario

Usa `POST /api/planea-tu-viaje`, sin endpoint nuevo. Nombre, correo y país obligatorios; fecha, total de viajeros, interés y preferencias opcionales. Consentimiento requerido con enlace a la política existente. No se solicitan diagnósticos ni documentos de discapacidad.

- Campos originales: nombres, email, pais, fechaViaje y tourName.
- El total de viajeros y las preferencias se incluyen en `mensaje`, junto con la declaración de consentimiento. No se crean campos adicionales en Strapi.
- Adultos y menores se envían como «Por confirmar» para no inventar la distribución por edades.
- La API actual no tiene un registro estructurado independiente de consentimiento ni de total de viajeros. Si se necesita consulta o reporte de esos valores por separado, queda pendiente ampliar ese contrato de datos.
- Sin JavaScript, funciona el envío HTML al endpoint existente; el aviso pide indicar el total de viajeros dentro del mensaje.
- No se guardan preferencias en localStorage ni se envían datos personales a analítica.
- Se evita el doble envío; errores y tiempos de espera conservan los valores; los mensajes se anuncian con roles accesibles. Si la API responde `simulation: true`, la interfaz indica que el correo no fue entregado, sin mostrar una confirmación de envío real.

## Validaciones

- Astro check sin errores; build con el adaptador Cloudflare.
- Un H1, canonical y OG correctos; hreflang solo español; no se genera FAQPage.
- Fotografías y todos los enlaces internos comprobados.
- Sin desbordamiento a 320, 390, 768, 1024 y 1440 px; tours en 3 + 2 centrados en escritorio.
- FAQ nativo cerrado inicialmente, manejable con teclado.
- Formulario probado mediante respuestas interceptadas: campos vacíos, consentimiento, error con conservación y foco, simulación y éxito. No se enviaron correos reales durante las pruebas.
- axe-core, reglas WCAG A/AA, 2.1 AA y 2.2 AA sobre la nueva landing: sin incidencias detectadas. Comprobados labels, identificadores únicos y avance por teclado del nombre al correo. Es una revisión técnica básica, no una certificación ni una auditoría integral con usuarios.

## Pendientes

Publicar el frontend y confirmar la entrega real de correo en el entorno de producción. Las adaptaciones, apoyos y condiciones concretas deben confirmarse operativamente antes de asignar estados o garantizar servicios.

`/es/turismo-responsable-cusco/` todavía no existe en la nueva arquitectura: se muestra como información sin enlace. No faltan fotografías para esta landing. No se han creado rutas EN/PT.
