# Dreamy Tours Frontend

Frontend de Dreamy Tours construido con Astro, React y Tailwind CSS. Publica la web informativa, tours y blog alimentados por Strapi, checkout, formularios comerciales y contenido en ingles, espanol y portugues.

## Stack y arquitectura

- Astro 7 con paginas prerenderizadas y endpoints server-side.
- React 19 para menu, tabs, mapas, calendarios, formularios y checkout.
- Tailwind CSS v4 mediante `@tailwindcss/vite` y tokens en `src/styles/global.css`.
- MDX para paginas editoriales locales.
- Strapi como CMS remoto para home, contenido global, tours, blog y paginas dinamicas.
- `@astrojs/cloudflare` para produccion y APIs.
- Resend para emails y PayPal para solicitudes de pago.
- Biome, Prettier, TypeScript y Playwright para calidad y pruebas.
- shadcn/ui, Radix UI, Base UI y Lucide para UI e iconos.

## Requisitos

- Node.js `>=22 <24`.
- Bun `1.3.14` o compatible con el `packageManager`.
- Acceso a Strapi mediante `VITE_STRAPI_URL`.

El repositorio usa `bun.lock`. No mezcles otros gestores ni lockfiles.

## Instalacion y desarrollo

```sh
bun install
bun run dev
```

Astro queda disponible por defecto en `http://localhost:4321`.

```sh
bun run build
bun run preview
```

## Variables de entorno

Crea un archivo `.env` en la raiz:

```env
VITE_STRAPI_URL=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
RESEND_TO_EMAIL=
PAYPAL_BUSINESS_EMAIL=
```

- `VITE_STRAPI_URL`: URL base de Strapi; necesaria para cargar contenido del CMS.
- `RESEND_API_KEY`: habilita el envio real de emails. Sin ella, los formularios pueden simular el envio.
- `RESEND_FROM_EMAIL`: remitente verificado. Por defecto: `Dreamy Tours <info@dreamy.tours>`.
- `RESEND_TO_EMAIL`: destinatarios separados por coma. Por defecto: `info@dreamy.tours`.
- `PAYPAL_BUSINESS_EMAIL`: cuenta PayPal receptora. Por defecto: `info@turismoperu.com.pe`.

No subas secretos al repositorio.

## Scripts

| Comando | Uso |
| --- | --- |
| `bun run dev` | Servidor local de Astro. |
| `bun run build` | Build de produccion. |
| `bun run preview` | Sirve el build localmente. |
| `bun run check` | Ejecuta `astro check`. |
| `bun run lint` | Ejecuta `biome check .`. |
| `bun run format` | Formatea con Biome y Prettier. |
| `bun run format:check` | Comprueba el formato sin escribir cambios. |
| `bun run test` | Ejecuta pruebas unitarias de `src`. |
| `bun run test:e2e` | Ejecuta las pruebas E2E de Playwright. |

## Estructura

```txt
src/
  components/       Astro, React, layout, tours, checkout y UI
  content/pages/    Paginas MDX por idioma
  data/             Datos y configuracion de paginas especiales
  i18n/             Textos traducibles de interfaz
  layouts/          Layouts base
  lib/              CMS, i18n, SEO, checkout, calendario y utilidades
  pages/            Rutas Astro y endpoints API
  styles/           CSS global y tokens
  types/            Tipos de Strapi y entidades del dominio
public/              Assets, robots.txt, _redirects y llms.txt
tests/               Pruebas E2E
docs/                Guias tecnicas
```

## Rutas

- `/`, `/es`, `/pt`: home en ingles, espanol y portugues.
- `/[slug]`, `/[lang]/[slug]`: paginas y tours dinamicos de Strapi o MDX.
- `/blog/[...page]`, `/blog/[slug]`, `/blog/[category]/[...page]`: blog.
- `/[lang]/blog/...`: versiones localizadas del blog.
- `/checkout`, `/[lang]/checkout`: checkout.
- `/checkout/success`, `/[lang]/checkout/success`: confirmacion de checkout.
- `/inca-trail-availability`: disponibilidad del Camino Inca en ingles.
- `/es/disponibilidad-camino-inca`: disponibilidad en espanol.
- `/pt/disponibilidade-trilha-inca`: disponibilidad en portugues.
- `/404`: pagina de error.

El middleware elimina el prefijo `/en` y conserva `/es` y `/pt`.

