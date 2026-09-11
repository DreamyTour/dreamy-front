# Rendimiento de imágenes en producción — fase 3

Fecha de medición: 11 de septiembre de 2026. Se usó Google Chrome estable mediante el protocolo DevTools, contra producción, sin throttling artificial. Cada combinación se cargó primero en un contexto nuevo de navegador (`browser-cold`) y después con una recarga del mismo contexto (`browser-warm`). Por tanto, «fría» significa sin caché de navegador, pero no una purga de Cloudflare: las solicitudes de CDN ya podían estar calientes en el edge.

## Método y límites

Se midieron las dos URLs y cinco viewports solicitados. Chrome capturó `PerformanceNavigationTiming`, `PerformanceResourceTiming`, eventos CDP de red, `LargestContentfulPaint` y `LayoutShift`. Las métricas varían naturalmente con la red y el POP de Cloudflare; son una ejecución real por caso, no un percentil de RUM.

La política de recursos cross-origin de `cdn.dreamy.tours` no expone desglose fino de DNS/TCP/TLS en Resource Timing. La duración del recurso hero sí está disponible; para el documento se informa el desglose completo. «Transferido» es `encodedDataLength` de CDP e incluye aproximadamente los headers; «archivo» es `Content-Length`.

No se puede provocar de forma segura una caché de edge realmente fría sin purgar Cloudflare o publicar otra URL. Todos los resultados de red sin caché de navegador recibieron `cf-cache-status: HIT`; esto confirma el comportamiento observado, pero no mide un `MISS` de Cloudflare.

## A. Tabla comparativa: carga sin caché de navegador

Todos los LCP fueron el elemento `IMG` hero. Las medidas son milisegundos salvo CLS y bytes.

| Página | Viewport | TTFB | FCP | LCP | CLS | Candidato / ancho intrínseco | Archivo / transferido | Inicio hero tras TTFB | Duración hero | Prioridad | Variantes hero |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | --- | ---: |
| Blog Ausangate | 390 DPR 1 | 260 | 848 | 848 | 0.0012 | 500w | 41,138 / 41,623 | 8 | 197 | High | 1 |
| Blog Ausangate | 390 DPR 2 | 252 | 564 | 564 | 0.0012 | 1000w | 140,812 / 141,315 | 20 | 259 | High | 1 |
| Blog Ausangate | 768 | 342 | 692 | 740 | 0 | 1000w | 140,812 / 141,416 | 13 | 347 | High | 1 |
| Blog Ausangate | 1366 | 315 | 768 | 784 | 0 | 2000w | 269,060 / 269,611 | 15 | 360 | High | 1 |
| Blog Ausangate | 1920 | 450 | 812 | 1,048 | 0 | 2000w | 269,060 / 269,720 | 15 | 527 | High | 1 |
| Tour Choquequirao | 390 DPR 1 | 366 | 856 | 856 | 0.0012 | 500w | 36,952 / 37,438 | 12 | 339 | High | 1 |
| Tour Choquequirao | 390 DPR 2 | 318 | 656 | 956 | 0.0012 | 1000w | 126,918 / 127,523 | 4 | 606 | High | 1 |
| Tour Choquequirao | 768 | 376 | 660 | 728 | 0 | 1000w | 126,918 / 127,421 | 7 | 269 | High | 1 |
| Tour Choquequirao | 1366 | 255 | 576 | 676 | 0.0007 | 2000w | 321,790 / 322,312 | 15 | 326 | High | **2** |
| Tour Choquequirao | 1920 | 249 | 588 | 652 | 0.0004 | 2000w | 321,790 / 322,316 | 13 | 324 | High | **2** |

El ancho indicado es el descriptor del `srcset`, que identifica el ancho intrínseco del archivo. `naturalWidth` del DOM cambia con la densidad y el tamaño CSS, por lo que no se empleó para ese dato.

### URLs seleccionadas

| Página | 390 DPR 1 | 390 DPR 2 y 768 | 1366 y 1920 |
| --- | --- | --- | --- |
| Blog Ausangate | `https://cdn.dreamy.tours/small_Ausangate_Trek_Peru_829db7f6e3.webp` (500w) | `https://cdn.dreamy.tours/large_Ausangate_Trek_Peru_829db7f6e3.webp` (1000w) | `https://cdn.dreamy.tours/15/Ausangate_Trek_Peru_829db7f6e3.webp` (2000w) |
| Tour Choquequirao | `https://cdn.dreamy.tours/small_choquequirao_trek_286896c6a4.webp` (500w) | `https://cdn.dreamy.tours/large_choquequirao_trek_286896c6a4.webp` (1000w) | `https://cdn.dreamy.tours/4/choquequirao_trek_286896c6a4.webp` (2000w) |

