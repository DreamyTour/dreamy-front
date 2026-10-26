# Retirada de /en/ con protección de backlinks

Fecha de revisión: 2026-10-23. Cambios locales, sin push ni despliegue.

La fase 2 amplía esta limpieza con las 27 exclusiones expresamente autorizadas
por el propietario. Los recuentos de la fase 1 se conservan como historial del
build con CMS local, no como recuentos finales aptos para publicación. Véase
la conciliación y validación de la fase 2 al final de este documento.

## Inventario y comportamiento comprobado

La búsqueda del repositorio encontró ocho reglas explícitas de backlinks en
`public/_redirects`. Son cuatro destinos, con dos variantes de origen cada uno.
Todas se comprobaron contra producción antes de cambiar el código: GET devuelve
301 con el destino indicado, sin seguir el salto. Los parámetros de consulta,
incluidos parámetros repetidos, se conservan.

El origen de las rutas de esta tabla es `https://dreamy.tours`.

| Origen | Destino | HTTP original |
| --- | --- | --- |
| `/en/inca-trail-treks/inca-trail-to-machu-picchu-4-days` | `/inca-trail-4-days/` | 301 |
| `/en/inca-trail-treks/inca-trail-to-machu-picchu-4-days/` | `/inca-trail-4-days/` | 301 |
| `/en/alternative-treks/salkantay-trek-machu-picchu-4-days` | `/salkantay-trek-machu-picchu-4-days/` | 301 |
| `/en/alternative-treks/salkantay-trek-machu-picchu-4-days/` | `/salkantay-trek-machu-picchu-4-days/` | 301 |
| `/en/inca-trail-treks/short-inca-trail-to-machu-picchu` | `/short-inca-trail-2-days/` | 301 |
| `/en/inca-trail-treks/short-inca-trail-to-machu-picchu/` | `/short-inca-trail-2-days/` | 301 |
| `/en/inca-trail-treks/inca-trail-full-day-tour-private` | `/private-full-day-inca-trail/` | 301 |
| `/en/inca-trail-treks/inca-trail-full-day-tour-private/` | `/private-full-day-inca-trail/` | 301 |

Antes del cambio, `/en` y `/en/` redirigían a `/` con 301 mediante el middleware.
Esa normalización genérica no está declarada como una excepción histórica.
`/en/inca-trail-4-days/`, `/en/cusco/` y `/en/lima/` devolvían 200 mediante assets
duplicados. Ambas situaciones se sustituyen por 410 para las rutas sin excepción.

`public/_redirects` permanece intacto. SHA-256 del archivo local, antes y después:
`44970F74A277B5C22DF6DFC2E9486A012E6CFABDA3F6B7C967601AF5F018B4B8`.
El build copia exactamente ese archivo, sin añadir, eliminar ni reordenar reglas.

## Prioridad de resolución

1. Las excepciones se descubren desde `public/_redirects?raw`; no hay otra tabla
   de destinos o códigos en el código productivo. El Worker delega los orígenes
   protegidos al binding `ASSETS`, que devuelve la regla original sin modificar
   status, Location ni parámetros.
2. Cualquier otra ruta `/en`, `/en/` o `/en/*` devuelve 410 antes de cargar assets
   o de ejecutar los normalizadores y el resolver de slugs de Astro. GET y HEAD
   mantienen 410; HEAD no contiene cuerpo. Tampoco se redirigen POST u OPTIONS
   de las rutas retiradas. La respuesta usa `Cache-Control: no-store`.
3. Las rutas válidas sin prefijo, `/es/` y `/pt/` conservan assets-first y el
   resolver multilingüe existente.

La selección `run_worker_first: ["/en", "/en/*"]` evita que un asset antiguo
eluda el 410. No se activa Worker-first globalmente. Las redirecciones automáticas
de barra final de los assets no se consideran excepciones de backlinks.