## CMS y contenido

La integracion con Strapi esta en `src/lib/strapi.ts`:

- `fetchApi`: peticiones con `locale`, `query`, `wrappedByKey` y cache por URL durante la ejecucion.
- `fetchAllStrapi`: paginacion automatica en lotes de hasta 100 elementos.
- `src/lib/dynamicPageRoutes.ts`: rutas de paginas y tours.
- `src/lib/blogRoutes.ts`: indices, posts y categorias.

Las paginas editoriales viven en `src/content/pages/{en,es,pt}` y usan la coleccion de `src/content.config.ts`. Conserva el frontmatter existente: `title`, `description`, `lang`, `heroImage`, `heroImageAlt`, `slugs` y `seo`.

## Disponibilidad del Camino Inca

Las paginas de disponibilidad usan `IncaTrailAvailabilityPage.astro`, consultan tours publicados en Strapi y obtienen permisos mediante:

```txt
GET /api/calendar-tickets?place=2&road={1|5}&year={YYYY}&month={M}
```

El endpoint hace proxy a `https://calendar.dreamy.tours/v1/tickets`.

- Ruta `1`: Camino Inca clasico de 4 dias.
- Ruta `5`: Camino Inca corto de 2 dias.

La seleccion de fecha y pasajeros se guarda en `localStorage.bookingCart` y redirige a checkout. Los slugs, rutas y duraciones se definen en `src/lib/incaTrailBooking.ts`. El ano publico se configura en `src/components/content/IncaTrailAvailabilityPage.astro`.

## Checkout y APIs

Endpoints en `src/pages/api`:

- `POST /api/checkout`: valida pasajeros, contacto y carrito; consulta Strapi para validar el precio; envia email y genera la URL de PayPal.
- `POST /api/planea-tu-viaje`: formulario de viaje personalizado.
- `POST /api/libro-reclamaciones`: libro de reclamaciones.
- `GET /api/calendar-tickets`: proxy de disponibilidad.

El checkout usa `bookingCart` y `lastBookingTourPath` en `localStorage`. La pagina de exito limpia el carrito. Resend se usa cuando existe `RESEND_API_KEY`.

## Internacionalizacion y UI

La configuracion i18n esta en `src/lib/i18n.ts`: idiomas `en`, `es`, `pt`, con `en` como default. `localizePath`, `stripLangPrefix` y `rewriteUrl` normalizan URLs. Los textos cortos estan en `src/i18n/ui.ts`.

Los estilos globales y variables viven en `src/styles/global.css`. La fuente principal es Outfit. Los componentes reutilizables estan en `src/components/ui`; el alias TypeScript `@/*` apunta a `src/*`. shadcn usa estilo `new-york` e iconos Lucide.

## SEO, accesibilidad y archivos publicos

- `src/lib/seo.ts` y `src/components/layout/SEO.astro` centralizan SEO y Open Graph.
- `@astrojs/sitemap` genera el sitemap y excluye `/404`.
- `public/robots.txt` declara reglas de rastreo y sitemap.
- `public/llms.txt` resume paginas publicas para sistemas de descubrimiento.
- El layout incluye skip link, focos visibles y `prefers-reduced-motion`.
- `public/_redirects` contiene redirecciones 301 de backlinks antiguos.

## Build y despliegue

`astro.config.mjs` define `site: "https://dreamy.tours"`, Cloudflare, React, MDX, Tailwind y sitemap. El build combina contenido prerenderizado con rutas server-side y APIs.

- `_routes.json`: rutas procesadas por Cloudflare.
- `public/_redirects`: redirecciones heredadas.
- `.wrangler/`: estado local generado por Wrangler.

## Verificacion antes de entregar

```sh
bun run check
bun run lint
bun run test
bun run test:e2e
bun run build
```

Las pruebas E2E levantan Astro en `http://127.0.0.1:4322` y cubren foco del checkout, validacion de payloads, seleccion de fechas, rutas 1 y 5 del Camino Inca y coherencia del carrito.

## Notas de desarrollo

- Usa Astro para contenido estatico y React cuando se necesite interactividad en cliente.
- Centraliza llamadas a Strapi en `src/lib/strapi.ts` y usa los tipos de `src/types`.
- Para paginas legales nuevas, prefiere MDX en el idioma correspondiente.
- Para textos de UI, agrega claves en `src/i18n/ui.ts`.
- Para estilos compartidos, usa variables del tema antes que colores aislados.
- Mantiene sincronizados los slugs localizados, `public/llms.txt` y este README al agregar rutas publicas.


