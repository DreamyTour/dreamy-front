# Turismo responsable en Cusco

Ruta: `/es/turismo-responsable-cusco/`. Tercera landing de Turismo con propósito, integrada en las páginas de contenido Astro existentes. Se centra en comunidades, cultura viva y encuentros con anfitriones; no presenta las reservas como financiación del Proyecto social.

## Archivos

- `src/content/pages/es/turismo-responsable-cusco.astro`: entrada de contenido y fábrica de metadatos.
- `src/components/content/ResponsibleTourismContent.astro`: diseño editorial en Tailwind, títulos alternados, experiencias, compromisos, recomendaciones, FAQ y CTA.
- `src/components/content/ResponsibleCommitmentEvidence.astro`: componente opcional para publicar evidencia real con fuente, fecha y aliado. Sin registros de ejemplo ni afirmaciones publicadas.
- `src/data/responsibleTourism.ts`: textos aprobados en español.
- `src/lib/responsibleTourism.ts`: consulta los seis productos originales, obtiene sus duraciones y compone los metadatos con la fotografía de Misminay.
- `src/components/sections/PurposeTourism.astro`: activa el enlace del home y añade la imagen oficial de Misminay.
- `src/i18n/ui.ts`: textos alternativos del card del home; no crea rutas traducidas.

Se reutilizan DynamicContentPage (variante landing), Layout, SEO, BreadcrumbList, HeroImage, SectionDivider, TourCard, helpers de imágenes y contacto de planificación. No se crean endpoints, modelos ni productos de Strapi. Las fuentes de las landings sostenible e inclusiva se conservaron intactas, comprobadas mediante hashes antes y después.

## Enlaces y contenido del catálogo

Las seis rutas del catálogo nuevo responden 200 en local:

- `/es/turismo-vivencial-misminay-full-day/`
- `/es/turismo-vivencial-misminay-2-dias/`
- `/es/puente-qeswachaka-full-day/`
- `/es/maras-moray-salineras/`
- `/es/valle-sagrado-vip/`
- `/es/valle-sagrado-incas-full-day/`

También se verificaron `/es/turismo-sostenible-peru/`, `/es/turismo-inclusivo-cusco/` y `/es/planea-tu-viaje/`. El enlace del home apunta a la nueva ruta.

No se encontró una landing equivalente entre los contenidos locales y las páginas publicadas del CMS. No se consultaron ni enlazaron artículos de WordPress.

El itinerario original de Misminay de dos días documenta alojamiento local, demostraciones textiles, agricultura y cocina; no se añadieron actividades ajenas al catálogo.

Todas las duraciones se consultan desde los badges originales de Strapi. Maras y Moray muestra el dato actual del catálogo (8 Horas en la revisión), sin fijarlo en el código, con una nota visible para confirmar la duración antes de reservar. La ficha original contiene información temporal inconsistente: queda pendiente su revisión editorial en el CMS, sin modificarla desde esta tarea.

## Fotografías y evidencia pendiente

Se reutilizan fotografías oficiales del catálogo nuevo: anfitriones y viajeros en Misminay, espacios de la comunidad y las fotografías propias de los seis recorridos. No se han generado imágenes ni utilizado material de otra comunidad bajo el nombre de Misminay.

No hay cuatro fotografías específicas verificadas para textiles, agricultura, gastronomía e historias locales. Esos cuatro elementos se presentan con texto y una fotografía real de contexto de Misminay. Pueden incorporarse imágenes específicas cuando estén disponibles y autorizadas.

El CMS no adjunta registros de consentimiento de los protagonistas. Se reutiliza material ya publicado en el catálogo de la agencia; corresponde confirmar internamente sus autorizaciones de uso. La página no afirma que se haya realizado esa verificación documental.

Los cinco compromisos se presentan como principios de trabajo y mejora continua. No se publican cifras, porcentajes económicos, testimonios, certificaciones ni alianzas inventadas.

## Medición

Se utiliza el dataLayer de GTM ya presente en el layout. Evento: `responsible_tourism_click`.

- `action: tour`: incluye `tour_slug`, `experience_kind` (misminay/cultural) y destino.
- `related_sustainable` y `related_inclusive`: enlaces a las otras dos landings.
- `plan_trip`: clic hacia el contacto existente.
- Accesos del hero y CTA final: `hero_experiences`, `hero_commitment`, `final_experiences`.

Se comprobaron los eventos de los seis tours, las dos páginas relacionadas y el contacto. No se cargan scripts adicionales ni se envían datos personales. Queda comprobar en GTM/GA4 si el contenedor ya transforma este evento en eventos de GA4; no se modifica el contenedor externo desde el frontend.

## Validaciones

- Astro check: 297 archivos, cero errores, advertencias o sugerencias.
- Build de producción con Cloudflare completado; ruta incluida en sitemap.
- Un H1; título SEO y descripción aprobados; canonical correcto; OG con fotografía de Misminay.
- Hreflang solo español. No se crean traducciones ni slugs EN/PT.
- Sin FAQPage ni datos estructurados duplicados.
- Once imágenes cargadas y textos alternativos de entre 34 y 71 caracteres.
- Responsive sin desbordamientos a 320, 390, 768, 1024 y 1440 px. Dos cards protagonistas y cuatro complementarios en escritorio.
- FAQ cerrado inicialmente, operable con Enter y Espacio; foco visible y movimiento reducido.
- axe-core, reglas WCAG A/AA, 2.1 AA y 2.2 AA sobre la landing: sin incidencias detectadas. Esta revisión técnica no equivale a una certificación ni a una auditoría integral con usuarios.
- Sin errores de JavaScript detectados durante la revisión.

Pendiente: despliegue del frontend, revisión de la duración de Maras/Moray, comprobación interna de autorizaciones de imagen y publicación de evidencias reales cuando existan.
