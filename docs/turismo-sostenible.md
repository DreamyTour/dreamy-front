# Turismo sostenible en Perú

Ruta: `/es/turismo-sostenible-peru/`. Landing comercial e institucional en español; no sustituye artículos del blog.

## Implementación

- `src/content/pages/es/turismo-sostenible-peru.astro`: entrada en el sistema de páginas existente.
- `src/components/content/SustainableTourismContent.astro`: diseño editorial en Tailwind, fotografías, experiencias, compromisos, recomendaciones, FAQ y CTA.
- `src/data/sustainableTourism.ts`: textos aprobados y colección vacía para futuras iniciativas verificadas, aliados y resultados con fuente.
- `src/lib/sustainableTourism.ts`: consulta los seis productos originales de Strapi; utiliza sus slugs e imágenes y obtiene los metadatos del hero. No duplica productos ni modifica esquemas del CMS.
- `src/lib/dynamicPageRoutes.ts`: permite resolver metadatos mediante `getFrontmatter()` durante la generación, evitando peticiones en el ámbito global del Worker.
- `src/components/pages/DynamicContentPage.astro`: variante `landing` para que el contenido componga su hero y conserve Layout, SEO y navegación. Evita duplicar WebPage en esta variante.
- `src/components/ui/TourCard.astro`: presentación editorial opcional con título, descripción, duración y CTA; conserva la presentación por defecto de las otras páginas.
- `src/components/sections/PurposeTourism.astro`: activa el enlace sostenible del home.
- `src/components/content/PlaneaTuViaje.tsx`: registra consultas satisfactorias que llegan desde esta landing, sin datos personales en el evento.

Se reutilizan Layout, SEO, BreadcrumbList, HeroImage, SectionDivider, TourCard, los helpers de imágenes, el formulario de planificación y el dataLayer existente de GTM.

## Enlaces e imágenes

Los seis tours responden 200 en local y producción:

- `/es/machu-picchu-mandor-2-dias/`
- `/es/montana-palcoyo-full-day/`
- `/es/lares-trek-machu-picchu-4-dias/`
- `/es/lago-sandoval-2-dias/`
- `/es/lago-sandoval-3-dias/`
- `/es/tambopata-expedicion-amazonica-4-dias/`

El catálogo utilizado es `/es/paquetes-peru/`; la consulta utiliza `/es/planea-tu-viaje/`. Ambos funcionan en local.

Todas las fotografías proceden de los productos existentes en Strapi y cargan correctamente. No faltan imágenes y no se generaron fotografías.

## Medición

Eventos enviados al dataLayer existente:

- `sustainable_tourism_click`: acción del hero, tour, catálogo o planificación; incluye destino y slug del tour cuando corresponde.
- `sustainable_tourism_enquiry`: consulta enviada correctamente desde el formulario de planificación con esta landing como referente del mismo origen. No se registra como conversión el simple clic.

Revisar en GTM las etiquetas que deban enviar estos eventos a GA4; no se publica ni modifica el contenedor GTM desde este proyecto. La atribución de consultas cubre la navegación directa desde la landing al formulario.

## Validación y pendientes

- Un H1; descripción de 144 caracteres; canonical y OG correctos.
- Solo hreflang español. No se crean traducciones EN/PT.
- Sin desbordamiento a 390, 768, 1024 y 1440 px.
- FAQ nativo mediante details/summary, cerrado inicialmente y usable con teclado. Sin FAQPage schema.
- Respeta movimiento reducido. Imágenes secundarias con lazy loading y dimensiones reservadas; hero con prioridad alta.
- Comprobación Astro sin errores. Build validado con la integración Cloudflare.
- Seguimiento del formulario comprobado con una respuesta simulada: no se envió una consulta real.

El blog `/es/blog/turismo-sostenible-peru-guia-viajeros-responsables/` devuelve 404 tanto en local como en producción y no aparece entre los posts publicados del CMS. No se modifica ni se enlaza. Añadir el enlace contextual «guía de turismo sostenible en Perú» cuando se publique.

Turismo responsable e inclusivo aún devuelven 404 en local: sus tarjetas son informativas y no enlazan a rutas inexistentes. Activarlas cuando estén publicadas.

Para publicar esta landing solo queda desplegar el frontend. La incorporación del blog, las otras dos páginas y la configuración de GA4 son tareas independientes; no se publican afirmaciones ambientales sin documentación.