---

# Referencia funcional de la web

Esta seccion describe que ofrece la web, como se organiza la navegacion y que fuente de datos controla cada experiencia.

## 1. Propuesta y contenido publico

Dreamy Tours presenta servicios de turismo receptivo y paquetes para Peru, Bolivia y otros destinos de Sudamerica. La web combina:

- Tours y paquetes publicados desde Strapi.
- Paginas de destinos y paginas institucionales.
- Guias editoriales y contenido de blog.
- Planificacion de viajes personalizados.
- Informacion de pagos, terminos, privacidad y reclamaciones.
- Herramientas de reserva y consulta de disponibilidad.
- Contenido en ingles, espanol y portugues.

La navegacion global se compone de:

- Barra superior opcional para anuncios configurados desde el contenido global.
- Header con logo, enlaces secundarios, acciones comerciales y selector de idioma.
- Menu principal y menu movil provenientes de la configuracion global.
- Footer con enlaces, datos de contacto, redes sociales y enlaces legales.
- Boton flotante de WhatsApp.
- Skip link y estados de foco para navegacion con teclado.

Los enlaces internos se traducen con rewriteUrl y localizePath. Los enlaces externos conservan su URL y se abren con las propiedades de seguridad correspondientes.

## 2. Home

La home se carga desde el single type home de Strapi mediante src/components/pages/HomePage.astro. El orden actual de sus bloques es:

1. Hero: imagen o video de fondo, titulo, texto, badge y llamadas a la accion.
2. HomeStats: estadisticas y argumentos de confianza.
3. About: presentacion de Dreamy Tours.
4. Certifications: premios, certificaciones y autorizaciones.
5. Paquetes de Machu Picchu: tours de la categoria configurada en sectionMapi.
6. Paquetes de Peru: categoria y enlace localizado de Peru.
7. PeruGuide: enlaces de destinos y paginas de Peru.
8. Paquetes de Bolivia: categoria Bolivia.
9. HomePost: posts destacados del blog.
10. ReviewsWall: opiniones o prueba social.

La respuesta de home debe conservar estos campos:

| Campo | Uso |
| --- | --- |
| hero | Hero principal y CTA. |
| about | Texto e imagen institucional. |
| premios.premios | Certificaciones y reconocimientos. |
| sectionMapi | Categoria y limite de tours de Machu Picchu. |
| peruPaquetes | Categoria y limite de paquetes de Peru. |
| boliviaPaquetes | Categoria y limite de paquetes de Bolivia. |
| cardPost | Post o bloque editorial destacado. |
| seo | Metadatos especificos de la home. |

## 3. Paginas dinamicas de destinos y contenido

Las rutas src/pages/[slug].astro y src/pages/[lang]/[slug].astro resuelven tres tipos de contenido:

- mdx: paginas locales versionadas en el repositorio.
- page: paginas dinamicas provenientes del endpoint pages de Strapi.
- tour: fichas provenientes del endpoint tours de Strapi.

src/lib/dynamicPageRoutes.ts obtiene los registros por idioma, agrupa traducciones por documentId y genera un slugMap. Esto permite que una misma pagina tenga slugs distintos en cada idioma.

No se debe asumir que el slug traducido es igual. Una traduccion correcta se relaciona por documentId:

    en: /about-us
    es: /es/sobre-nosotros
    pt: /pt/sobre-nos

Si una traduccion de Strapi no existe, el proyecto genera una redireccion hacia la version disponible cuando corresponde.

## 4. Fichas de tours

Una ficha de tour se renderiza con TourLayout.astro y normalmente incluye:

- Hero del tour con imagen destacada, titulo, precio, badges y CTA.
- Descripcion enriquecida desde bloques de Strapi.
- Tabs opcionales, solo visibles cuando tienen contenido:
  - Overview: resumen y linea de tiempo.
  - Itinerary: itinerario por dias y acordeones.
  - Included: servicios incluidos.
  - Information: recomendaciones y datos practicos.
  - Price: detalle de precios y condiciones.
  - Maps: mapa interactivo con paradas, coordenadas, orden, duracion y ruta.
- Formulario de reserva o contacto.
- Tours relacionados filtrados por categoria.
- Datos estructurados de tour, SEO y Open Graph.