Una futura regla explícita `/en/` se descubre automáticamente, sin asumir una
cantidad fija de excepciones. Una futura regla con comodines o placeholders
requiere revisión explícita: el parser falla en vez de dejar que el 410 la absorba.

Cloudflare advierte que `_redirects` no se aplica automáticamente a respuestas
servidas por código Worker. Por eso los orígenes protegidos pasan expresamente
por `ASSETS`: [documentación de redirects](https://developers.cloudflare.com/workers/static-assets/redirects/).
El enrutamiento selectivo está documentado en
[Worker script](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/).

## Generación y SEO

- `getLocalizedDynamicPaths()` deja de generar duplicados ingleses bajo `/en/`.
  Los registros ingleses siguen alimentando los mapas de traducción; las páginas
  canónicas inglesas se generan con `getDefaultLangDynamicPaths()` sin prefijo.
- El filtro del sitemap excluye el segmento exacto `/en` y sus descendientes,
  incluidas las excepciones protegidas. No filtra palabras como `enquiry`.
- Se corrige la referencia local `/en/plan-your-trip` a `/plan-your-trip/`.
- El HTML generado reveló además tres enlaces antiguos en el artículo de Strapi
  `es/blog/lima-explore/`. Se corrigen al renderizar el artículo, manteniendo texto,
  query strings y fragmentos. Sus destinos actuales se verificaron con 200 directo:

  | Enlace embebido | Destino actual |
  | --- | --- |
  | `/en/lima/gastronomic-tour-in-lima/` | `/lima-culinary-tour/` |
  | `/en/lima/magic-water-tour-full-day/` | `/magic-water-circuit-tour-lima/` |
  | `/en/lima/` | `/lima/` |

  Esta corrección no crea reglas HTTP ni modifica el contenido almacenado en Strapi.
- El middleware deja de convertir automáticamente solicitudes `/en/` en rutas
  sin prefijo. Los generadores de canonical y hreflang ya usan inglés sin prefijo.
- No se modifican traducciones, slugs del CMS, backlinks externos ni `robots.txt`.
  En fase 2 se añaden exclusivamente las 27 exclusiones de sitemap autorizadas;
  las páginas correspondientes se conservan.

## Archivos de implementación

| Archivo | Cambio |
| --- | --- |
| `astro.config.mjs` | Exclusión exacta de `/en/` y de los 27 paths autorizados del sitemap |
| `src/data/sitemapExclusions.json` | Lista literal de 6 checkout y 21 páginas de índice del blog; sin categorías |
| `wrangler.jsonc` | Worker-first selectivo para el prefijo retirado |
| `src/worker.ts` | Prioridad de excepciones originales y respuesta 410 |
| `src/lib/legacyEnglishRoutes.ts` | Detección del prefijo, inventario automático de excepciones y respuesta Gone |
| `src/middleware.ts` | Retirada de la redirección genérica del idioma predeterminado |
| `src/lib/dynamicPageRoutes.ts` | Evitar duplicados estáticos `/en/`, conservando mapas de traducción |
| `src/data/machupicchuCircuitsContent.ts` | CTA inglés sin prefijo obsoleto |
| `src/lib/legacyEnglishLinks.ts` y `src/components/pages/BlogPostPage.astro` | Corrección de los tres enlaces de Lima al renderizar |
| `package.json` | Comandos reproducibles para validar la limpieza |

Pruebas añadidas: `src/lib/legacyEnglishRoutes.test.ts`,
`src/lib/legacyEnglishLinks.test.ts`, `tests/legacy-en.integration.mjs` y
`tests/legacy-en-build.audit.mjs`. Se amplían `tests/build-localized-worker-fixture.ts`
y `tests/localized-routes.integration.mjs`. Se actualiza la explicación de
`docs/localized-route-worker.md`; este documento registra inventario y publicación.

## Validaciones

```sh
bun test src
bun run build
bun run check
bun run test:legacy-en
bun run test:legacy-en-build
bun run test:localized-routes
```

`test:legacy-en` usa el Worker real con un catálogo simulado, copia las reglas
originales y coloca deliberadamente assets obsoletos `/en/` para comprobar que
no evaden el 410. Comprueba todas las excepciones, con/sin barra, GET, HEAD y
query strings, y verifica que EN/ES/PT legítimos siguen evitando el Worker.

`test:legacy-en-build` revisa todos los sitemaps hijos, la ausencia de HTML bajo
`dist/client/en/`, enlaces internos, canonical, hreflang, Open Graph y JSON-LD.
También compara `_redirects` con Git y con el archivo copiado al build. Si existe
la captura local `.astro/legacy-en-baseline.json`, comprueba que ninguna URL ajena
a `/en/` se haya retirado del sitemap.

Resultado histórico de la fase 1 con `localhost:1337` (sustituido para publicación
por el build contra el CMS público de la fase 2):

| Comprobación | Resultado |
| --- | --- |
| Sitemap del build local anterior | 832 URLs |
| URLs `/en/` retiradas por esta tarea | 119 |
| Sitemap nuevo | 713 URLs, en un sitemap hijo |
| URLs ajenas a `/en/` conservadas | 713 de 713 |
| URLs `/en/` presentes en XML | 0 |
| Documentos HTML revisados | 710 |
| Referencias antiguas internas / canonical / hreflang / JSON-LD | 0 |
| Inventario del mapa multilingüe | 197 documentos, 583 slugs, validado por el build |
| Archivo histórico y copia en el build | Sin cambios |
| Tests unitarios | 198 aprobados, 0 fallos |
| Comprobación de Astro | 352 archivos, 0 errores, 0 warnings, 0 hints |
| Worker con assets obsoletos simulados | 121 comprobaciones HTTP aprobadas |
| Bundle real generado | 905 solicitudes HTTP aprobadas |
| Resolver con catálogo simulado | Aprobado: assets-first, 302, ambigüedad, paginación y métodos |

El build termina correctamente. Vite mantiene su advertencia de chunks de más
de 500 kB; no impide compilar ni afecta al resultado de las pruebas de rutas.

La captura pública inicial tenía 867 URLs, incluidas 119 `/en/`; no coincide con
el build local anterior de 832 URLs. Esa diferencia previa de 35 URLs no la
introduce este diff. La comparación de esta tarea se hace contra la captura del
build local anterior y comprueba exactamente 119 retiradas, todas `/en/`. No se
fuerza el objetivo orientativo de 715 ni se atribuyen otras retiradas a esta tarea.
Esta discrepancia entre la versión pública y el checkout también debe revisarse
antes de publicar para no confundir cambios anteriores con esta limpieza.

## Cloudflare externo: revisión pendiente antes de publicar

`bunx wrangler whoami` informa que no hay una sesión autenticada. El inventario
de la herramienta de navegador tampoco ofrece navegadores o pestañas accesibles.
No hay acceso verificado al inventario de Redirect Rules, Bulk Redirects, Page Rules, reglas de
reescritura ni rutas de otros Workers configuradas en la cuenta. Las observaciones
HTTP confirman las ocho reglas del proyecto, pero no demuestran que el panel no
contenga más reglas. El propietario recuerda que las excepciones están en el
proyecto; no aportó un inventario del panel.

Los Bulk Redirects pueden ejecutarse antes del Worker, según la documentación
de Cloudflare. Una regla externa amplia que redirija todo `/en/*` impediría ver
el 410 de las rutas no protegidas. Un rewrite anterior al Worker también podría
cambiar el pathname recibido. No se ha identificado un conflicto concreto porque
el panel no pudo inspeccionarse; tampoco se afirma que esté corregido.

Antes del despliegue:

1. Exportar y revisar las reglas externas aplicables a `dreamy.tours`, incluidas
   condiciones, estado habilitado, prioridad y parámetros de query string.
2. Registrar y probar cualquier excepción adicional sin modificar sus destinos
   ni códigos. Mantenerla por delante del 410; si se necesita representarla en
   el proyecto, revisar primero el mecanismo y repetir las pruebas.
3. Resolver cualquier regla genérica incompatible sin modificar las excepciones
   protegidas. Si no puede identificarse el inventario, no publicar este cambio.
4. Mostrar el diff y los resultados al propietario. Solo después de su aprobación
   publicar juntos Worker y assets del mismo build, con las ocho reglas originales.
5. Repetir en producción la tabla de excepciones y los casos 410, comprobar los
   destinos finales 200, los sitemaps y las páginas válidas EN/ES/PT.

No se ha activado el 410 en producción. La retirada de URLs del índice de Google
dependerá de su rastreo posterior; no se afirma que ya estén desindexadas.

## Fase 2: checkout y paginación del índice del blog

El propietario confirmó la lista literal durante la revisión. Se guarda en
`src/data/sitemapExclusions.json` y se usa exclusivamente en `sitemap.filter`.
No se modifican los generadores de checkout o blog ni los componentes de
navegación. El filtro normaliza solo la barra final para comparar el pathname.
No contiene una expresión global que elimine toda la paginación.

| Grupo autorizado | Paths |
| --- | --- |
| Checkout inglés | `/checkout/`, `/checkout/success/` |
| Checkout español | `/es/checkout/`, `/es/checkout/success/` |
| Checkout portugués | `/pt/checkout/`, `/pt/checkout/success/` |
| Índice blog inglés | `/blog/2/`, `/blog/3/`, `/blog/4/`, `/blog/5/`, `/blog/6/`, `/blog/7/`, `/blog/8/` |
| Índice blog español | `/es/blog/2/`, `/es/blog/3/`, `/es/blog/4/`, `/es/blog/5/`, `/es/blog/6/`, `/es/blog/7/`, `/es/blog/8/` |
| Índice blog portugués | `/pt/blog/2/`, `/pt/blog/3/`, `/pt/blog/4/`, `/pt/blog/5/`, `/pt/blog/6/`, `/pt/blog/7/`, `/pt/blog/8/` |

Las páginas de categorías como `/blog/inca-trail/2/` no están autorizadas para
exclusión y permanecen en el sitemap. Checkout conserva `noindex, nofollow`.
La prueba del bundle solicita las 27 páginas, exige 200 directo, comprueba
el meta robots de las seis checkout y los enlaces anterior/siguiente del blog.

### Recuento real previo de las 27 URLs

| XML examinado | Checkout presentes | Índices paginados autorizados presentes | Ausentes de la lista autorizada |
| --- | --- | --- | --- |
| Público, 867 URLs | 6 de 6 | 21 de 21 | Ninguna |
| Local anterior, 832 URLs | 6 de 6 | 18 de 21 | Los tres `/blog/8/`, con sus prefijos ES/PT |
| Local fase 1, 713 URLs | 6 de 6 | 18 de 21 | Los mismos tres índices de página 8 |

Además de los índices autorizados, el XML público contiene doce paginaciones
de categorías (cuatro por idioma). Por eso el inventario general encontraba
33 páginas numeradas y la lista autorizada solo incluye 21. En el CMS local
eran 30 páginas numeradas: 18 índices más las mismas doce de categorías.

### Investigación de 864, 832, 713 y del XML público

La configuración de `.env` usada en los builds previos apunta a
`http://localhost:1337`, tanto en modo development como production. El build no
cambiaba automáticamente al CMS público por ejecutar `astro build`.
Ese origen de datos era distinto de `https://cms.dreamy.tours`.

Comparación de contenido publicado, sin escribir en ninguno de los CMS:

| Colección / idioma | Local | CMS público |
| --- | --- | --- |
| Posts EN | 75 | 87 |
| Posts ES | 79 | 87 |
| Posts PT | 75 | 87 |
| Tours EN / ES / PT | 92 / 92 / 92 | 92 / 92 / 92 |

Hay cuatro registros españoles locales ajenos al catálogo equivalente público,
incluidos `lima-prueba` y `lima-explore`, y diferencias en identidades documentales.
Dos tours portugueses comparten documentId pero tienen slugs diferentes entre
los dos CMS. No se cambiaron esos registros para esta tarea.

La comparación exacta de los XML anteriores encontró:

- 41 URLs solo en el XML público: 36 posts, tres páginas 8 del blog y dos slugs
  portugueses de tours.
- 6 URLs solo en el XML local: tres posts ES (`lima-explore`, `lima-prueba`,
  `what-to-do-in-lima-peru`), un post PT (`camino-inca-vs-salkantay`) y dos tours
  PT (`lares-trek-caminho-inca-curto-4-dias`, `salkantay-caminho-inca-6-dias`).
- Diferencia neta: `41 - 6 = 35`; por tanto `832 + 35 = 867`.
- La primera fase restó exactamente 119 aliases `/en/` al XML local:
  `832 - 119 = 713`. El código no retiró las otras 35; faltaban o tenían slugs
  diferentes en la fuente local. Ese build no era una validación suficiente
  para publicar con el contenido real de producción.

La cifra 864 procede del informe proporcionado. No se aportó aquel XML ni una
lista completa de sus 864 entradas. Las capturas HTTP de esta sesión muestran
867 URLs; la diferencia de tres respecto a 864 no se puede atribuir con certeza
a un cambio específico sin ese inventario histórico. No se supone que sean
`/dev/` o `/cms/`: esas rutas ya estaban ausentes en el XML público capturado.
No se utiliza 864 como base para forzar el resultado final.

El build final se ejecuta con `VITE_STRAPI_URL=https://cms.dreamy.tours` como
override del proceso; no se edita `.env`. Se contrasta su XML con la captura
pública de esta sesión y se registran diferencias adicionales de contenido
publicado si las hay. La cifra final se obtiene del XML generado.

### Resultado final de XML contra el CMS público

| Medición | Resultado comprobado |
| --- | --- |
| Captura pública inicial | 867 URLs |
| Retiradas `/en/` | 119 |
| Checkout autorizadas retiradas del sitemap | 6 |
| Índices paginados autorizados retirados del sitemap | 21 |
| Total final, leído del XML generado | **721 URLs** |
| URLs públicas esperadas ausentes | **0** |
| URLs inesperadas añadidas | **0** |
| Paginaciones de categorías conservadas en XML | 12 |
| URLs de checkout o de la lista de 21 presentes en XML final | 0 |
| URLs `/en/` presentes en XML final | 0 |
| Sitemaps hijos | 1, enlazado desde el índice |
| HTML generados | 745 |
| Referencias obsoletas `/en/` en enlaces internos y metadatos revisados | 0 |
| Catálogo de rutas publicado validado por el build | 205 documentos, 615 slugs |

La conciliación exacta es `867 - 119 - 6 - 21 = 721`. La prueba de artefactos
comparó los conjuntos completos, no solo los totales. Las 721 URLs son exactamente
las del XML público menos las 146 exclusiones autorizadas. Los seis paths
exclusivos del CMS local se documentan arriba y no se utilizan como referencias
canónicas del CMS público. Las 27 páginas excluidas conservan sus archivos HTML.

El cambio de fase 2 en código productivo está limitado a
`src/data/sitemapExclusions.json` y su uso en `astro.config.mjs`. Se amplían las
pruebas de artefactos y del bundle para comprobar páginas conservadas y comparar
contra la fuente pública. No se cambiaron formularios, procesos de pago,
robots de checkout, generadores de paginación ni enlaces de navegación.

Comandos ejecutados con el override solo del proceso:

```powershell
$env:VITE_STRAPI_URL = 'https://cms.dreamy.tours'
bun run build
bun run check
bun test src
bun run test:legacy-en
bun run test:legacy-en-build
bun run test:localized-routes
```

El build finalizó correctamente (la advertencia de tamaño de chunks de Vite
sigue siendo informativa). Astro check: 352 archivos, cero errores, warnings o
hints. Unit tests: 198 aprobados, cero fallos. Fixture de retirada `/en/`: 121
comprobaciones HTTP aprobadas. La auditoría completa de artefactos aprobó el
conjunto exacto de 721 URLs y la copia intacta de las reglas históricas.

La integración del bundle final contra Miniflare/workerd aprobó **976 solicitudes
HTTP**, además del fixture de resolución multilingüe. En concreto:

- Las seis checkout devuelven 200 y mantienen el meta robots `noindex, nofollow`.
- Las 21 páginas de índice paginado devuelven 200 sin redirigir y conservan los
  enlaces a la página anterior y, cuando existe, a la siguiente.
- Los destinos canónicos del mapa publicado devuelven 200; los aliases ingleses
  retirados devuelven 410 sin Location.
- Las ocho reglas históricas conservan código y destino con GET/HEAD y consultas
  repetidas. Sus destinos finales siguen siendo 200.
- El resolver de otras localizaciones conserva traducciones, 301/302 pertinentes,
  paginación de categorías, 404 y la prioridad de los assets legítimos.

No hay comprobaciones locales pendientes. Antes de publicar siguen pendientes
el inventario externo de Cloudflare y su orden efectivo; para atribuir el antiguo
total de 864 con certeza también hace falta el XML o listado completo de aquella
auditoría. Ninguna de esas limitaciones se sustituye por una suposición.

Las capturas de evidencia locales se guardaron en `.astro/` (ignorado por Git):
`sitemap-phase2-baseline.json`, `sitemap-cms-comparison.json`,
`phase2-public-redirects.json`, `phase2-build.log` y `phase2-tests.log`.
No contienen tokens de administrador ni se publican como assets.

### Acceso a reglas externas en fase 2

Se repitió `wrangler whoami`: no autenticado. El inventario de navegador sigue
vacío. No se pudieron leer Redirect Rules, Bulk Redirects, Page Rules ni rewrites
de la cuenta; no se asume que no existan. La comprobación HTTP de las ocho reglas
protegidas públicas pasó de nuevo, incluidos sus parámetros repetidos. Eso prueba
su comportamiento observado, no la ausencia de otras reglas de cuenta.
La revisión externa sigue pendiente antes de publicar; no se ha realizado push,
despliegue, login ni modificación de reglas de Cloudflare.

## Contraste con las auditorías Word y PowerPoint

La revisión adicional está documentada en [seo-audit-follow-up.md](seo-audit-follow-up.md).
El Word repite los P0 del PowerPoint y propone 301 generales para `/en/`; esa
propuesta no se aplica porque contradice la instrucción expresa del usuario.
Las ocho reglas originales mantienen prioridad y contenido exacto.

Para retirar consultas WordPress que devolvían la portada con 200,
`run_worker_first` añade las cinco formas de portada `/`, `/es`, `/es/`, `/pt`
y `/pt/`. Sus GET/HEAD con `p` numérico o `s` devuelven 410. Las visitas
normales conservan su HTML estático y las otras rutas mantienen assets-first.
Este tratamiento no añade URLs al sitemap ni cambia sus exclusiones.

La validación final de esta revisión aprobó 202 pruebas unitarias, tipos sin
errores, el build contra CMS público, 121 comprobaciones HTTP del fixture de
retirada y 1.010 solicitudes HTTP del Worker compilado, además del fixture de
resolución multilingüe. Los XML siguen conteniendo exactamente 721 URLs; los
745 HTML no contienen enlaces ni referencias SEO a `/en/`. Las ocho reglas
protegidas siguen iguales en fuente, copia de build y comportamiento probado.
