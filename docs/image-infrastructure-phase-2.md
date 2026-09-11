# Fase 2 — infraestructura de imágenes

Investigación hecha el 11 de septiembre de 2026. No se modificaron URLs, datos de Strapi, reglas de Cloudflare ni la arquitectura `HeroImage`.

## A. Estado actual del caché

`cdn.dreamy.tours` es el dominio público de un bucket Cloudflare R2, servido por Cloudflare. Se comprobó con DNS, `server: cloudflare`, `cf-cache-status`, `Age`, `ETag` y los datos de Strapi:

- Strapi usa `strapi-provider-cloudflare-r2` 0.3.0.
- `CF_PUBLIC_ACCESS_URL=https://cdn.dreamy.tours`.
- Las imágenes válidas responden `Cache-Control: max-age=14400` y se sirven desde la caché de Cloudflare.
- El HTML de `dreamy.tours` responde `Cache-Control: public, max-age=0, must-revalidate`.
- El build Astro solo declara un año inmutable para `/_astro/*`; no tiene reglas ni código que afecten al subdominio CDN.

El provider R2 instalado llama a `S3.upload()` con `ContentType`, pero no envía `CacheControl`; `config/plugins.ts` tampoco lo configura. El valor de cuatro horas coincide con el valor por defecto de Browser Cache TTL de Cloudflare. Por tanto la fuente efectiva es Cloudflare/R2 o una Cache Rule existente de la zona, no Astro, ni el middleware de Strapi ni un proxy del frontend.

