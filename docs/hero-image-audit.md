# Auditoría de imágenes hero — Dreamy Tours

## A. Diagnóstico

Se inspeccionaron las dos páginas públicas indicadas, su HTML, las solicitudes de Chrome, el código Astro y respuestas reales del CMS local configurado en `.env`. No se modificó Strapi ni se desplegó el proyecto.

- **Tour Choquequirao:** el preload ofrecía 500/750/1000 px, mientras el `<img>` ofrecía también el original de 2000 px. Chrome a 1440 px descargó **dos archivos**: 126.918 bytes de `large` y 321.790 bytes del original. El preload no anticipaba el recurso que finalmente se mostraba.
- **Blog Ausangate:** ya tenía `eager`, prioridad alta, decodificación asíncrona, dimensiones y preload responsivo coincidente. Chrome descargó un solo hero. No se encontró aquí el mismo defecto del tour.
- Ambos heroes están en el HTML inicial como `<img>`, sin depender de hidratación ni de `background-image` para descubrir su URL.
- El tour declaraba 1440×760 aunque el archivo es 2000×900. Las alturas de sus contenedores ya reservaban espacio.
- El CMS entrega `portadaImage` para artículos e `imagenDestacada` para tours; el código admite imagen única o arreglo de destacadas. `blogRoutes.ts` y las rutas dinámicas obtienen estos datos mediante `strapi.ts`. `helpers.ts` conserva las URLs absolutas de Strapi; solamente resuelve las relativas contra `VITE_STRAPI_URL`.
- Las URLs del CDN ya vienen en los objetos de medios. El proveedor declarado es `strapi-provider-cloudflare-r2`. Los originales pueden estar en carpetas `/4/`, `/15/`, etc., mientras las variantes están en la raíz. No se deben reconstruir sus rutas a partir del nombre del original.
- Las variantes observadas son WebP de **500, 750 y 1000 px**, además del original de **2000 px** para las referencias. No se observaron variantes AVIF de esos medios. La prueba `?width=768` del tour devolvió los mismos 321.790 bytes que el original; no se utiliza esa supuesta transformación.

## B–C. Archivos y cambios

| Archivo | Cambio |
| --- | --- |
| `src/lib/heroImage.ts` | Descriptor compartido con URL, variantes reales, `sizes`, dimensiones y alt. Selecciona la última destacada válida, admite tamaños personalizados existentes y reutiliza la deduplicación por ancho del helper actual. |
| `src/components/ui/HeroImage.astro` | Renderiza exclusivamente heroes con `eager`, `high` y `async`, sin JS. Permite imagen decorativa con `alt=""`. |
| `src/components/pages/BlogPostPage.astro` | Comparte el descriptor entre preload e imagen. Conserva alt decorativo, SEO y alturas. |
| `src/components/pages/DynamicContentPage.astro` | Calcula una sola vez el hero del tour y pasa exactamente esos datos al layout y a `TourHero`. Conserva la selección independiente de imagen SEO. |
| `src/components/tours/TourHero.astro` | Usa el componente compartido; elimina construcción duplicada del srcset y dimensiones ficticias. Mantiene recorte, clases y animación. |
| `src/layouts/TourLayout.astro` | Propaga `lcpImageSizes`. |
| `src/layouts/main.astro` | Permite `imagesizes` coincidente con el hero. Retira del comentario una promesa de mejora de 1–2 segundos que no estaba respaldada por mediciones. |
| `src/lib/heroImage.test.ts` | Cinco pruebas de variantes, original, selección de medios, metadatos ausentes y fallback. |
| `tests/hero-images.audit.mjs` | Auditoría reproducible en Chrome del HTML compilado: selección responsiva, decodificación, igualdad de preload y una sola solicitud. |
| `tests/navigation.spec.ts` | Elimina una opción `reducedMotion` inválida que impedía pasar el chequeo TypeScript; el `beforeEach` ya aplica esa preferencia correctamente. |
| `docs/hero-image-audit.md` | Este informe. |

El fallback anterior `/og-default.jpg` no existe en `public`. Para heroes sin medio válido se reutiliza `/dreamy-tours-web-og.jpg`, existente, de 1260×600. No se altera el fallback SEO global.

## D–E. Antes y ahora

Antes el tour construía el preload y el hero por separado y con candidatos distintos. Ahora ambos consumen el mismo descriptor, incluido el original de alta resolución. La lógica compartida también se usa en artículos para evitar futuras divergencias. El navegador elige entre archivos existentes; no se generan copias ni URLs nuevas del CDN.

Se conserva el preconnect existente a `https://cdn.dreamy.tours`, sin `crossorigin`, coherente con las solicitudes de estos `<img>` sin CORS. No se añaden conexiones duplicadas ni preload de imágenes secundarias. El preload del hero permanece temprano, antes de las fuentes.

Las imágenes del cuerpo, tarjetas y footer conservan sus políticas de carga diferida. Los dos logos de cabecera comparten una URL SVG y Chrome observó una sola solicitud; no se atribuye a ellos un ahorro no medido. Los módulos del navegador y la búsqueda del blog pueden competir por recursos, pero no condicionan el descubrimiento de los heroes. No se cambió su comportamiento sin evidencia de un retraso atribuible a ellos.

## F. Impacto esperado y límites

