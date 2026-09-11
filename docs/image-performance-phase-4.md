# Validación en producción de HeroImage — fase 4

Fecha: 11 de septiembre de 2026. Commit desplegado: `7b36dfb` (`fix: align hero preload candidates`). El despliegue de Cloudflare Workers Builds se activó desde `main`; se verificó después leyendo el HTML público de ambas páginas y ejecutando `tests/production-performance-audit.mjs` contra producción.

## A. Confirmación de la versión desplegada

La página de tour publicada ahora emite estas dos fuentes con el mismo contrato:

- `preload.href`: `https://cdn.dreamy.tours/4/choquequirao_trek_286896c6a4.webp`
- `img.src`: `https://cdn.dreamy.tours/4/choquequirao_trek_286896c6a4.webp`
- `imagesrcset` y `img.srcset`: 500w, 750w, 1000w y 2000w, con las mismas URLs.
- `imagesizes` y `img.sizes`: `100vw`.

El blog conserva el mismo patrón alineado, usando su original Ausangate 2000w como `href`/`src`. La implementación compartida es `getHeroImage()` más `HeroImage.astro`; no se modificó su selección de candidatos durante esta fase.

## Método

La auditoría usó Chrome 153 y CDP sobre las páginas de producción. Cada combinación se cargó sin caché de navegador y después se recargó con caché caliente. Para evitar un fallo del canal de depuración por pipe en esta máquina, el script admite `CDP_ENDPOINT` y se conectó al mismo Chrome mediante su puerto de depuración; los observers, eventos CDP y escenarios del script no cambiaron.

Las cifras varían con red y POP de Cloudflare. Por ello, la comparación before/after sirve para verificar el número de requests y los bytes eliminados; no atribuye una diferencia de LCP a la corrección cuando TTFB y duración de red cambiaron entre ejecuciones.

## B y C. Resultado por viewport tras el deploy

`Archivo` es `Content-Length`; `transferido` es `encodedDataLength` de CDP e incluye aproximadamente los headers. Todas las solicitudes hero tuvieron prioridad `High`, `Cache-Control: max-age=14400` y `cf-cache-status: HIT`.

| Página | Viewport | Requests hero | Candidato descargado | Archivo / transferido | TTFB | LCP | Delay recurso | Duración recurso | Delay render |
| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Blog | 390 DPR 1 | 1 | 500w | 41,138 / 41,661 B | 618 | 1,172 | 5 | 371 | 178 |
| Blog | 390 DPR 2 | 1 | 1000w | 140,812 / 141,411 B | 353 | 740 | 14 | 342 | 32 |
| Blog | 768 | 1 | 1000w | 140,812 / 141,393 B | 375 | 760 | 9 | 346 | 30 |
| Blog | 1366 | 1 | 2000w | 269,060 / 269,796 B | 358 | 820 | 16 | 399 | 48 |
| Blog | 1920 | 1 | 2000w | 269,060 / 269,811 B | 363 | 836 | 12 | 405 | 56 |
| Tour | 390 DPR 1 | 1 | 500w | 36,952 / 37,467 B | 256 | 680 | 17 | 371 | 36 |
| Tour | 390 DPR 2 | 1 | 1000w | 126,918 / 127,420 B | 370 | 776 | 12 | 357 | 37 |
| Tour | 768 | 1 | 1000w | 126,918 / 127,524 B | 391 | 928 | 21 | 488 | 29 |
| Tour | 1366 | **1** | **2000w** | 321,790 / 322,500 B | 354 | 912 | 7 | 468 | 83 |
| Tour | 1920 | **1** | **2000w** | 321,790 / 322,508 B | 409 | 908 | 15 | 430 | 53 |

URLs seleccionadas:

| Página | 390 DPR 1 | 390 DPR 2 y 768 | 1366 y 1920 |
| --- | --- | --- | --- |
| Blog | `https://cdn.dreamy.tours/small_Ausangate_Trek_Peru_829db7f6e3.webp` | `https://cdn.dreamy.tours/large_Ausangate_Trek_Peru_829db7f6e3.webp` | `https://cdn.dreamy.tours/15/Ausangate_Trek_Peru_829db7f6e3.webp` |
| Tour | `https://cdn.dreamy.tours/small_choquequirao_trek_286896c6a4.webp` | `https://cdn.dreamy.tours/large_choquequirao_trek_286896c6a4.webp` | `https://cdn.dreamy.tours/4/choquequirao_trek_286896c6a4.webp` |

La caché caliente del navegador tuvo 1 request registrado por el navegador, pero 0 B transferidos y una duración del hero de 0.1–0.2 ms; se reutilizó el recurso local. Esto no es una segunda consulta a Cloudflare.

