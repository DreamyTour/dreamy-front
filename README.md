# Dreamy Tours Frontend

Sitio web de Dreamy Tours construido con Astro, React y Tailwind CSS. El proyecto publica paginas informativas, blog, tours, checkout, formularios comerciales y contenido multidioma consumido desde Strapi.

## Tabla de contenidos

- [Stack principal](#stack-principal)
- [Requisitos](#requisitos)
- [Instalacion](#instalacion)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Rutas principales](#rutas-principales)
- [Contenido y CMS](#contenido-y-cms)
- [Internacionalizacion](#internacionalizacion)
- [APIs internas](#apis-internas)
- [Estilos y componentes UI](#estilos-y-componentes-ui)
- [SEO, sitemap y accesibilidad](#seo-sitemap-y-accesibilidad)
- [Build y despliegue](#build-y-despliegue)
- [Notas de desarrollo](#notas-de-desarrollo)

## Stack principal

- Astro 6 con renderizado estatico y endpoints server-side.
- React 19 para componentes interactivos.
- Tailwind CSS v4 con variables de tema en `src/styles/global.css`.
- MDX para paginas de contenido editorial.
- Strapi como CMS remoto.
- Cloudflare adapter para produccion.
- Resend para envio de correos desde formularios.
- Biome y Prettier para formato y revision de codigo.
- shadcn/ui, Base UI, Radix UI y Lucide para componentes e iconos.

## Requisitos

- Node.js `>=22 <24`.
- Bun para instalar dependencias y ejecutar scripts.
- Acceso al CMS configurado en `VITE_STRAPI_URL`.

El repositorio usa `bun.lock` como unico lockfile. No uses otros gestores de paquetes para instalar dependencias.

## Instalacion

```sh
bun install
```

Levantar el entorno local:

```sh
bun run dev
```

Por defecto Astro inicia en `http://localhost:4321`.

## Variables de entorno

Crea o actualiza el archivo `.env` en la raiz del proyecto.

```env
VITE_STRAPI_URL=
RESEND_API_KEY=
```

Variables usadas:

- `VITE_STRAPI_URL`: URL base del CMS Strapi. Es obligatoria para cargar home, tours, blog, menus, footer y datos globales.
- `RESEND_API_KEY`: API key opcional para enviar correos reales desde los formularios. Si no existe, algunos endpoints funcionan en modo simulacion.

No subas valores privados de produccion al repositorio.

## Scripts disponibles

```sh
bun run dev
```

Inicia el servidor de desarrollo de Astro.

```sh
bun run build
```

Genera el build de produccion.

```sh
bun run preview
```

Sirve localmente el build generado.

```sh
bun run lint
```

Ejecuta `biome check .`.

```sh
bun run format
```

Formatea el proyecto con Biome y los archivos Astro con Prettier.

```sh
bun run format:check
```

Verifica formato con Biome sin escribir cambios.

## Estructura del proyecto

```txt
src/
  assets/              Imagenes y SVG importados desde el codigo
  components/
    checkout/          Componentes del flujo de reserva
    content/           Componentes usados dentro de paginas MDX
    icons/             Iconos propios del proyecto
    layout/            Header, footer, SEO, menu y elementos globales
    sections/          Secciones de la home
    tours/             Componentes de paginas de tours
    ui/                Componentes reutilizables de UI
  content/pages/       Paginas MDX por idioma
  data/                Datos estaticos locales
  i18n/                Textos UI traducidos
  layouts/             Layouts base para paginas, tours y contenido
  lib/                 Helpers, SEO, Strapi, i18n y utilidades
  pages/               Rutas Astro y endpoints API
  styles/              CSS global y tokens visuales
  types/               Tipos TypeScript del CMS y entidades

public/
  imagenes/            Assets publicos servidos directamente
  favicon.*            Favicons
  robots.txt           Robots
  dreamy-tours-web-og.jpg
```

## Rutas principales

- `/`: home en idioma por defecto.
- `/es` y `/pt`: homes localizadas.
- `/[slug]`: paginas MDX del idioma por defecto.
- `/[lang]/[slug]`: paginas MDX localizadas.
- `/blog/[...page]`: listado del blog.
- `/blog/[slug]`: detalle de articulo.
- `/blog/[category]/[...page]`: blog filtrado por categoria.
- `/[lang]/blog/...`: versiones localizadas del blog.
- `/checkout`: pagina de checkout.
- `/[lang]/checkout`: checkout localizado.
- `/404`: pagina de error.

El idioma por defecto es `en`. El middleware redirige `/en/...` a la ruta sin prefijo para evitar duplicados.

## Contenido y CMS

La integracion con Strapi esta centralizada en `src/lib/strapi.ts`.

Funciones importantes:

- `fetchApi`: hace requests al CMS y soporta `locale`, `query`, `wrappedByKey` y cache por URL durante la ejecucion.
- `fetchAllStrapi`: pagina automaticamente endpoints de Strapi con lotes de hasta 100 elementos.

Datos principales consumidos:

- `home`: contenido de la pagina principal.
- `global`: menu, top bar, footer y datos compartidos.
- `tours`: paquetes y tours por categoria.
- Blog y paginas dinamicas segun las rutas de `src/pages`.

Las paginas editoriales viven en `src/content/pages` y usan colecciones de Astro definidas en `src/content.config.ts`.

Frontmatter esperado en paginas MDX:

```yaml
title: "Titulo de la pagina"
description: "Descripcion corta"
lang: "es"
heroImage: "/imagenes/ejemplo.avif"
heroImageAlt: "Descripcion de la imagen"
slugs:
  en: "about-us"
  es: "sobre-nosotros"
  pt: "sobre-nos"
seo:
  metaTitle: "Titulo SEO"
  metaDescription: "Descripcion SEO"
  metaImage: "/dreamy-tours-web-og.jpg"
  keywords: "peru, bolivia, tours"
```

Idiomas validos para contenido: `en`, `es`, `pt`.

## Internacionalizacion

La configuracion base esta en `src/lib/i18n.ts`.

- Idiomas soportados: `en`, `es`, `pt`.
- Idioma por defecto: `en`.
- `localizePath` agrega prefijo solo cuando el idioma no es el default.
- `stripLangPrefix` elimina prefijos de idioma.
- `rewriteUrl` adapta URLs internas al idioma activo.

Los textos cortos de interfaz estan en `src/i18n/ui.ts` y se consumen con `useTranslations(lang)`.

## APIs internas

Endpoints ubicados en `src/pages/api`:

- `POST /api/checkout`: valida datos del checkout, envia email con Resend si esta configurado y devuelve una URL de pago PayPal.
- `POST /api/planea-tu-viaje`: recibe solicitudes del formulario "Planea tu viaje" y envia email a `info@dreamy.tours`.
- `POST /api/libro-reclamaciones`: recibe reclamos o quejas y envia email a `info@dreamy.tours`.
- `GET /api/calendar-tickets`: proxy hacia `https://calendar.dreamy.tours/v1/tickets`.

En desarrollo, `astro.config.mjs` tambien configura un proxy Vite para `/api/calendar-tickets`.

## Estilos y componentes UI

Los estilos globales estan en `src/styles/global.css`.

Puntos clave:

- Tailwind CSS v4 se importa con `@import "tailwindcss"`.
- El tema usa variables CSS: `--primary`, `--secondary`, `--background`, `--foreground`, `--border`, entre otras.
- El radio base del proyecto es `--radius: 0.75rem`.
- La fuente principal es Outfit mediante `@fontsource-variable/outfit` y `astro:assets`.
- Hay estilos centralizados para contenido MDX con la clase `.mdx-text`.
- shadcn/ui esta configurado en `components.json` con estilo `new-york`, iconos Lucide y aliases `@/components`, `@/lib`, `@/components/ui`.

Aliases TypeScript:

```ts
"@/*": ["./src/*"]
```

## SEO, sitemap y accesibilidad

- `src/lib/seo.ts` construye props SEO reutilizables con fallbacks.
- `src/components/layout/SEO.astro` centraliza etiquetas SEO.
- `@astrojs/sitemap` genera sitemap con `changefreq: "weekly"` y excluye `/404`.
- Imagen OG por defecto: `/dreamy-tours-web-og.jpg`.
- El layout principal incluye skip link para accesibilidad.
- `global.css` define estilos de foco visibles y soporte para `prefers-reduced-motion`.
- `public/robots.txt` controla reglas de rastreo.

## Build y despliegue

Build local:

```sh
bun run build
```

Preview:

```sh
bun run preview
```

En produccion, `astro.config.mjs` activa el adapter de Cloudflare cuando `NODE_ENV === "production"`.

El sitio esta configurado con:

```js
site: "https://dreamy.tours"
```

Para Cloudflare, revisa tambien:

- `_routes.json`: incluye todas las rutas.
- `.wrangler/`: archivos locales generados por Wrangler.
- Dependencias `@astrojs/cloudflare`, `wrangler` y `miniflare`.

## Notas de desarrollo

- Mantener componentes Astro para contenido principalmente estatico.
- Usar React solo en componentes que necesitan interactividad de cliente.
- Centralizar llamadas al CMS en `src/lib/strapi.ts` o helpers de `src/lib`.
- Usar los tipos de `src/types` al consumir datos de Strapi.
- Para nuevas paginas legales o informativas, preferir MDX dentro de `src/content/pages/{lang}`.
- Para textos breves de UI, agregar claves en `src/i18n/ui.ts`.
- Para estilos compartidos, preferir variables del tema antes que colores sueltos.
- Antes de entregar cambios importantes, ejecutar:

```sh
bun run lint
bun run build
```
