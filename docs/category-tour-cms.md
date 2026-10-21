# Secciones CMS de categorías de tours

Solo `selectorTours` e `informacionUtil` se incorporan a `api::page.page`
(nombre visible: `pageCategoryTour`). Son componentes únicos, opcionales y
localizados. Los demás atributos de Page y sus relaciones no se modifican.

## Schemas finales

| Componente | Campos |
| --- | --- |
| `category-tour.tour-selector` | `titulo: string`, `descripcion: text`, `recomendaciones: component[] (category-tour.tour-recommendation)` |
| `category-tour.tour-recommendation` | `etiqueta: string`, `titulo: string`, `descripcion: text`, `idealPara: text`, `tour: relation oneToOne → api::tour.tour` |
| `category-tour.useful-info` | `titulo: string`, `descripcion: text`, `items: component[] (category-tour.useful-info-item)` |
| `category-tour.useful-info-item` | `etiqueta: string`, `titulo: string`, `contenido: blocks` |

La relación `tour` es unidireccional: no tiene `mappedBy` ni `inversedBy`, ni
añade atributos al schema Tour. `idealPara` contiene un perfil por línea.
Los iconos, enlaces de navegación y estilos los resuelve el frontend. No hay
campos nuevos de iconos, imágenes, URLs, slugs, colores ni layout.

## Populate completo

```ts
const populate = {
  categories: true,
  video: { populate: { thumbnail: { fields: ["url"] } } },
  seo: {
    populate: {
      metaImage: { fields: ["name", "alternativeText", "url"] },
    },
  },
  selectorTours: {
    populate: {
      recomendaciones: {
        populate: {
          tour: { fields: ["documentId", "titulo", "slug", "locale"] },
        },
      },
    },
  },
  informacionUtil: { populate: { items: true } },
  preguntasAcordeon: true,
};
```

## Frontend

- `TourCategoryChooser.astro` sustituye a `LimaTourChooser.astro`.
- `TourCategoryInfo.astro` sustituye a `LimaTourInfo.astro`.
- El selector conserva las clases, estilos y breakpoints aprobados: 1 columna,
  2 desde `md` y 4 desde `xl`. No hay nuevos controles de diseño en Strapi.
- Se conserva el orden recibido del CMS, sin ordenar por título ni por tour.
- Cada href usa `rewriteUrl('/' + tour.slug, lang)`.
- Se descartan recomendaciones sin tour, sin slug o con slug vacío. También
  aquellas cuyo locale no coincide exactamente con el de la página y la ruta.
  Si falta el locale de la página, no se construye el enlace por inferencia.
- Los avisos se emiten únicamente en desarrollo.
- Cero recomendaciones válidas significa cero sección y cero espaciado.
  Cero items significa cero sección de información útil y cero espaciado.
- Los paneles y su contenido se renderizan en HTML. El script solo selecciona
  la pestaña activa, gestiona foco y actualiza atributos ARIA. Sin JS se ven
  todos los paneles y los controles de pestañas permanecen ocultos.
- Tours por categoría, blogs automáticos, reviews globales, FAQ, H1,
  introducción y lógica SEO conservan su implementación previa.

## Archivos de implementación

CMS, respecto de `dreamy-cms/`:

- Nuevos: `src/components/category-tour/{tour-selector,tour-recommendation,useful-info,useful-info-item}.json`.
- Nuevos: `scripts/data/lima-category-sections.json` y `scripts/seed-lima-category-sections.cjs`.
- Modificados: `src/api/page/content-types/page/schema.json`, `src/api/page/middlewares/populate-page.ts`.
- Regenerados: `types/generated/components.d.ts`, `types/generated/contentTypes.d.ts`.

Frontend, respecto de `dreamy-front/`:

- Nuevos: `src/components/sections/TourCategoryChooser.astro`, `src/components/sections/TourCategoryInfo.astro`,
  `src/components/content/CategoryInfoBlocks.astro`, `src/lib/categoryTourSections.ts`,
  `src/lib/categoryTourSections.test.ts`, este documento.
- Modificados: `src/components/content/PageContent.astro`, `src/types/page.ts`,
  `src/lib/page-preview.ts` (este último ya existía sin seguimiento al comenzar).
- Sustituidos: los archivos locales `LimaTourChooser.astro` y `LimaTourInfo.astro`,
  también sin seguimiento al comenzar.
- Se respetaron los cambios previos en DynamicContentPage, HomePost y BlogContactCta.

Tipos nuevos generados: `CategoryTourTourSelector`, `CategoryTourTourRecommendation`,
`CategoryTourUsefulInfo`, `CategoryTourUsefulInfoItem`, más los dos atributos de
`ApiPagePage`. Los tipos del frontend permiten componentes ausentes o nulos.

## Despliegue posterior (no ejecutado)

1. Respaldar la base de datos del CMS y desplegar primero los schemas y el
   middleware de Strapi junto con sus tipos. Generar tipos con
   `bun run strapi ts:generate-types` y construir con `bun run build`.
2. Reiniciar Strapi para aplicar la sincronización de schemas. Comprobar que
   los permisos existentes permiten leer Page y Tour; no se amplían permisos
   automáticamente.
3. Editar los dos componentes en la página española de Lima y relacionar los
   tours publicados en español. Alternativamente, con el CMS detenido y desde
   su directorio ejecutar `node scripts/seed-lima-category-sections.cjs` usando
   la configuración del entorno de destino. Crea solo los componentes ausentes
   y guarda un borrador; no sobrescribe componentes existentes.
