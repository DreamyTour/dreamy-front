# Contraste de las dos auditorías SEO — 2026-10-23

Se revisaron las 15 diapositivas de `analisis-seo-dreamy-tours.pptx` y el texto de
`Lista P0 para el desarrollador - Dreamy Tours.docx`. El Word desarrolla los P0
de la misma auditoría; el PowerPoint añade recomendaciones P1/P2. No son dos
auditorías independientes que requieran repetir la limpieza.

Las instrucciones de los documentos se trataron como recomendaciones para
contrastar. La solicitud del usuario sigue teniendo prioridad: conservar las
ocho reglas originales, retirar el resto de `/en/` con 410 y no hacer push ni
despliegue. Por ello no se aplicaron las propuestas de redirigir todos los
`/en/` con 301 ni de publicar/enviar sitemaps a Search Console.

## Resultado por hallazgo

| Hallazgo | Resultado y alcance |
| --- | --- |
| Sitemap, 119 aliases `/en/`, `/dev/`, `/cms/` | Repite el trabajo documentado en [legacy-en-retirement.md](legacy-en-retirement.md). Las ocho reglas protegidas siguen intactas. |
| Seis checkout y 21 índices paginados del blog | Ya excluidos del sitemap; siguen accesibles. Checkout conserva su noindex y la paginación sus enlaces. No se excluyen las 12 páginas de paginación de categorías. |
| Meta descriptions de portada incompletas | Corregidas para EN/ES/PT en `HomePage.astro`, con textos completos y sin añadir afirmaciones comerciales no comprobadas. Se usan en description, Open Graph y Twitter. |
| WordPress `/?p=7457`, `/?p=1336`, `/?s=inca` | En producción devolvían 200 con la portada. El Worker ahora devuelve 410 para búsquedas `s` e IDs numéricos `p` en las portadas raíz/ES/PT con GET/HEAD, sin redirigir a contenido no equivalente. Otros parámetros y las consultas de tours/checkout se conservan. |
| HTTP todavía devuelve 200 | Confirmado en portada y `/inca-trail-4-days/?x=1`. Pendiente de configurar y validar HTTPS en Cloudflare. No se tiene sesión autenticada y no se cambiaron reglas de producción. Un guard en el Worker con assets-first no cubriría todos los HTML estáticos; no se presenta una solución parcial como completa. |
| Cuatro artículos antiguos con tráfico | Sus cuatro destinos `/blog/` actuales devuelven 404 y no aparecen equivalentes de esos temas en los slugs EN publicados del mapa actual. Recuperar el contenido original y determinar equivalencias sigue pendiente. No se inventaron artículos ni se añadieron excepciones o redirecciones a la portada. |
| HTML de portada pesado | Se encontró el mapa del Perú incrustado como un path de más de 211 KB. Ahora se sirve el mismo SVG como archivo externo cacheable, con dimensiones y carga diferida. Sus puntos, enlaces y código de interacción se mantienen. Es una reducción del HTML, no la eliminación del peso del recurso ni una medición de Core Web Vitals. |
| Imágenes sin alt útil | Las fotografías de `HomeTourCard` ahora usan el texto alternativo del CMS con el título del tour como respaldo. Se conservan los alt vacíos apropiados de fondos, banderas, iconos y mapa decorativo. El recuento automático del informe mezcla estos casos con errores. No faltaba el atributo alt en las tres muestras examinadas. |
| Schema de tours incompleto | Ya existía `TouristTrip`. Se añadió `Offer` exclusivamente a fichas que muestran la tarjeta de reserva con precio desde, usando el mismo valor y moneda USD. Se comparte la selección del precio entre tarjeta y schema. No se publica precio para fichas con formulario de contacto, tours de un día por cotización ni precios ausentes/inválidos. La validación detectó un valor interno de 10 en un tour sin precio visible; no se anuncia como oferta. No se inventa disponibilidad. |
| Falta de FAQPage | Ya existe `buildFaqPageSchema`, aplicado a las preguntas publicadas de las páginas del CMS. No se fabrica FAQPage en tours sin preguntas visibles. Tener marcado válido no garantiza resultados enriquecidos. |
| Cifras de reseñas incoherentes | La pared de reseñas tenía 12.910 opiniones de Tripadvisor. El perfil enlazado consultado muestra 164 y 4,9; se corrigió el contador y se registró la fecha de comprobación. Es una captura manual, no una integración en vivo. Google/Trustpilot y las cifras de clientes requieren validación de sus responsables; no son métricas intercambiables. |
| AggregateRating | No se añadió una valoración global de empresa al sitio de la propia empresa para prometer estrellas. Las valoraciones deben tener procedencia y alcance verificables; una cifra de Tripadvisor no se convierte automáticamente en valoraciones de cada tour. |
| GA4, eventos de reserva/WhatsApp, Meta Pixel | Hay GTM y eventos de navegación en el código. Sin acceso al contenedor, GA4 y su modo de depuración no puede concluirse qué etiquetas/eventos publica GTM. No se insertaron píxeles ni identificadores inventados o duplicados. Pendiente validar medición real. |
| Interenlazado editorial, clusters, GBP y autoridad/Ahrefs | Recomendaciones P2 que necesitan decisiones editoriales, cuentas y datos del negocio. No se crearon sedes, reseñas, enlaces externos ni métricas de autoridad ficticias. |