La propiedad HTTP `Cache-Control` existe en los metadatos de cada objeto R2 y también puede sobrescribirse con Cache Rules. [Cloudflare documenta ambas opciones](https://developers.cloudflare.com/r2/objects/upload-objects/) y explica que los dominios personalizados de R2 pasan por su caché ([R2 custom domains](https://developers.cloudflare.com/cache/interaction-cloudflare-products/r2/)).

## B. Configuración recomendada

No se recomienda aplicar todavía `public, max-age=31536000, immutable` a todo `cdn.dreamy.tours`.

Las rutas se construyen como `folderPath/file.hash.ext`, por ejemplo `4/choquequirao_trek_286896c6a4.webp`. La parte final es el `hash` de Strapi y normalmente cambia al crear un medio nuevo. Pero no es un hash criptográfico del contenido que impida sobrescrituras: el provider admite subir otra vez a la misma clave y R2 aplica la última escritura. Por eso estas rutas son identificadores versionados en el flujo normal de Strapi, pero no ofrecen por sí solas la garantía estricta necesaria para `immutable` si se reemplazan objetos in situ.

Antes de subir el TTL, establecer esta política operativa:

1. Nunca sobrescribir una clave R2 publicada.
2. Para reemplazar una imagen, crear un nuevo medio/archivo en Strapi, actualizar la referencia y conservar la URL antigua durante al menos un año.
3. Tras borrar objetos, purgar la URL en Cloudflare si debe desaparecer de inmediato. Los 404 también pueden quedar en caché ([consistencia de R2](https://developers.cloudflare.com/r2/reference/consistency/)).

Con esa garantía, configurar en **Cloudflare Dashboard → Rules → Cache Rules** una regla limitada a archivos de imagen del hostname CDN:

- Condición: hostname `cdn.dreamy.tours` y extensión `avif`, `gif`, `jpeg`, `jpg`, `png` o `webp`.
- Cache eligibility: **Eligible for cache**.
- Browser TTL: **Override origin**, 1 year.
- Edge TTL: usar TTL por código de estado: **200–299 = 1 year; 300–499 = 0/no cache; 500–599 = no-store**.

Así no se aplica a HTML, JSON/API, fuentes, CSS/JS o errores 404. El ajuste de Browser TTL modifica el `max-age` que recibe el navegador; Edge TTL controla la caché de Cloudflare y no se expone como header. Cloudflare documenta el comportamiento de ambos y el valor por defecto de cuatro horas en [Edge and Browser Cache TTL](https://developers.cloudflare.com/cache/how-to/edge-browser-cache-ttl/), además de TTL por código en [Cache Rules settings](https://developers.cloudflare.com/cache/how-to/cache-rules/settings/).

No añadir `Cache Everything` global, no usar una regla para `dreamy.tours`, ni marcar HTML/API como immutable.

Como alternativa para **nuevas** cargas, se puede hacer que el provider añada `CacheControl` mediante `actionOptions.upload` y `uploadStream` en el CMS. Esa configuración afectaría a todos los uploads del bucket y no reescribe los objetos existentes. No se implementó porque todavía falta formalizar la política de no sobrescritura y porque no discrimina solo imágenes. Los objetos existentes requieren una Cache Rule o actualizar sus metadatos en R2; cambiar Astro no tiene efecto.

## C–D. WebP 404 y solución

Se consultó el campo `portadaImage` de la API local de Strapi y se probó el original y todas las variantes con una query única que produjo `cf-cache-status: MISS`. Los seis recursos probados devolvieron 404 incluso evitando una entrada anterior de caché. No son errores de `srcset` ni 404 retenidos.

| Página | Registro/ campo Strapi | Original | Variantes | Causa y solución |
| --- | --- | --- | --- | --- |
| `https://dreamy.tours/es/blog/cuando-viajar-peru/` | Post 2 / `portadaImage`, media 121, `viajar_peru_af97af692c` | `https://cdn.dreamy.tours/15/viajar_peru_af97af692c.webp` → 404 | thumbnail 245, small 500, medium 750 y large 1000; las cuatro → 404 | El registro apunta a archivos R2 inexistentes. Restaurar las cinco claves desde backup, o subir de nuevo la imagen en Strapi y reemplazar esta relación. |
| `https://dreamy.tours/es/blog/como-llegar-a-machu-picchu/` | Post 14 / `portadaImage`, media 122, `como_llegar_machupicchu_dc7a99dca8` | `https://cdn.dreamy.tours/15/como_llegar_machupicchu_dc7a99dca8.webp` → 404 | thumbnail 245, small 500, medium 750 y large 1000; las cuatro → 404 | Mismo fallo: referencia de base de datos válida, objetos ausentes en R2. Restaurar o reemplazar desde Strapi. |
| `https://dreamy.tours/es/blog/puerto-maldonado/` | Post 25 / `portadaImage`, media 140, `Puerto_Maldonado_0acaa81363` | `https://cdn.dreamy.tours/15/Puerto_Maldonado_0acaa81363.webp` → 404 | thumbnail 245, small 500, medium 750 y large 1000; las cuatro → 404 | Mismo fallo: restaurar las claves o sustituir el medio en Strapi. |

Los tres son exactamente los medios destacados que usan el prefijo R2 `15/`. Se comprobó que los originales de los prefijos `3/` a `14/` asociados a heroes siguen en 200. Esto apunta a una eliminación/fallo de sincronización del contenido bajo `15/`, no a una variante generada parcialmente. La investigación no tiene permisos de lista/lectura directa del bucket, por lo que no puede afirmar quién borró los objetos; sí confirma que la base de datos de Strapi conserva las referencias y R2 no los entrega.

Después de restaurar o re-subir, purgar las cinco URLs de cada medio si llegaron a la caché. Verificar cada URL con una query única y actualizar el registro publicado antes de borrar los objetos antiguos. No resolverlo con fallbacks en Astro: ocultaría el problema y no arreglaría el SEO/social image del registro.

## E. Estrategia actual de tamaños

Los medios de hero observados contienen WebP de 500, 750 y 1000 px, más el original de 2000 px. `HeroImage` reutiliza exactamente esas URLs, con `sizes="100vw"`. Chrome selecciona lo siguiente en el tour y blog validados:

| Escenario | Ancho de recurso seleccionado |
| --- | --- |
| Móvil 390 px, DPR 1 | 500 px |
| Móvil 390 px, DPR 2 | 1000 px |
| Tablet 768 px, DPR 1 | 1000 px |
| Laptop 1366 px, DPR 1 | 2000 px (no hay candidato entre 1000 y 2000) |
| Desktop 1920 px, DPR 1 | 2000 px |

Para el hero de Choquequirao, los tamaños reales actuales son: 500 = 36.952 bytes, 750 = 75.144, 1000 = 126.918 y original 2000 = 321.790. Se codificaron de forma local y solo para estimación las alternativas, usando el mismo original y WebP de calidad 80: 1280 ≈ 173.718 bytes, 1600 ≈ 228.772 y 1920 ≈ 297.000.

## F. ¿Merece crear 1280/1600/1920?

- **1280:** prioridad baja. Ayuda cerca de 1280 CSS px, pero en un laptop de 1366 Chrome sigue eligiendo 2000 para no escalar la imagen. No resuelve el salto observado de 1000 a 2000 en 1366.
- **1600:** sí merece una prueba si existe tráfico sustancial de pantallas de 1200–1600 px a DPR 1. En 1366 podría bajar aproximadamente de 322 KB a 229 KB, un ahorro cercano a 93 KB (29 %) por hero, sin reducir nitidez.
- **1920:** beneficio moderado para desktop 1920 DPR 1: aproximadamente 25 KB (8 %) frente al original 2000. Tiene prioridad menor que 1600.

No crear seis tamaños a la vez. Mantener 500/750/1000/2000 y, tras resolver los 404 y ajustar caché, medir distribución de viewports y probar solo **1600** en una imagen. Generar múltiples variantes aumenta almacenamiento, carga de procesamiento y complejidad de regeneración. Para DPR 2 en pantallas grandes, el original de 2000 seguirá siendo el máximo disponible y no hay un ahorro seguro que perseguir.

## G. AVIF

La infraestructura actual no genera AVIF automáticamente:

- Strapi 5.53 incluye Sharp, capaz de codificar AVIF, pero su configuración actual no define generación de formatos alternativos; los formatos existentes son WebP porque el archivo fuente y las salidas actuales son WebP.
- `strapi-provider-cloudflare-r2` 0.3.0 es un proveedor S3/R2 de almacenamiento. No transforma imágenes ni negocia `Accept`; solo sube la representación que Strapi le entrega.
- Cloudflare Images puede crear AVIF/WebP y tamaños bajo demanda, pero requiere habilitar/configurar Cloudflare Images o un Worker/transformación. Su salida debe cachearse y la negociación de formato debe respetar `Accept` y `Vary`; no aparece configurada en este proyecto. [Cloudflare Images](https://developers.cloudflare.com/images/get-started/introduction/) y sus [formatos](https://developers.cloudflare.com/images/optimization/features/) cubren AVIF, WebP y fallback.

La estimación de Choquequirao con codificación local muestra AVIF ≈97 KB a 1000 px, 157 KB a 1600 y 187 KB a 1920, frente a WebP ≈127, 229 y 297 KB. Es una señal de posible ahorro de 23–37 % para navegadores compatibles, no una medición de producción ni una garantía de calidad visual equivalente.

Recomendación: dejar AVIF para una tercera fase. Primero arreglar el almacenamiento, formalizar cache/versionado y medir tráfico. Para AVIF hay que elegir entre generar y almacenar AVIF mediante una extensión/proceso de Strapi, o adoptar Cloudflare Images/Worker para transformaciones; en ambos casos WebP debe seguir como fallback mediante `<picture>` o negociación correcta del CDN. No añadir conversiones manuales ni scripts de build.

## H–I. Límites y prioridad

| Prioridad | Acción | Responsable |
| --- | --- | --- |
| 1 | Restaurar o reemplazar los tres medios y sus formatos de `15/`; purgar URLs recuperadas. | Strapi + R2/Cloudflare |
| 2 | Definir no-sobrescritura de objetos y configurar Cache Rule de imágenes con TTL por status. | Cloudflare + operación CMS |
| 3 | Comprobar en producción que imágenes 200 tienen un año y 404 no reciben TTL largo. | Cloudflare + frontend QA |
| 4 | Medir audiencias y probar variante 1600 para heroes. | Strapi/Sharp + frontend QA |
| 5 | Diseñar AVIF con fallback WebP y coste de Cloudflare Images o generación en CMS. | Arquitectura CMS/CDN |

Astro controla markup, selección `srcset` y caché de `/_astro/*`; ya está resuelto en fase 1. Strapi controla los registros y genera las variantes actuales. El provider escribe objetos a R2. Cloudflare/R2 controla el subdominio CDN, sus headers finales, el edge cache y la purga. El frontend no puede reparar objetos ausentes ni cambiar `Cache-Control` de otro origen.
