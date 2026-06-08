# Guia practica: Astro + Strapi + i18n con URLs traducidas

Esta guia resume como esta estructurado el proyecto actual para consumir Strapi desde Astro, generar rutas estaticas, manejar contenido en varios idiomas y evitar el error mas comun: asumir que una traduccion usa el mismo slug en todos los idiomas.

El objetivo es que sirva como tutorial base para futuros proyectos con Astro + Strapi.

## 1. Principio clave

Nunca traduzcas una URL cambiando solo el prefijo del idioma.

Incorrecto:

```txt
/pt/blog/peru/ -> /es/blog/peru/
```

Correcto:

```txt
/pt/blog/peru/ -> /es/blog/viajar-a-peru/
/pt/blog/peru/ -> /blog/travel-peru/
```

En Strapi, cada traduccion puede tener un `slug` distinto. La relacion real entre idiomas debe salir de `documentId`, no del texto del slug.

## 2. Modelo mental del proyecto

El proyecto maneja cuatro tipos principales de rutas:

```txt
Tours:
/inca-trail-4-days/
/es/camino-inca-4-dias/
/pt/trilha-inca-4-dias/

Pages:
/cusco/
/es/cusco/
/pt/cusco/

Blog posts:
/blog/best-time-to-visit-peru/
/es/blog/cuando-viajar-peru/
/pt/blog/melhor-epoca-para-viajar-ao-peru/

Blog categories:
/blog/travel-peru/
/es/blog/viajar-a-peru/
/pt/blog/peru/
```

El idioma por defecto es `en`, definido en `src/lib/i18n.ts`:

```ts
export const LANGS = ["en", "es", "pt"] as const;
export const DEFAULT_LANG = "en";
```

Regla de URLs:

```txt
en: sin prefijo
es: /es/...
pt: /pt/...
```

## 3. Consumo de Strapi

El helper principal esta en `src/lib/strapi.ts`.

### fetchApi

Usalo para una consulta normal:

```ts
const homeData = await fetchApi<Home>({
  endpoint: "home",
  wrappedByKey: "data",
  locale: lang,
});
```

Parametros importantes:

```ts
endpoint: "posts" | "tours" | "pages" | "category-blogs";
locale: "en" | "es" | "pt";
wrappedByKey: "data";
query: Record<string, unknown>;
```

El helper agrega `locale` como query param:

```txt
/api/posts?locale=es
```

### fetchAllStrapi

Usalo en `getStaticPaths` cuando necesitas traer todos los registros de una coleccion, sin depender del limite de paginacion:

```ts
const tours = await fetchAllStrapi<Tour>({
  endpoint: "tours",
  locale: lang,
});
```

Internamente usa:

```txt
pagination[page]=1
pagination[pageSize]=100
```

y luego trae las paginas restantes.

## 4. Tipos de contenido recomendados en Strapi

### Tour

Campos minimos:

```ts
interface Tour {
  id: number;
  documentId: string;
  titulo: string;
  slug: string;
  content: StrapiBlock[];
  imagenDestacada: Imagen[];
  categories: Category[];
  seo?: SEO;
}
```

Buenas practicas:

- `documentId` debe ser el mismo grupo de traduccion entre idiomas.
- `slug` puede y debe traducirse por idioma.
- `categories` deben estar pobladas si se usan para relacionados.
- `seo` debe existir por idioma cuando sea posible.

### Page

Campos minimos:

```ts
interface Page {
  id: number;
  documentId: string;
  titulo: string;
  slug: string;
  content?: string;
  categories?: Category[];
  seo?: SEO;
}
```

Uso tipico:

- Paginas tipo destino: `/cusco`, `/lima`, `/puno`.
- Paginas institucionales: `/about-us`, `/payment-methods`.
- Paginas con video o contenido desde Strapi.

### Blog post

Campos minimos:

```ts
interface Blog {
  id: number;
  documentId: string;
  titulo: string;
  slug: string;
  contenido: string | StrapiBlock[];
  portadaImage: Imagen;
  category_blogs: CategoryBlog[];
  seo?: SEO;
  publishedAt?: string;
}
```

### Blog category

Campos minimos:

```ts
interface CategoryBlog {
  id: number;
  documentId: string;
  nombre: string;
  slug: string;
  descripcion?: string;
  imagenDestacada: Imagen;
  seo?: SEO;
}
```