## D y E. Comparativa before/after

Baseline: carga fría de [fase 3](image-performance-phase-3.md). Las columnas de bytes son la suma de **todas** las solicitudes que pertenecen al conjunto de candidatos hero.

| Página | Viewport | Requests antes → después | Bytes transferidos antes → después | Duración del hero seleccionado antes → después | LCP antes → después |
| --- | ---: | --- | --- | --- | --- |
| Blog | 390 DPR 1 | 1 → 1 | 41,623 → 41,661 B | 197 → 371 ms | 848 → 1,172 ms |
| Blog | 390 DPR 2 | 1 → 1 | 141,315 → 141,411 B | 259 → 342 ms | 564 → 740 ms |
| Blog | 768 | 1 → 1 | 141,416 → 141,393 B | 347 → 346 ms | 740 → 760 ms |
| Blog | 1366 | 1 → 1 | 269,611 → 269,796 B | 360 → 399 ms | 784 → 820 ms |
| Blog | 1920 | 1 → 1 | 269,720 → 269,811 B | 527 → 405 ms | 1,048 → 836 ms |
| Tour | 390 DPR 1 | 1 → 1 | 37,438 → 37,467 B | 339 → 371 ms | 856 → 680 ms |
| Tour | 390 DPR 2 | 1 → 1 | 127,523 → 127,420 B | 606 → 357 ms | 956 → 776 ms |
| Tour | 768 | 1 → 1 | 127,421 → 127,524 B | 269 → 488 ms | 728 → 928 ms |
| Tour | 1366 | **2 → 1** | **449,729 → 322,500 B** | 326 → 468 ms | 676 → 912 ms |
| Tour | 1920 | **2 → 1** | **449,732 → 322,508 B** | 324 → 430 ms | 652 → 908 ms |

En 1366 y 1920, el cambio elimina la descarga concurrente 1000w de aproximadamente 127.2 KB transferidos: 28.3% menos bytes del grupo hero. La duración y LCP de esas dos ejecuciones postdeploy son mayores por condiciones de red distintas: por ejemplo, el TTFB de tour pasó de 255/249 ms a 354/409 ms. No es válido presentar esos LCP como una regresión causada por HeroImage cuando la solicitud redundante sí desapareció y el recurso seleccionado siguió siendo el mismo 2000w.

## F. Cierre de la corrección HeroImage

**Corrección cerrada.** En desktop, el tour no descarga simultáneamente 1000w y 2000w. Sólo se descarga el 2000w que Chrome selecciona para el `srcset`. Blog permanece con una sola variante en los cinco viewports. También se conservan prioridad `High`, descubrimiento temprano y las cabeceras CDN previas.

## G. Nueva evaluación de 1600w después del fix

Para tour a 1366 px, ya sin la duplicación:

| Concepto | Valor |
| --- | ---: |
| WebP actual 2000w | 321,790 B (314.2 KiB) |
| WebP estimado 1600w | 228,772 B (223.4 KiB) |
| Ahorro | 93,018 B (90.8 KiB, 28.9%) |
| Duración postfix observada del 2000w | 468 ms |
| Cuerpo transferido tras recibir headers | 305 ms |
| Ahorro estimado de descarga del cuerpo | ~88 ms |
| LCP postfix observado | 912 ms |
| Impacto máximo estimado sobre este LCP | ~88 ms, 9.6% |

Los 88 ms usan la tasa de transferencia de la propia ejecución postdeploy: 93,018 B menos sobre los ~305 ms de cuerpo después de headers. Es un máximo práctico; la latencia de request, el render delay y la variación de red no disminuyen con el tamaño. La variante 1600w sigue siendo útil para 1366 px, pero su beneficio potencial es moderado y ya no se confunde con la descarga duplicada.

## H. Siguiente paso

No implementar más optimizaciones todavía. La siguiente acción debe ser repetir varias muestras postdeploy, preferiblemente con RUM o desde las regiones de tráfico real, para obtener mediana/p75 de 1366 px. Si se mantiene un ahorro cercano a 90 KB y 70–90 ms de descarga, entonces 1600w merece una fase separada en Strapi/CDN. AVIF, Cache Rules, CSS, fuentes, JavaScript y cambios de infraestructura quedan fuera de esta fase.

## Validación local antes del deploy

- `bun run test`: 61 tests, 0 fallos.
- `bun run build`: completó correctamente.
- El HTML construido para tours contiene el mismo `srcset` de cuatro candidatos tanto en preload como en imagen.