El modelo Tour necesita titulo, slug, contenido, imagen destacada, badges, categorias, tabs y SEO. El precio priceTour es necesario para checkout.

Los bloques enriquecidos se normalizan en src/lib/strapiBlocks.ts para soportar listas, galerias, parrafos, encabezados y enlaces.

### Reserva normal de tour

Para tours que no estan incluidos en la configuracion especial del Camino Inca, se usa BookingForm junto con BookingFormIsland. La seleccion guarda un carrito temporal y redirige a checkout.

### Reserva especial del Camino Inca

Los slugs definidos en src/lib/incaTrailBooking.ts activan el calendario de disponibilidad:

| Ruta | Duracion | Slugs configurados |
| --- | ---: | --- |
| 1 | 4 dias | inca-trail-4-days, camino-inca-4-dias, trilha-inca-4-dias |
| 5 | 2 dias | short-inca-trail-2-days, camino-inca-corto-2-dias, trilha-inca-2-dias |

Si se crea un nuevo slug para estos productos, hay que registrarlo en incaTrailBooking.ts.

## 5. Blog y contenido editorial

El blog se alimenta de Strapi con los endpoints posts, category-blogs y global.

Las rutas de listado tienen paginacion de 9 posts por pagina:

- /blog y /blog/2.
- /[lang]/blog y /[lang]/blog/2.

Las categorias usan:

- /blog/[category].
- /blog/[category]/2.
- /[lang]/blog/[category].
- /[lang]/blog/[category]/2.

Las fichas usan /blog/[slug] y /[lang]/blog/[slug].

El listado incluye post destacado en la primera pagina, grid de posts, aside con categorias, conteos, redes sociales, paginacion y estado vacio localizado.

El detalle del post incluye imagen responsive, categorias, fecha, tabla de contenidos generada desde H2, rich text, videos de YouTube, galerias, CTA de contacto, posts relacionados y schema de articulo.

El modelo Blog necesita documentId, titulo, slug, contenido, portadaImage, category_blogs, publishedAt y SEO. Las categorias tambien se traducen y se relacionan por documentId.

## 6. Paginas MDX disponibles

Las paginas locales se cargan desde src/content/pages y estan organizadas por idioma.

Ingles:

- about-us, complaints-book, esnna-code, gender-equality.
- lgbt-friendly, machupicchu-circuits, our-clients.
- payment-methods, plan-your-trip, privacy-policy.
- terms-and-conditions.

Espanol:

- sobre-nosotros, libro-reclamaciones, codigo-esnna.
- igualdad-genero, gay-friendly, circuitos-machupicchu.
- nuestros-clientes, metodos-pago, planea-tu-viaje.
- politicas-privacidad, terminos-condiciones.

Portugues:

- sobre-nos, livro-de-reclamacoes, codigo-esnna.
- igualdade-de-genero, gay-friendly, circuitos-machupicchu.
- nossos-clientes, metodos-de-pagamento, planeje-sua-viagem.
- politicas-de-privacidade, termos-e-condicoes.

El frontmatter valido admite title, description, lang, heroImage, heroImageAlt, slugs y seo. El schema de Astro valida que lang sea en, es o pt.

## 7. Guia de circuitos de Machu Picchu

La pagina machupicchu-circuits es un componente local implementado en MachupicchuCircuitsInteractive.astro, con traducciones en src/data/machupicchuCircuitsContent.ts.

Incluye:

- Aviso sobre los circuitos oficiales.
- Circuito 1: Panoramico.
- Circuito 2: Machupicchu Clasico.
- Circuito 3: Machupicchu Realeza.
- Diez rutas oficiales: 1-A, 1-B, 1-C, 1-D, 2-A, 2-B, 3-A, 3-B, 3-C y 3-D.
- Mapas de circuito y mapas de cada ruta.
- Dialogos accesibles para ampliar mapas.
- Duracion, dificultad, altitud, disponibilidad y perfil recomendado.
- Tabla comparativa, recomendaciones de reserva y CTA de planificacion.

Los assets estan en public/imagenes/circuitos. Al sustituir una imagen se debe actualizar el diccionario del componente y mantener alt, dimensiones y caption.

## 8. Disponibilidad del Camino Inca

La pagina especial se renderiza en tres idiomas y contiene:

