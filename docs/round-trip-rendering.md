# Visualización de ida y vuelta

Versión local en `feat/round-trip-rendering-local`. Solo presentación: no cambia GPX, routePlan, protocolo 2, API, guardado ni restauración. No se publica como parte de esta tarea.

## Detección

Se emparejan únicamente GPX guardados vigentes, sin revisión pendiente, del mismo medio (tren, bus o embarcación). Se comparan todos los vértices en orden inverso, con igual número de puntos y tolerancia máxima de 0,25 m por punto para redondeo. No se desplazan coordenadas para obtener coincidencias. Se rechazan variantes, coincidencias parciales, distintos muestreos y circuitos con extremos a menos de 10 m. La primera aparición del itinerario es ida naranja `#E77A28`; la pareja es regreso coral `#DB5260`.

La detección y los datos de presentación se memorizan según sus entradas; no se repiten al mover la cámara. Las rutas sin pareja conservan `TransportRoute` y sus estilos habituales, incluidos arcos existentes. No hay cambios funcionales de barcos ni vuelos.

## Renderer nativo

`RoundTripRoutes.tsx` utiliza una fuente GeoJSON y cinco capas MapLibre: halo exterior, halo oscuro, línea de color, reservas invisibles de estaciones y símbolos direccionales. Se crean una vez por ciclo de vida del mapa/estilo. `setData` solo se ejecuta al cambiar los datos visibles o los marcadores; el cambio de fondo actualiza la opacidad del halo. No hay listeners de cámara, `requestAnimationFrame`, proyección manual de vértices, SVG ni estado React por frame.

Cada línea usa `line-offset: 4` píxeles siguiendo su orden real. Como la pareja tiene coordenadas inversas, los trazados quedan en lados opuestos, separados 8 px entre ejes en vista completa. Los símbolos usan el mismo desplazamiento lateral (`icon-offset: [0,4]`), `symbol-placement: line`, orientación de mapa y `icon-keep-upright: false`: siguen la tangente y no invierten el sentido de viaje para mantenerse derechos. Espaciado nativo de 220 px y colisiones activas limitan la densidad. Los extremos GPX y las ubicaciones de los marcadores reservan cajas de colisión invisibles; los marcadores y popups DOM permanecen encima del canvas.

Las coordenadas de las fuentes siguen siendo exactamente las coordenadas originales. `tolerance: 0` evita simplificación adicional del GeoJSON por tolerancia; la teselación/proyección normal del motor es solo presentación. No hay reprocesamiento ni escritura de GPX.

## Vistas

MapTab detecta antes de filtrar por día. Día 1 muestra solo sus tramos; Día 2, los suyos. Un recorrido sin su pareja visible usa offset cero y conserva color/sentido. La vista completa restaura ambos. La leyenda incorpora texto ES/EN/PT para complementar los colores.

El editor comparte el renderer cuando ambos sentidos existen en el plan del día abierto. No recibe datos de otros días ni añade mensajes al protocolo 2. `RouteMapPreview.tsx`, que usa otro motor estático, permanece sin cambios.

## Verificación y alcance

- Unitarias: procedencia GPX, tolerancia, variantes, orden, medios, fuentes intactas, offset individual/completo y reservas de marcadores.
- Integración: MapTab/editor reales, Chromium con MapLibre/WebGL, mapas base locales y todas las peticiones externas bloqueadas. Comprueba fuentes, estilos nativos, píxeles de flechas sobre líneas, sentidos opuestos, zoom, giro, selección de día, bus/embarcación, ruta distinta y ausencia de escrituras.
- Benchmark reproducible: `node tests/round-trip-rendering.performance.mjs <checkout> <informe.json>`. Requiere el GPX original local de 1.431 puntos en `artifacts/ollantaytambo-aguas-calientes-tren/`. Ejecutar checkouts secuencialmente, sin otras cargas. Tres pasadas tras calentamiento por escenario.
- Las capturas e informes JSON quedan en `artifacts/round-trip-rendering/`; no se incluyen en el commit.
- Resultados y límites: [rendimiento y validación final](round-trip-performance.md). La [revisión anterior](round-trip-final-review.md) conserva evidencia histórica del fallo SVG y los problemas preexistentes de Biome/idiomas.

No cambian dependencias, contratos, persistencia, CMS ni infraestructura. El lint global y el test de idiomas tienen problemas preexistentes demostrados en la revisión anterior; no se corrigen aquí.

## Límites

Se prueban escritorio y viewport móvil de 390 px, con fondo claro y fondo oscuro local mediante el selector satélite. Quedan pendientes teselas satelitales externas reales, dispositivos físicos y lector de pantalla manual. SwiftShader no sustituye una GPU móvil. Curvas extremadamente cerradas pueden comprimir carriles visuales; la separación no representa vías físicas. La detección conservadora deja sin emparejar geometrías remuestreadas o parcialmente compartidas.