4. Revisar y publicar la página desde Strapi. El flag opcional `--publish`
   publica la página completa, incluido cualquier otro cambio pendiente en su
   borrador; utilizarlo únicamente tras revisar ese borrador. La carga inicial
   valida primero las cuatro relaciones publicadas españolas y aborta si falta
   alguna. Los documentId del fixture deben existir en el entorno de destino.
5. Verificar la respuesta pública de `/api/pages?locale=es`: los tours deben
   incluir `documentId`, `titulo`, `slug`, `locale`, y los items sus blocks.
6. Con el contenido ya publicado, ejecutar en el frontend `bun run check`,
   `bun run test`, `bun run build` y las pruebas de integración/navegador.
   Desplegar el artefacto habitual del frontend. Al ser prerenderizado,
   los cambios publicados posteriores requieren regenerar el frontend.
7. Comprobar Lima, una categoría sin nuevos campos, pestañas con/sin JS,
   enlaces por idioma, canonical/hreflang y sitemap en el entorno publicado.

La carga inicial se probó en una copia SQLite y se aplicó solo al CMS local.
La publicaci?n del c?digo se realiza por separado en los repositorios de CMS y frontend. No se ejecut? ning?n comando de deploy.

## Validación realizada

- Strapi: generación de tipos con 0 errores y 0 advertencias; build del CMS aprobado.
- Frontend: build final aprobado; mapa validado de 197 documentos y 583 slugs
  localizados. `astro check`: 0 errores, 0 advertencias, 0 hints.
- Tests unitarios: 185 aprobados, 0 fallidos, incluidos los casos de componentes
  vacíos, orden y relaciones inválidas o de otro idioma.
- CMS: `node scripts/test-tables.cjs` aprobado; carga inicial e idempotencia
  comprobadas. El populate público devuelve los cuatro campos de cada tour.
- Navegador: Lima con 4 recomendaciones, columnas 4/2/1 a 1440/900/390 px,
  captions aprobados conservados, 4 pestañas con clic/teclado y 4 paneles
  completos visibles sin JS. Lima inglesa y Cusco sin campos nuevos no
  muestran las secciones y conservan sus tours principales.
- Comparación de API antes/después: contenido de Page, tours, posts y global
  conservado, excluyendo las dos secciones nuevas, IDs internos de componentes
  y metadatos de guardado/publicación que Strapi regenera. FAQ, SEO y video
  conservan sus valores.
- HTML final: canonical de Lima, hreflang `es-PE`, `en`, `pt-BR`, `x-default`
  y URLs de sitemap verificados; los 4 paneles están en HTML prerenderizado.
- Integración del Worker de producción: 647 requests aprobados. Fixture de
  rutas localizado aprobado (assets, traducciones, ambigüedad, paginación,
  HEAD, rutas desconocidas y métodos distintos de GET).
- E2E existentes: 40 aprobados y 13 fallidos en Chromium. Se reutilizó el
  servidor local de puerto 4321 mediante configuración temporal, ya retirada,
  porque el de desarrollo ya estaba activo y el runner espera 4322.

Los 13 fallos E2E corresponden a: 4 expectativas españolas de `Reserva de tour`
frente al texto actual `Reservar tour`; 3 expectativas de opciones de calendario
que no encuentran `#availability-tour option`; 1 control del blog móvil ausente;
y 5 selectores globales de H1 que también capturan los H1 del toolbar de Astro.
Estos tests no cubren las nuevas secciones CMS. No se modificaron las páginas
ni los tests de esas funcionalidades para hacerlos pasar.

Una primera ejecución del build encontró un bloqueo de archivos de Windows
al coincidir con el Worker de pruebas; se repitió después y el build final pasó.
Se restauró el servidor local tras invalidarse la caché de Vite durante los
checks/builds; Lima volvió a responder HTTP 200 con ambas secciones.

## Disponibilidad en todas las categorías

Los componentes opcionales están disponibles en todas las entradas e idiomas de
`pageCategoryTour`; cada categoría utiliza solo su propio contenido. No se copia
el contenido de Lima ni se rellenan otras categorías automáticamente.

En desarrollo, `refreshLocalPageSections` actualiza las secciones desde Strapi en
cualquier categoría e idioma. Información útil ignora componentes de ítem vacíos,
incluidos párrafos sin texto. El selector continúa requiriendo una relación de
tour válida y del mismo idioma. Sin ítems o recomendaciones válidas, no se genera
la sección ni su espacio. Los cambios publicados en producción requieren rebuild
del frontend por su prerenderizado.


## Ajustes visuales finales

Las recomendaciones y los blogs muestran una tarjeta por vez en m?vil con
flechas, contador y deslizamiento. Las rese?as de desktop se organizan en filas
Tripadvisor, Trustpilot y Google: logo centrado sobre la puntuaci?n y tres
comentarios, con alturas uniformes y expansi?n con Leer m?s. En m?vil se
conservan los acordeones por plataforma. Solo logos y nombres de viajeros son
enlaces externos; las tarjetas de plataforma se resaltan con hover/foco.

El FAQ usa columnas independientes. El footer m?vil mantiene enlaces visibles
en dos columnas y el logo centrado. Viajes a tu medida presenta dos tarjetas por
fila en m?vil, sin acordeones. Los detalles de las tarjetas de tours usan iconos
simples delineados en verde.

Strapi y sus plugins oficiales se actualizaron de 5.58.0 a 5.59.0, con el lockfile
y la configuraci?n de pnpm correspondientes. Los tipos se regeneraron con esa
versi?n instalada. Las bases SQLite, variables de entorno y archivos de build
no se incluyen en Git: publicar c?digo no publica el contenido de la base local.