- Introduccion sobre permisos y regulaciones.
- Estadisticas de permisos, reserva anticipada y cierre anual.
- Requisitos y recomendaciones.
- Calendario de disponibilidad.
- Selector de ruta y navegacion mensual.
- Seleccion de fechas consecutivas segun duracion.
- Selector de pasajeros limitado por cupos.
- Cards de tours de la categoria Camino Inca.
- Informacion de pago y CTA de reserva.

El servidor obtiene tours de Strapi, filtra categorias cuyos slug o nombre coinciden con aliases de Camino Inca y elimina duplicados localizados. Solo el primer tour configurado para cada ruta se usa como producto reservable.

El ano publico esta fijado actualmente en 2026. Para cambiar de temporada:

1. Actualizar calendarYear en IncaTrailAvailabilityPage.astro.
2. Revisar textos SEO y copys de los tres idiomas.
3. Verificar permisos del endpoint externo.
4. Actualizar las pruebas E2E dependientes del ano.
5. Revisar public/llms.txt si cambia la pagina publica.

## 9. Checkout y flujo de pago

El flujo del cliente es:

1. Selecciona un tour, fecha y pasajeros.
2. El frontend guarda bookingCart y lastBookingTourPath.
3. Abre /checkout en el idioma correspondiente.
4. Completa la informacion de cada pasajero.
5. Completa los datos de contacto.
6. Acepta terminos y selecciona pago minimo o total.
7. El frontend envia el payload a POST /api/checkout.
8. El servidor consulta el precio oficial del tour en Strapi.
9. Se envia una notificacion por Resend si esta configurado.
10. Se devuelve una URL de PayPal.
11. Se redirige a la pagina de exito localizada.

El servidor no confia en el precio enviado por el navegador. Consulta documentId, titulo y priceTour en Strapi y recalcula el total.

Validaciones relevantes:

- tourId alfanumerico con guion o guion bajo, hasta 100 caracteres.
- Entre 1 y 20 pasajeros.
- passengersInfo debe coincidir con la cantidad declarada.
- Cada pasajero requiere nombre, apellido, fecha de nacimiento y documento.
- El email debe tener formato valido.
- amountToPayLabel solo admite minimum o total.
- El body maximo es 64 KiB.
- La consulta a Strapi tiene timeout de 8 segundos.
- El recargo PayPal actual es del 8%.
- El pago minimo se calcula sobre el 50% y luego aplica el recargo.

Payload conceptual:

    {
      passengersInfo: [{ name, lastname, gender, dob, country,
        documentType, documentNumber }],
      contactInfo: { firstname, lastname, email, phoneCode, phone },
      cart: { tourId, date, passengers, amountToPayLabel, lang }
    }

## 10. Formularios comerciales

### Planifica tu viaje

POST /api/planea-tu-viaje recibe nombres, pais, email, telefono, codigoPais, adultos, menores, fechaViaje, idioma, categoriaHotel, destinos, mensaje y tourName.

Son requeridos nombres, pais y un email valido. El endpoint acepta JSON y formularios HTML. Sin RESEND_API_KEY registra una simulacion en el servidor.

### Libro de reclamaciones

POST /api/libro-reclamaciones recibe nombres, pais, ciudad, documento, email, telefono, menorEdad, datosApoderado, tipo y detalle.

tipo se normaliza a reclamo o queja. Son obligatorios los datos de identidad, contacto, tipo y detalle.

## 11. Contratos de Strapi

### Home

Endpoint: home. Single type con hero, about, certificaciones, bloques de categorias, post destacado y SEO.

### Global

Endpoint: global. Contiene menu, header, top bar, footer, enlaces sociales, logos y configuracion compartida. Si se cambia un enlace global, revisar los tres idiomas.

### Tours

Endpoint: tours. Se usa para listados por categoria, paginas de tour, relacionados, checkout y Camino Inca. Requiere relaciones de imagenes, badges, categorias, tabs, mapas y SEO.

### Paginas

Endpoint: pages. Se usa para destinos y contenido dinamico que no vive en MDX. Las categorias permiten asociar paginas a listas de tours.

### Posts y categorias

Endpoints: posts y category-blogs. Los posts se ordenan por publishedAt descendente. Las categorias se usan para filtros, conteos, slugs y relacionados.

Las imagenes deben resolverse mediante src/lib/helpers.ts, que proporciona URL, texto alternativo, srcset y thumbnails.