## B. Descomposición del LCP

La fórmula usada es `LCP = TTFB + resource load delay + resource load duration + element render delay`. Las cuatro columnas siguientes suman el LCP observado, con redondeo.

| Página | Viewport | TTFB | Delay de recurso | Duración de recurso | Delay de render | LCP | Cuello de botella en la ejecución |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Blog | 390 DPR 1 | 260 | 8 | 197 | 383 | 848 | Render, caso aislado |
| Blog | 390 DPR 2 | 252 | 20 | 259 | 32 | 564 | Descarga hero |
| Blog | 768 | 342 | 13 | 347 | 38 | 740 | TTFB y descarga, similares |
| Blog | 1366 | 315 | 15 | 360 | 94 | 784 | Descarga hero |
| Blog | 1920 | 450 | 15 | 527 | 56 | 1,048 | Descarga hero; TTFB relevante |
| Tour | 390 DPR 1 | 366 | 12 | 339 | 139 | 856 | TTFB y descarga |
| Tour | 390 DPR 2 | 318 | 4 | 606 | 29 | 956 | Descarga hero |
| Tour | 768 | 376 | 7 | 269 | 76 | 728 | TTFB |
| Tour | 1366 | 255 | 15 | 326 | 79 | 676 | Descarga; hay duplicación publicada |
| Tour | 1920 | 249 | 13 | 324 | 66 | 652 | Descarga; hay duplicación publicada |

El descubrimiento es correcto: el hero comienza 4–20 ms después del TTFB. No hay base para modificar el mecanismo de descubrimiento o el `fetchpriority`.

### TTFB del HTML

El TTFB del documento fue 249–450 ms. En la muestra, el tiempo de espera del servidor fue 123–165 ms; DNS y conexión segura explicaron el resto.

| Página | DNS | Conexión segura (incluye TLS) | Espera servidor | Transferencia HTML | TTFB observado |
| --- | ---: | ---: | ---: | ---: | ---: |
| Blog | 7–55 | 107–257 | 123–165 | 31–103 | 252–450 |
| Tour | 10–82 | 109–137 | 129–157 | 14–61 | 249–376 |

El servidor contribuye al LCP, especialmente en tablet y móvil, pero no es el único ni el mayor coste consistente. Antes de optimizar backend conviene repetir desde los mercados de usuarios con RUM; en esta muestra la conexión y el hero pesan al menos tanto como la espera del servidor.

## C. Recursos críticos y competencia

El hero, la fuente WOFF2 y `/_astro/main.GBKFx6Ma.css` empiezan prácticamente a la vez. En tour también empieza `/_astro/MapTab.B2k4QVOw.css`. La CSS es render-blocking y tardó aproximadamente 163–324 ms; la fuente, 171–259 ms. Los módulos `MobileMenu` y `ContactForm`, y el beacon de Cloudflare, no son render-blocking.

Esto puede contribuir al FCP y al pequeño retraso de render, pero no retrasó el descubrimiento del hero y no hay un patrón de `element render delay` alto que justifique una modificación de CSS, fuentes o JavaScript en esta fase. El caso de 383 ms del blog a 390 DPR 1 debe confirmarse con una muestra repetida antes de actuar.

Las banderas y el logo se solicitan junto con el hero, pero son SVG pequeños. Las fotografías de contenido se iniciaron después del hero y con prioridad baja. La competencia material publicada está en la página de tour a 1366 y 1920:

- El `preload` publicado sólo contiene candidatos hasta 1000w y selecciona `large_choquequirao_trek_286896c6a4.webp`.
- El `img` publicado tiene además el candidato original 2000w y selecciona `https://cdn.dreamy.tours/4/choquequirao_trek_286896c6a4.webp`.
- Chrome descarga ambas variantes. Esto suma una transferencia adicional de la variante 1000w en esos viewports.

El blog sí tiene el mismo `srcset` completo en preload e imagen y descargó una única variante en los cinco casos. La corrección de fase 1 está en este repositorio, pero esa corrección concreta aún no está desplegada en la página de tour de producción.

## D. CDN y caché

En las diez cargas sin caché de navegador, el hero respondió con:

| Header | Resultado |
| --- | --- |
| `cache-control` | `max-age=14400` |
| `cf-cache-status` | `HIT` en todos los casos |
| `age` | 1,379–2,383 s, según objeto y momento |
| Prioridad de red | `High` |

No se observó `MISS` ni `DYNAMIC` en esas cargas. La recarga caliente del navegador reutilizó el recurso localmente y CDP registró aproximadamente 0.1–0.2 ms de duración del hero y 0 bytes transferidos; por tanto, no representa otra consulta a Cloudflare ni debe interpretarse como un nuevo `HIT` de edge.