## Rutas y prioridad

`public/_redirects` no se edita. Para `/en/` se mantiene el orden: primero las
ocho excepciones delegadas a `ASSETS`, después 410 para el resto. La inspección
de consultas WordPress ocurre después de ese bloque y solo para GET/HEAD.

`run_worker_first` añade únicamente `/`, `/es`, `/es/`, `/pt` y `/pt/` a los
selectores de `/en/`. Esto permite revisar la consulta antes de que el HTML
estático de portada responda 200. Las portadas normales se delegan a `ASSETS`
sin redirección; esos accesos ahora invocan el Worker. Los restantes assets
legítimos conservan assets-first. No se activó Worker-first global.

Los cuatro destinos antiguos comprobados son:

- `/blog/who-lived-in-ollantaytambo/`
- `/blog/the-lost-city-of-the-incas/`
- `/blog/the-last-inca-bridge-qeswachaka-in-cusco-peru/`
- `/blog/tipon-archaeological-park-in-cusco/`

La producción aún redirige sus variantes `/en/blog/` a estos 404 mediante su
comportamiento anterior. Esos orígenes no pertenecen a las ocho reglas del
archivo protegido. El cambio local autorizado mantiene 410 para esos aliases.
La existencia y precedencia de reglas adicionales de la cuenta Cloudflare
siguen pendientes de inspección antes de publicar.

## Diferencias de recuentos

La propuesta del documento calcula `864 − 149 = 715`. El XML público capturado
contiene 867 URLs, de las cuales 119 son `/en/`, seis checkout y 21 índices
paginados. `/dev/` y `/cms/` ya no aparecen en esa captura. El conjunto final
verificable es `867 − 119 − 6 − 21 = 721`, sin pérdidas adicionales.
El XML histórico de 864 no se ha aportado; no se atribuyen sus diferencias a
URLs concretas sin evidencia. Los 832 y 713 de builds anteriores procedían de
otro conjunto de contenido, el CMS local, como documenta la fase anterior.

## Fuentes contrastadas

- [Perfil de Tripadvisor enlazado por el propio sitio](https://www.tripadvisor.com.pe/Attraction_Review-g294314-d17325827-Reviews-Dreamy_Tours-Cusco_Cusco_Region.html): 164 opiniones y 4,9 en la consulta de esta revisión; la fuente puede cambiar.
- [Schema.org TouristTrip](https://schema.org/TouristTrip): admite ofertas para el viaje.
- [Google: review snippets](https://developers.google.com/search/docs/appearance/structured-data/review-snippet): restricciones de reseñas de organizaciones sobre sí mismas y necesidad de datos adecuados.
- [Cloudflare: Worker script y assets](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/): selección de rutas que ejecutan el Worker antes de servir assets.

## Validación

- Build de producción completado contra el CMS público, sin modificar `.env`.
- `bun test src`: 202 aprobados, 0 fallos, 1.841 aserciones en 31 archivos.
- `astro check`: 357 archivos, 0 errores, 0 warnings y 0 hints.
- Auditoría del build: 721 URLs exactas frente al conjunto público esperado,
  745 HTML, cero referencias antiguas `/en/` y archivo `_redirects` intacto.
- Integración del Worker final: 1.010 solicitudes HTTP aprobadas, más el fixture
  de resolución multilingüe. Incluye 410 de consultas WordPress, conservación
  de parámetros legítimos, todas las checkout/paginaciones autorizadas y las
  ocho reglas originales con GET/HEAD y consultas repetidas. El fixture de
  retirada `/en/` aprueba otras 121 comprobaciones HTTP, incluso frente a
  assets obsoletos colocados deliberadamente.
- Auditoría adicional: las tres portadas tienen description completa y
  coherente con Open Graph/Twitter; 23 fotografías de tarjetas por portada
  tienen texto alternativo. Se examinaron 276 fichas: diez ofertas con precio
  igual al visible y tres tours privados de un día sin oferta por cotización.
  Las demás fichas no reciben ofertas si no muestran una tarjeta con precio.
- HTML de portada EN: 724.142 → 510.862 bytes (−29,45 %). ES: 513.316 bytes;
  PT: 513.468 bytes. El SVG externo conserva exactamente el archivo original.
- Prueba en Chromium del build servido localmente: SVG y siete fotografías de
  destino cargados, siete puntos conservados, hover y foco por teclado activan
  el destino correspondiente y sus enlaces siguen presentes. Captura revisada
  en `.astro/peru-map-follow-up.png` (evidencia local ignorada por Git).

No se ha realizado push, despliegue ni modificación del CMS o de la cuenta
Cloudflare. Pendientes externos: inspeccionar reglas Cloudflare y activar HTTPS
sin conflictos; recuperar los cuatro artículos; validar Google/Trustpilot,
estadísticas comerciales y el contenedor de medición; obtener el XML histórico
si se necesita atribuir exactamente la diferencia del antiguo total de 864.