## 12. Internacionalizacion

La regla de URL es:

    en: /
    es: /es
    pt: /pt

Para contenido:

    en: /about-us
    es: /es/sobre-nosotros
    pt: /pt/sobre-nos

Para cambiar de idioma se usa el slugMap del documento o categoria. No se debe traducir una URL reemplazando solo el prefijo.

Funciones principales:

- isValidLang: valida idiomas.
- localizePath: aplica el prefijo.
- stripLangPrefix: elimina el prefijo.
- rewriteUrl: localiza enlaces internos.
- translatePathForSlug: sustituye slugs.
- collapseRepeatedBlogPath: corrige segmentos blog repetidos.

## 13. SEO y descubrimiento

Cada pagina debe tener titulo, descripcion, canonical, imagen Open Graph y mapa de versiones traducidas cuando exista.

Schemas implementados:

- Paginas estaticas.
- FAQ.
- Indices de blog.
- Articulos.
- Colecciones.
- Tours y productos.

Archivos publicos:

- public/robots.txt: crawlers y sitemap.
- public/llms.txt: inventario semantico de paginas y servicios.
- Sitemap generado por @astrojs/sitemap.
- public/_redirects: backlinks y redirecciones 301.
- public/dreamy-tours-web-og.jpg: imagen OG por defecto.

Al agregar una pagina publica se debe revisar llms.txt, sitemap, SEO y traducciones.

## 14. Assets visuales

- public/imagenes: imagenes servidas directamente.
- src/assets: imagenes importadas y optimizadas.
- src/assets/certification: certificaciones.
- src/assets/svg/about: iconos institucionales.
- src/assets/svg/logos: metodos de pago.
- public/imagenes/circuitos: mapas de Machu Picchu.
- public/logo-dreamytours.svg: logo.
- public/fondo.svg: fondo del blog.

Las imagenes principales deben tener alt, dimensiones estables y variantes responsive cuando el componente lo soporte.

## 15. Pruebas y criterios de aceptacion

Pruebas unitarias:

- src/lib/i18n.test.ts: normalizacion y reglas de URLs.

Pruebas E2E:

- tests/checkout-focus.spec.ts: foco durante la escritura del checkout.
- tests/inca-trail-booking-security.spec.ts: calendario, rutas, carrito, disponibilidad, formularios y seguridad del checkout.

Las pruebas E2E usan Chromium, base URL http://127.0.0.1:4322 y un servidor Astro en el puerto 4322. El calendario se intercepta para que las pruebas sean deterministas.

## 16. Mantenimiento

### Agregar una pagina MDX

1. Crear el archivo en src/content/pages/{lang}.
2. Usar frontmatter valido.
3. Definir slugs para los idiomas.
4. Revisar SEO, hero y enlaces.
5. Actualizar llms.txt si corresponde.
6. Ejecutar check y build.

### Agregar un tour

1. Crear el tour en el idioma principal.
2. Crear traducciones con el mismo documentId.
3. Definir slug, imagen, categoria, precio y SEO.
4. Completar tabs y mapas.
5. Registrar el slug en incaTrailBooking.ts si es Camino Inca.
6. Probar ficha, reserva y checkout.

### Agregar categoria de blog

1. Crear la categoria por idioma.
2. Mantener documentId compartido.
3. Traducir nombre, slug, descripcion e imagen.
4. Asociar posts publicados.
5. Revisar listados en los tres idiomas.

### Cambiar enlaces globales

1. Modificar global en Strapi.
2. Confirmar si el enlace es interno o externo.
3. Verificar el selector de idioma.
4. Revisar header, menu, top bar y footer en desktop y movil.

## 17. Problemas frecuentes

### Strapi no muestra contenido

Revisar VITE_STRAPI_URL, endpoint, locale, estado publicado, populate y formato data.

### La traduccion abre una ruta incorrecta

Revisar documentId, slugMap y slug publicado en el idioma destino.

### El calendario no carga

Revisar /api/calendar-tickets, proxy de Vite, endpoint externo y parametros place, road, year y month.

### Checkout rechazado

Revisar tourId, cantidad de pasajeros, datos de identidad, email, amountToPayLabel, precio de Strapi y URL del CMS.

### Email no llega

Revisar RESEND_API_KEY, remitente verificado, destinatarios, logs y si el formulario esta en modo simulacion.
