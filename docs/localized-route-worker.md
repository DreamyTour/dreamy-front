# Resolución de slugs multilenguaje

Cloudflare mantiene **assets-first**. `wrangler.jsonc` selecciona `src/worker.ts`
como entrada del adaptador, sin activar `run_worker_first`. Un asset existente
se sirve antes de invocar el Worker. El guard de `ASSETS` también protege preview
y desarrollo frente a resolver una ruta que ya existe.

El build consulta únicamente contenido publicado del mismo `VITE_STRAPI_URL`
utilizado por Astro. No necesita un token administrativo. La integración empaqueta
un módulo virtual con documentos por `tipo:documentId` y un índice de slugs
exactos. `dist/localized-route-map.json` es un artefacto de diagnóstico fuera de
`dist/client`; no es un endpoint público ni una lista de redirecciones.

Un slug de otra localización genera 301 a la traducción publicada solicitada,
o 302 a una versión real que usa ese slug si falta la traducción. Si varias
localizaciones del mismo documento comparten el slug, el fallback sigue el orden
estable en/es/pt. Documentos distintos ambiguos nunca se resuelven.

Solo se reconocen las formas actuales de post, categoría, tour y página comercial.
Los índices numéricos, archivos, APIs y rutas anidadas ajenas quedan fuera del
resolver. Las páginas estáticas que no vienen de Strapi siguen funcionando como
assets; no se les inventa una identidad documental.

La paginación de categorías conserva N y exige que esa página exista en el
destino. La traducción existente con menos páginas mantiene 404. Los query
strings se conservan completos; el destino lleva slash final.

La validación al terminar el build comprueba archivos de destino, canonical
absoluto, ausencia de meta refresh, colisiones y loops. Un destino inexistente,
una colisión canónica o una resolución ambigua bloquean el build. Cada publicación
nueva añade datos en el siguiente build, sin añadir reglas de Cloudflare.

## Aliases

Se retiraron dos generadores **A: multilenguaje artificial** en
`dynamicPageRoutes.ts`: combinaciones cruzadas de slugs de páginas y slugs EN de
tours bajo otros locales. Ambos usaban traducciones vigentes, sin historial de
migración. Los archivos canónicos y los prefijos heredados existentes se conservan.
`public/_redirects`, que contiene redirecciones históricas, no se modifica.

## Validación local

```powershell
# Override solo para este proceso; no modificar .env.
$env:VITE_STRAPI_URL = 'https://cms.dreamy.tours'
bun run build
bun run check
bun test src
bun run test:localized-routes
```

Las pruebas de integración ejecutan el bundle generado con Miniflare/workerd,
comprueban todos los destinos del mapa y los casos reales. Un Worker de prueba
usa la misma entrada con un catálogo pequeño para verificar traducciones ausentes,
ambigüedad, paginación insuficiente y que los assets evitan la invocación del Worker.
El test sustituye únicamente el handler de Astro y los datos del mapa.

No desplegar un `dist` de un build fallido. Publicar Worker y assets del mismo
build. El contenido publicado después de ese build necesita el siguiente build
para incorporarse al mapa. Antes de desplegar, confirmar en Cloudflare el Worker
remoto, dominio y bindings; el repositorio conserva el nombre generado actual.

## Resultado local (2026-10-06)

- Build de producción completado contra `https://cms.dreamy.tours`.
- `check`: 0 errores, 0 warnings, 0 hints.
- Unit tests: 141 aprobados, 0 fallos, 18 archivos.
- Integración del bundle: 649 peticiones HTTP aprobadas, incluidos los 597
  destinos canónicos (slugs y páginas adicionales de categorías).
- Integración con fixtures: assets sin invocación del Worker, 302, ambigüedad,
  paginación insuficiente y métodos no susceptibles de resolución.
- 195 documentos, 585 slugs localizados y 496 claves únicas del índice.
- Mapa JSON: 76.318 bytes; gzip: 14.167 bytes.
- Bundle completo (43 módulos): 4.338.654 bytes, incremento de 96.056 bytes
  frente al artefacto local anterior (4.242.598 bytes).
- Wrangler dry-run: 4.236,97 KiB; gzip: 1.012,78 KiB. Sin subida ni deploy.

Archivos existentes modificados: `astro.config.mjs`, `package.json`, `bun.lock`
y `src/lib/dynamicPageRoutes.ts`.

Archivos nuevos: `wrangler.jsonc`, `src/worker.ts`,
`src/worker-configuration.d.ts`, `src/localized-route-map.d.ts`,
`src/lib/localizedRouteResolver.ts`, su test,
`src/integrations/localizedRouteMap.ts`, su test, este documento,
`tests/localized-routes.integration.mjs`,
`tests/localized-routes-fixture.integration.mjs`,
`tests/build-localized-worker-fixture.ts` y
`tests/fixtures/localized-worker.ts`.

No se cambió contenido del CMS, slugs, selectores ni código SEO. El build
regenera los artefactos habituales del sitemap con su configuración existente.
Los cambios de mapas previamente presentes en el workspace no se modificaron
para esta tarea, pero forman parte del build local: deben aislarse antes de un
commit o deploy que deba excluirlos.