Punto critico: las categorias de blog tambien son contenido traducible. Tambien necesitan `documentId` y `slugMap`.

## 5. La regla de oro: construir slugMap por documentId

El `slugMap` debe tener esta forma:

```ts
{
  en: "travel-peru",
  es: "viajar-a-peru",
  pt: "peru"
}
```

No se construye desde el path actual. Se construye agrupando registros por `documentId`.

Ejemplo generico:

```ts
const slugsByDocId: Record<string, Record<string, string>> = {};

for (const lang of LANGS) {
  for (const item of itemsByLang[lang]) {
    if (!slugsByDocId[item.documentId]) {
      slugsByDocId[item.documentId] = {};
    }

    slugsByDocId[item.documentId][lang] = item.slug;
  }
}
```

Luego, al generar una pagina:

```ts
props: {
  item,
  slugMap: slugsByDocId[item.documentId] ?? {},
}
```

## 6. Rutas Astro para idioma por defecto y localizadas

El proyecto usa dos familias de rutas:

```txt
src/pages/[slug].astro
src/pages/[lang]/[slug].astro

src/pages/blog/[slug].astro
src/pages/[lang]/blog/[slug].astro

src/pages/blog/[category]/[...page].astro
src/pages/[lang]/blog/[category]/[...page].astro
```

### Idioma por defecto

Para `en`, la URL canonica no lleva prefijo:

```txt
/cusco
/blog/travel-peru
/blog/best-time-to-visit-peru
```

En rutas default se generan principalmente entradas `DEFAULT_LANG`.

### Idiomas con prefijo

Para `es` y `pt`, las rutas van con prefijo:

```txt
/es/cusco
/pt/cusco
/es/blog/viajar-a-peru
/pt/blog/peru
```

En rutas con `[lang]`, valida siempre el idioma:

```ts
const routeParams = Astro.params as { lang?: string };
const lang = isValidLang(routeParams.lang) ? routeParams.lang : DEFAULT_LANG;
```

## 7. Como se genera un tour

Flujo recomendado:

1. Traer tours por idioma.
2. Crear `slugsByDocId`.
3. Generar rutas del idioma default en `src/pages/[slug].astro`.
4. Generar rutas localizadas en `src/pages/[lang]/[slug].astro`.
5. Pasar `slugMap` a SEO, layout y switcher.

Ejemplo reducido:

```ts
const allToursByLang: Record<string, Tour[]> = {};

for (const lang of LANGS) {
  const tours = await fetchAllStrapi<Tour>({
    endpoint: "tours",
    locale: lang,
  });

  allToursByLang[lang] = dedupeLocalizedDocuments(tours);
}

const slugsByDocId: Record<string, Record<string, string>> = {};

for (const lang of LANGS) {
  for (const tour of allToursByLang[lang]) {
    slugsByDocId[tour.documentId] ??= {};
    slugsByDocId[tour.documentId][lang] = tour.slug;
  }
}

for (const tour of allToursByLang[DEFAULT_LANG]) {
  paths.push({
    params: { slug: tour.slug },
    props: {
      type: "tour",
      tour,
      slugMap: slugsByDocId[tour.documentId] ?? {},
    },
  });
}
```

En el render:

```astro
<TourLayout seo={seoProps} slugMap={slugMap} lang={lang}> ... </TourLayout>
```

Y para SEO:

```ts
seoProps = buildSEOProps({
  seo: tour.seo,
  fallbackTitle: tour.titulo,
  fallbackDescription: generateDescription(tour.content),
  type: "article",
  lang,
  slugMap,
});
```

## 8. Como se genera una page

Las pages usan `pageSlugMap` para distinguirlas de tours:

```ts
const pageSlugsByDocId: Record<string, Record<string, string>> = {};

for (const lang of LANGS) {
  for (const page of allPagesByLang[lang]) {
    pageSlugsByDocId[page.documentId] ??= {};
    pageSlugsByDocId[page.documentId][lang] = page.slug;
  }
}
```

Al renderizar:

```astro
<script
  is:inline
  id="page-slug-map"
  type="application/json"
  set:html={serializeJsonForHtml(pageSlugMap || {})}
/>
```

Ese script es lo que usa el `LanguageSwitcher` para saber a que URL ir cuando el usuario cambia idioma.