La medición respalda la decisión de la fase 2: no activar `immutable` hasta que R2 publique claves que nunca se sobrescriban. Cambiar el TTL no reduce la transferencia de una primera visita cuando el edge ya está en `HIT`; beneficia visitas posteriores y la carga sobre el origin.

## E. Caché fría de navegador frente a caliente

| Página | Viewport | LCP sin caché navegador | LCP recarga caliente | Diferencia |
| --- | ---: | ---: | ---: | ---: |
| Blog | 390 DPR 1 | 848 | 184 | 664 |
| Blog | 390 DPR 2 | 564 | 228 | 336 |
| Blog | 768 | 740 | 200 | 540 |
| Blog | 1366 | 784 | 216 | 568 |
| Blog | 1920 | 1,048 | 216 | 832 |
| Tour | 390 DPR 1 | 856 | 252 | 604 |
| Tour | 390 DPR 2 | 956 | 216 | 740 |
| Tour | 768 | 728 | 200 | 528 |
| Tour | 1366 | 676 | 232 | 444 |
| Tour | 1920 | 652 | 216 | 436 |

CLS fue 0 en todas las recargas calientes. El HTML siguió teniendo TTFB de 118–158 ms, pero el hero dejó de usar red. La diferencia confirma que la transferencia y la latencia de recursos siguen siendo relevantes para primeras visitas.

## F. Simulación de variante 1600 px para Choquequirao a 1366 px

Se parte de la imagen WebP original 2000w realmente transferida en ese viewport, sin cambios de infraestructura:

| Recurso | Tamaño |
| --- | ---: |
| WebP 2000 actual | 321,790 B (314.2 KiB) |
| WebP 1600 estimado | 228,772 B (223.4 KiB) |
| Ahorro absoluto | 93,018 B (90.8 KiB) |
| Ahorro porcentual | 28.9% |

La duración observada del 2000w fue 326 ms. Manteniendo la tasa de transferencia de esa ejecución, 93 KB menos equivalen aproximadamente a 95 ms menos de duración de recurso; el efecto potencial máximo similar sobre LCP es del orden de 95 ms, si el render delay no cambia. Es una estimación: compresión, POP y congestión cambian entre solicitudes.

El beneficio es real, pero no supera la prioridad de publicar la alineación preload/`srcset`: hoy el tour descarga también un 1000w innecesario en 1366 y 1920. Tras desplegar la fase 1, se debe repetir esta misma medición y decidir si ~90 KiB y ~95 ms justifican generar y mantener 1600w.

## G. Siguiente cambio recomendado

1. **Desplegar la corrección de fase 1 para HeroImage.** Es el cambio de mayor evidencia: elimina una petición hero duplicada ya observada en producción de tour para 1366 y 1920, sin alterar URLs, SEO ni CMS.
2. **Corregir los tres objetos R2 ausentes de fase 2.** Sigue siendo una prioridad de integridad, aunque no participaron en estas dos páginas.
3. **Repetir esta medición tras el despliegue y decidir 1600w.** Su beneficio estimado es moderado y se limita principalmente a anchos de escritorio intermedios.
4. **Instrumentar RUM/mediciones regionales antes de tocar TTFB, CSS o fuentes.** El TTFB y el CSS aparecen en el camino crítico, pero una sola ejecución no atribuye una regresión estable a ninguno.
5. **Mantener AVIF para una fase posterior.** No hay evidencia aquí que convierta AVIF en más prioritario que eliminar la descarga duplicada y los 404.
6. **Mantener la política de caché actual hasta tener claves inmutables.** Cuando esa garantía exista, aplicar una regla CDN sólo a assets versionados, nunca a HTML/API dinámicos, como se documentó en la fase 2.

## H. Qué depende de cada capa

| Acción | Capa responsable |
| --- | --- |
| Publicar preload y `srcset` alineados de HeroImage | Código frontend y despliegue de producción |
| Eliminar los tres 404 | Datos/objetos en Strapi y R2 |
| Generar 1600w | Pipeline de medios de Strapi/provider y CDN/R2 |
| `Cache-Control` de assets | Configuración Cloudflare/CDN/origin, no Astro |
| TTFB del documento | Hosting/origin, Cloudflare y ruta de red |
| CSS, fuentes y módulos críticos | Frontend, sólo tras confirmar con muestras repetidas |
| AVIF | Provider/pipeline de Strapi y compatibilidad CDN |

## Artefacto reproducible

El script `tests/production-performance-audit.mjs` reproduce la captura y deja el JSON de cada ejecución en `.astro/production-performance-phase-3.json` (artefacto ignorado por Git). Se añadió sólo para observación; no modifica producción.