| Aspecto | Resultado |
| --- | --- |
| LCP del tour | El recurso correcto puede comenzar desde el head; se elimina competencia de una descarga inútil. No se promete un ahorro específico en milisegundos. |
| Transferencia del hero en escritorio | En el escenario observado: 448.708 → 321.790 bytes, **126.918 bytes menos**, aproximadamente **28,3 %** del total antes descargado para ese hero. |
| Móvil | Mantiene selección responsiva ya existente: el tour usó 36.952 bytes a 390 px DPR 1 y 126.918 bytes a DPR 2. No se presenta esto como un ahorro nuevo frente al móvil anterior. |
| CLS | Dimensiones intrínsecas correctas y alturas reservadas conservadas. No se afirma una reducción medida del CLS total de la página. |
| Blog | Conserva la carga ya optimizada; el beneficio directo es centralizar y aceptar futuros tamaños reales sin repetir lógica. |
| Carga inicial | Una solicitud menos del hero en escritorio del tour. Sin JS adicional para imágenes. |

`sizes="100vw"` conserva la selección y el diseño actuales. DPR, zoom, recorte `object-cover` y disponibilidad de variantes influyen en la resolución percibida; no se limita artificialmente la resolución móvil. Un móvil de alta densidad puede necesitar el original si falta un tamaño intermedio. Las alturas altas con imágenes panorámicas implican un recorte importante, como antes.

## Pruebas realizadas

- `bun run build`: compilación completa. Persiste una advertencia de chunks superiores a 500 kB; no es un error de compilación ni demuestra por sí misma un bloqueo del LCP.
- `bun run check`: **0 errores, 0 advertencias, 0 hints**.
- `bun run test`: **61 pruebas correctas**, incluidas cinco nuevas.
- Comprobación del HTML generado de **168 páginas** de tours/artículos: URL y candidatos de preload coinciden con la imagen.
- Ocho archivos de las dos referencias públicas (original y tres variantes por página): **HTTP 200, WebP**.
- Diez escenarios del HTML compilado en Chrome: **una solicitud de hero por escenario**, decodificación correcta, URL/srcset/sizes coincidentes y selección de tamaño verificada.

| Viewport / DPR | Tour y blog de prueba: ancho descargado |
| --- | --- |
| 390 / 1 | 500 px |
| 390 / 2 | 1000 px |
| 768 / 1 | 1000 px |
| 1440 / 1 | 2000 px |
| 1920 / 1 | 2000 px |

Para repetir las pruebas de navegador, con Chrome instalado y acceso al CDN:

```sh
bun run build
node tests/hero-images.audit.mjs
```

El script sirve los archivos compilados mediante interceptación local de Playwright, sin publicar cambios. Puede recibir dos rutas HTML alternativas relativas a `dist/client`. Prueba Choquequirao y `mal-de-altura-cusco`: **el CMS local no contiene `guia-ausangate-trek`**. Ausangate se inspeccionó en producción, donde su preload ya era correcto. No se hizo una comparación Lighthouse antes/después ni una medición de campo de LCP/CLS.

## G. Validación tras desplegar

1. Abrir las dos referencias en Chrome, desactivar caché y recargar con Network abierto. Filtrar por el nombre del hero: debe existir una única solicitud de la variante seleccionada, con prioridad alta.
2. Verificar `currentSrc`, `srcset`, `sizes`, dimensiones y los atributos del preload. Repetir con contextos nuevos a 390 px DPR 1/2 y 1440/1920 px; reutilizar una caché con el original puede afectar la selección observada.
3. Revisar que no haya avisos de preload sin usar ni respuestas 404. Confirmar que las imágenes del contenido siguen con `loading="lazy"` y `decoding="async"`.
4. En Performance, identificar el elemento LCP y separar TTFB, retraso hasta iniciar imagen, descarga y renderizado. Revisar Layout Shifts y el recorte visual, también con movimiento reducido.
5. Ejecutar varias pasadas Lighthouse móvil con las mismas condiciones antes/después y comparar medianas. La auditoría de solicitudes no sustituye esa medición.

## H. Pendientes de CMS/CDN

- El CDN respondió `Cache-Control: max-age=14400` (cuatro horas), con estados HIT/MISS/REVALIDATED. El proyecto solamente genera caché inmutable anual para `/_astro/*`; eso no controla otro dominio. Una política más larga para archivos con hash debe establecerse en el origen/CDN, verificando que esos archivos no se sobrescriban.
- Para contar con 480/768/1280/1920 exactos o aproximaciones más cercanas, configurar variantes en Strapi y regenerar medios antiguos, o habilitar una transformación real documentada del CDN. El helper aceptará nuevas claves de tamaño presentes en `formats`. No se inventó una variante 1280 inexistente.
- Para AVIF con fallback WebP, primero deben existir las URLs y una estructura verificable de formatos alternativos. Actualmente se conserva WebP; no se presume que Cloudflare lo convierta por cambiar la extensión o añadir un parámetro.
- Tres artículos del CMS **local** apuntan a originales y variantes `small` que devuelven 404: `cuando-viajar-peru`, `como-llegar-a-machu-picchu` y `puerto-maldonado`. Son referencias existentes antes de los cambios. Se requiere restaurar sus objetos o corregir/sincronizar sus medios en Strapi; no se ocultaron los fallos mediante otra descarga de fallback. No se puede afirmar que todo el catálogo carezca de imágenes rotas.

Los cambios permanecen sin commit, revisables mediante `git diff`; los archivos nuevos aparecen en `git status --short`. No se tocaron contenido, slugs, URLs públicas, datos del CMS ni estilos del hero.

Referencias técnicas consultadas: [imágenes de CMS/CDN en Astro](https://docs.astro.build/en/guides/images/), [preconnect en MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preconnect), [opciones de Playwright](https://playwright.dev/docs/api/class-testoptions).