Ejemplo:

```json
{
  "en": "about-us",
  "es": "sobre-nosotros",
  "pt": "sobre-nos"
}
```

## 9. Como se genera un blog post

Los posts tienen ruta especial:

```txt
/blog/[slug]
/[lang]/blog/[slug]
```

El slug traducido debe reemplazar solo el segmento despues de `/blog/`.

Ejemplo:

```txt
/pt/blog/melhor-epoca-para-viajar-ao-peru
-> /es/blog/cuando-viajar-peru
```

En el HTML se imprime:

```astro
<script
  is:inline
  id="blog-slug-map"
  type="application/json"
  set:html={serializeJsonForHtml(slugMap)}
/>
```

Ejemplo de `slugMap`:

```json
{
  "en": "best-time-to-visit-peru",
  "es": "cuando-viajar-peru",
  "pt": "melhor-epoca-para-viajar-ao-peru"
}
```

## 10. Como se genera una categoria de blog

Este fue el problema que encontramos.

Las categorias de blog ya tenian su `slugMap` calculado, pero no estaba expuesto al `LanguageSwitcher`. Entonces el switcher caia al fallback:

```txt
/pt/blog/peru -> /es/blog/peru
```

Eso es incorrecto cuando la categoria traducida es:

```txt
en: travel-peru
es: viajar-a-peru
pt: peru
```

La solucion es exactamente igual que en posts:

```astro
<script
  is:inline
  id="blog-slug-map"
  type="application/json"
  set:html={serializeJsonForHtml(slugMap)}
/>
```

Debe estar en:

```txt
src/pages/blog/[category]/[...page].astro
src/pages/[lang]/blog/[category]/[...page].astro
```

Con eso:

```txt
/pt/blog/peru/ -> /es/blog/viajar-a-peru/
/pt/blog/peru/ -> /blog/travel-peru/
```

## 11. LanguageSwitcher: como decide la URL correcta

El `LanguageSwitcher` vive en:

```txt
src/components/LanguageSwitcher.tsx
```

Orden de resolucion:

1. Buscar `tour-slug-map`.
2. Buscar `page-slug-map`.
3. Buscar `blog-slug-map`.
4. Si no hay mapa, usar fallback con el mismo path y solo cambiar prefijo de idioma.

Pseudo flujo:

```ts
const normalizedPath = stripLangPrefix(window.location.pathname);

const slugMapIds = ["tour-slug-map", "page-slug-map"];

for (const id of slugMapIds) {
  const slugMap = readJsonScript(id);
  const targetSlug = slugMap[nextLang];
  if (targetSlug) return localizePath(`/${targetSlug}`, nextLang);
}

const blogSlugMap = readJsonScript("blog-slug-map");
if (blogSlugMap?.[nextLang]) {
  const blogPath = translatePathForSlug(normalizedPath, blogSlugMap[nextLang]);
  return localizePath(blogPath, nextLang);
}

return localizePath(normalizedPath, nextLang);
```

Importante: para blog no puedes hacer `/${targetSlug}` porque necesitas preservar `/blog/`.

Correcto:

```ts
translatePathForSlug("/blog/travel-peru", "viajar-a-peru");
// "/blog/viajar-a-peru"
```

## 12. Helpers i18n importantes

### localizePath

Agrega o quita prefijo segun idioma:

```ts
localizePath("/blog/travel-peru", "en");
// "/blog/travel-peru"

localizePath("/blog/travel-peru", "es");
// "/es/blog/travel-peru"
```

### stripLangPrefix

Quita `/es` o `/pt`:

```ts
stripLangPrefix("/pt/blog/peru");
// "/blog/peru"
```

### translatePathForSlug

Reemplaza el slug final, respetando rutas de blog:

```ts
translatePathForSlug("/blog/peru", "viajar-a-peru");
// "/blog/viajar-a-peru"

translatePathForSlug("/cusco", "sobre-nosotros");
// "/sobre-nosotros"
```

## 13. SEO y hreflang

SEO se arma con:

```ts
buildSEOProps({
  seo,
  fallbackTitle,
  fallbackDescription,
  type,
  lang,
  slugMap,
});
```

Luego `SEO.astro` usa `slugMap` para generar alternates:

```html
<link
  rel="alternate"
  hreflang="en"
  href="https://dreamy.tours/blog/travel-peru/"
/>
<link
  rel="alternate"
  hreflang="es"
  href="https://dreamy.tours/es/blog/viajar-a-peru/"
/>
<link rel="alternate" hreflang="pt" href="https://dreamy.tours/pt/blog/peru/" />
<link
  rel="alternate"
  hreflang="x-default"
  href="https://dreamy.tours/blog/travel-peru/"
/>
```

Checklist SEO:

- Pasar `lang` correcto a `buildSEOProps`.
- Pasar `slugMap` correcto.
- No hardcodear canonical si no es necesario.
- Verificar `Astro.site` en `astro.config`.
- En rutas paginadas, ajustar title con `Page 2`, `Pagina 2`, etc.

## 14. Menus y enlaces internos

Los menus de Strapi pueden venir con URLs sin prefijo:

```txt
/cusco
/blog
/plan-your-trip
```

Antes de renderizar, se deben reescribir segun idioma con:

```ts
rewriteUrl(url, currentLang);
```

Ejemplo:

```ts
rewriteUrl("/cusco", "pt");
// "/pt/cusco"
```

Pero cuidado: `rewriteUrl` solo agrega prefijo. No traduce slugs. Para contenido traducible usa `slugMap`.

## 15. Relacion entre categorias de tours y pages

En este proyecto, algunas pages de destino muestran tours por categoria.

Ejemplo:

```ts
const pageDestinationCategory =
  page?.categories?.find((c) => c.slug !== "peru-tours") ??
  (page?.slug ? { slug: page.slug, nombre: page.titulo } : undefined);

const toursByCategory = allToursByLang[lang].filter((tour) =>
  tour.categories?.some(
    (category) => category.slug === pageDestinationCategory.slug,
  ),
);
```

Buenas practicas:

- Las categorias usadas para relacionar tours deben existir en el mismo idioma.
- No compares categorias traducidas entre idiomas por `slug`.
- Si necesitas relacionar categorias entre idiomas, usa `documentId`.
- Si una page usa una categoria, asegurate de que Strapi la devuelva poblada.

## 16. Estructura recomendada para un proyecto nuevo

```txt
src/
  lib/
    strapi.ts
    i18n.ts
    seo.ts
    html.ts
    utils.ts
  types/
    common.ts
    tours.ts
    page.ts
    blog.ts
  components/
    LanguageSwitcher.tsx
    layout/
      SEO.astro
      Header.astro
      Footer.astro
  pages/
    index.astro
    [slug].astro
    [lang]/
      index.astro
      [slug].astro
      blog/
        [slug].astro
        [category]/
          [...page].astro
    blog/
      [...page].astro
      [slug].astro
      [category]/
        [...page].astro
```

## 17. Checklist para agregar un nuevo tipo traducible

Supongamos que agregas `destinations`.

1. Crear tipo TypeScript:

```ts
interface Destination {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  seo?: SEO;
}
```

2. Traer data por idioma:

```ts
const destinationsByLang: Record<string, Destination[]> = {};

for (const lang of LANGS) {
  destinationsByLang[lang] = await fetchAllStrapi<Destination>({
    endpoint: "destinations",
    locale: lang,
  });
}
```

3. Construir slugMap por `documentId`:

```ts
const destinationSlugsByDocId: Record<string, Record<string, string>> = {};

for (const lang of LANGS) {
  for (const destination of destinationsByLang[lang]) {
    destinationSlugsByDocId[destination.documentId] ??= {};
    destinationSlugsByDocId[destination.documentId][lang] = destination.slug;
  }
}
```

4. Pasar `slugMap` a props:

```ts
props: {
  destination,
  slugMap: destinationSlugsByDocId[destination.documentId] ?? {},
}
```

5. Exponer script para el switcher:

```astro
<script
  is:inline
  id="destination-slug-map"
  type="application/json"
  set:html={serializeJsonForHtml(slugMap)}
/>
```

6. Actualizar `LanguageSwitcher` para leer ese nuevo mapa.

7. Pasar `slugMap` a `buildSEOProps`.

8. Verificar con build:

```sh
bun run build
```

## 18. Checklist para evitar errores de idioma

Antes de terminar una ruta nueva, validar:

- La entrada de Strapi tiene `documentId`.
- Todas las traducciones estan publicadas.
- Cada idioma tiene su propio `slug`.
- Se construye `slugMap` agrupando por `documentId`.
- Se pasa `slugMap` a `buildSEOProps`.
- Se imprime un script JSON para el `LanguageSwitcher`.
- El `id` del script coincide con lo que lee el switcher.
- Las rutas de blog usan `translatePathForSlug`, no `/${slug}`.
- La ruta default no agrega `/en`.
- Las rutas `es` y `pt` agregan prefijo.
- `hreflang` apunta a las URLs traducidas reales.
- El menu usa `rewriteUrl` solo para enlaces generales, no para traducir contenido.

## 19. Pruebas manuales recomendadas

### Categoria de blog

Abrir:

```txt
/pt/blog/peru/
```

Cambiar a Espanol. Debe ir a:

```txt
/es/blog/viajar-a-peru/
```

Cambiar a English. Debe ir a:

```txt
/blog/travel-peru/
```

### Blog post

Abrir:

```txt
/pt/blog/melhor-epoca-para-viajar-ao-peru/
```

Cambiar a English. Debe ir al slug ingles real, no al slug portugues con prefijo cambiado.

### Tour

Abrir:

```txt
/es/camino-inca-4-dias/
```

Cambiar a English. Debe ir a:

```txt
/inca-trail-4-days/
```

### Page

Abrir:

```txt
/pt/sobre-nos/
```

Cambiar a Espanol. Debe ir a:

```txt
/es/sobre-nosotros/
```

## 20. Pruebas tecnicas recomendadas

Agregar tests para helpers:

```ts
expect(localizePath("/blog/travel-peru", "pt")).toBe("/pt/blog/travel-peru");
expect(stripLangPrefix("/pt/blog/peru")).toBe("/blog/peru");
expect(translatePathForSlug("/blog/peru", "viajar-a-peru")).toBe(
  "/blog/viajar-a-peru",
);
```

Validar HTML generado:

```sh
bun run build
```

Luego inspeccionar:

```txt
dist/client/pt/blog/peru/index.html
```

Debe contener:

```html
<script id="blog-slug-map" type="application/json">
  { "en": "travel-peru", "es": "viajar-a-peru", "pt": "peru" }
</script>
```

Y en `<head>`:

```html
<link
  rel="alternate"
  hreflang="en"
  href="https://dreamy.tours/blog/travel-peru/"
/>
<link
  rel="alternate"
  hreflang="es"
  href="https://dreamy.tours/es/blog/viajar-a-peru/"
/>
<link rel="alternate" hreflang="pt" href="https://dreamy.tours/pt/blog/peru/" />
```

## 21. Errores comunes

### Error 1: usar el mismo slug para todos los idiomas

```txt
/pt/blog/peru -> /es/blog/peru
```

Solucion: `slugMap` por `documentId`.

### Error 2: olvidar exponer el script JSON

El `slugMap` puede estar calculado en props, pero si no se imprime en HTML, el switcher no lo ve.

Solucion:

```astro
<script
  id="blog-slug-map"
  type="application/json"
  set:html={serializeJsonForHtml(slugMap)}
/>
```

### Error 3: usar `localizePath` para traducir contenido

`localizePath` solo cambia prefijos.

```ts
localizePath("/blog/peru", "es");
// "/es/blog/peru"
```

Eso no traduce el slug. Para traducir necesitas:

```ts
translatePathForSlug("/blog/peru", "viajar-a-peru");
```

### Error 4: usar `slug` para relacionar traducciones

Los slugs cambian por idioma. Para relacionar traducciones, usa `documentId`.

### Error 5: no pasar `lang` al layout

Si el layout no recibe `lang`, el header, menu o switcher pueden renderizar con idioma incorrecto.

Correcto:

```astro
<Layout seo={seoProps} lang={lang} />
```

## 22. Patron final recomendado

Para cualquier contenido traducible:

1. Fetch por idioma.
2. Agrupar por `documentId`.
3. Construir `slugMap`.
4. Generar rutas con el slug del idioma real.
5. Pasar `slugMap` a SEO.
6. Exponer `slugMap` en HTML para el switcher.
7. Usar helpers i18n para prefijos y reemplazo de slug.
8. Verificar con build y HTML generado.

Este patron evita URLs rotas, mejora SEO internacional y mantiene el cambio de idioma consistente en tours, pages, posts y categorias.
