# Rendimiento y validación final de ida y vuelta

Fecha: 13/11/2026. Rama: `feat/round-trip-rendering-local`. Referencia: `origin/main = 88dceec41364295dbff34f321f89f39869c71e09`, en worktree detached con las mismas dependencias. Sin push, merge ni despliegue.

## Causa demostrada

El renderer anterior escuchaba `render`, proyectaba todos los vértices, generaba nuevos paths SVG y actualizaba React en cada frame. El perfil con dos recorridos inversos de 1.431 puntos registró 215.475 llamadas a `project`, 75 cálculos y 74 renders React durante 75 iteraciones de cámara. El cálculo de dibujo sumó 188,1 ms (unos 2,5 ms por iteración). No se ejecutaron detecciones de parejas ni se recrearon fuentes/capas durante la interacción.

La ablación ocultó únicamente el SVG, conservando proyecciones, cálculos y actualizaciones React. La mediana bajó de **150,9 a 16,8 ms** (p95: 168,2 a 27,7 ms), mientras el cálculo de dibujo siguió costando 199,7 ms en total. Esto aísla el repintado/composición de los paths SVG como cuello principal; no demuestra un tiempo exacto de GPU. La regresión no procedía de comparar GPX en cada frame ni de `setData` excesivo.

Evidencia local del perfil y la ablación: `artifacts/round-trip-rendering/optimization/profile-before.json` y `profile-svg-hidden.json`. Las mediciones históricas de 29,6–29,8 ms en main frente a 153,1–154,0 ms usaban el fixture sintético de 1.431 puntos de la revisión anterior. Se conservan en el informe histórico. La comparación final siguiente utiliza el GPX ferroviario real en ambos checkouts; no se mezclan ambos conjuntos de entradas.

## Solución

Se sustituyó el SVG por líneas y símbolos nativos de MapLibre, con una fuente GeoJSON, tres capas de línea y dos de símbolos. La cámara se procesa en el motor, sin callbacks de aplicación por frame. Las parejas y los datos visuales se memorizan; la fuente se actualiza al cambiar datos/vista, y las capas/imágenes se crean por ciclo de vida de mapa/estilo. La limpieza contempla que el mapa padre ya se haya desmontado.

Se conservan naranja/coral, offset visual de 4 px por sentido (cero si solo está visible uno), coordenadas exactas, tangente y orden real de viaje. Las flechas usan un sprite de 12×6 px y cajas sin padding adicional para evitar que una caja más alta que los 8 px entre carriles suprima toda la dirección contraria. Las colisiones siguen activas y las estaciones/marcadores tienen reservas de 48 px más margen. Los marcadores DOM continúan encima del canvas.

La prueba recta comprueba **los píxeles reales**: chevrons hacia el este sobre naranja y hacia el oeste sobre coral. Otras comparaciones con iconos visibles/ocultos comprueban que sus píxeles se mantienen sobre las líneas coloreadas en curvas, zoom y giro. Los contratos nativos de offset y orientación se verificaron también contra el código/declaraciones de la dependencia instalada y la [especificación oficial de MapLibre](https://maplibre.org/maplibre-style-spec/layers/).

## Comparación final

Mismo equipo, Chromium 149.0.7827.55 headless, ANGLE/SwiftShader, viewport 1100×1100, mapa de 560 px, estilo local sin teselas externas, zoom inicial 10,5 y mismas coordenadas. El original tiene 1.431 puntos y unos 43,137 km; el segundo recorrido es su secuencia inversa exacta en el fixture. El caso múltiple usa cuatro pares de 1.431 puntos (ocho recorridos), trasladados solo en los datos sintéticos de prueba para distinguirlos. Ningún archivo GPX se modifica.

Tres pasadas por cada combinación, 20 frames de calentamiento y 60 intervalos medidos por pasada. Se informa mediana/p95 de los 180 intervalos; los JSON conservan cada intervalo y cada pasada. Ambos checkouts se ejecutan secuencialmente, sin builds ni otras pruebas durante la medición. Son intervalos RAF durante cambios reales de cámara, no Core Web Vitals ni resultados de una GPU física.

| Vista | Movimiento | Main mediana / p95 (ms) | Optimizado mediana / p95 (ms) |
|---|---|---:|---:|
| full | rotate | 31.0 / 53.4 | 24.2 / 41.5 |
| full | zoom | 30.3 / 55.5 | 23.6 / 38.3 |
| full | pan | 30.1 / 53.5 | 23.8 / 38.7 |
| day1 | rotate | 29.1 / 49.5 | 17.7 / 31.2 |
| day1 | zoom | 28.3 / 51.8 | 19.2 / 30.4 |
| day1 | pan | 28.5 / 50.0 | 17.3 / 24.3 |
| day2 | rotate | 28.1 / 48.7 | 19.3 / 23.3 |
| day2 | zoom | 28.4 / 47.8 | 20.2 / 30.4 |
| day2 | pan | 28.4 / 47.4 | 17.0 / 30.3 |
| multi | rotate | 77.1 / 141.3 | 40.3 / 71.8 |
| multi | zoom | 78.2 / 147.4 | 40.4 / 70.0 |
| multi | pan | 77.9 / 142.7 | 40.6 / 72.5 |

**Objetivo aprobado:** rotacion completa 31.0 -> 24.2 ms (21.9% menos). El limite de +20% era 37.2 ms. p95: 53.4 -> 41.5 ms. Pasadas optimizadas (mediana/p95): 25.3/43.7, 23.5/42.1, 24.0/33.3 ms. Ninguna combinacion supera la referencia en mediana o p95.

En main, seleccionar un día mantiene otros recorridos atenuados; la versión nueva cumple el requisito de mostrar exclusivamente el día elegido. Esa diferencia intencional se incluye en las cifras por día. La comparación principal de vista completa dibuja ambos recorridos en las dos versiones.

El mayor intervalo observado en toda la serie optimizada fue 109,3 ms, frente a 258,3 ms en main. El caso de ocho recorridos sigue rondando 40 ms de mediana bajo renderizado software: mejora la referencia, pero no se presenta como una garantía de 60 FPS.

Durante todas las pasadas optimizadas: **cero renders de RoundTripRoutes, cero detecciones de parejas, cero reconstrucciones de GeoJSON, cero setData y cero altas/bajas o cambios de propiedades de capas por movimiento de cámara**. Las escasas llamadas restantes a `project` pertenecen a marcadores/controles del mapa; no se proyectan manualmente los 2.862 vértices por frame.

Reproducción desde el frontend, con el GPX original local disponible:

```powershell
node tests/round-trip-rendering.performance.mjs <worktree-origin-main> performance-main-comparable.json
node tests/round-trip-rendering.performance.mjs D:/dreamy/dreamy-front performance-optimized-final.json
```

Los informes se guardan en `artifacts/round-trip-rendering/final-review/`; el log final, en `artifacts/round-trip-rendering/optimization/final-performance.log`. Las pruebas incluyen aserciones contra trabajo de geometría, renders y actualizaciones de fuentes/capas durante la cámara.

## Validaciones

| Comprobación | Resultado |
|---|---|
| Unitarias enfocadas: ida/vuelta, seguridad GPX, plan, routing, buscador, transporte | 37 aprobadas, 135 aserciones |
| Suite completa `bun test src` | 220 aprobadas; 1 fallo y 1 error del test de idiomas preexistente |
| MapLibre/WebGL real | 9 escenarios aprobados; píxeles, fuentes intactas, sentidos, vistas, curvas/giros, móvil, bus/embarcación, variante y editor |
| Buscador | 9 casos aprobados |
| Editor/GPX | 17 escenarios aprobados |
| Persistencia | 16 comprobaciones aprobadas en Strapi/SQLite temporal desechable |
| Importador real del GPX de regreso | 10 casos aprobados; sin red ni guardado CMS |
| Astro check | 0 errores, 0 advertencias; un hint previo ajeno |
| Build completo aislado | Compilación y prerender aprobados con CMS ficticio en localhost |
| Biome dirigido TS/TSX | Cinco archivos aprobados con la configuración del proyecto |
| Biome dirigido MJS | Ambos tests aprobados con configuración temporal externa; el proyecto excluye MJS de sus globs |
| Sintaxis Node de ambos MJS y `git diff --check` | Aprobadas |

Logs finales: `artifacts/round-trip-rendering/optimization/final-*.log`. El build utiliza los plugins reales del proyecto y un fixture CMS local; no acredita el catálogo completo de tours reales ni consulta producción. No se cambia configuración del proyecto ni variables persistentes.

El fallo de `languageSelectors.test.ts` sigue siendo `Cannot find module 'layout/MobileMenu.astro?astro&type=style&index=0&lang.css'`. En el worktree de main la revisión anterior demostró 213 aprobadas y el mismo fallo/error; las siete pruebas nuevas explican las 220 actuales. La configuración duplicada de Biome es local y preexistente, no un archivo versionado en main; main limpio tiene además errores de lint previos. La reproducción y los comandos constan en [la revisión histórica](round-trip-final-review.md). Ninguno se modifica en esta corrección.

## Seguridad, archivos y límites

Solo se modifican MapTab y la composición visual del editor; se añaden renderer, helper, unitarias, integración, benchmark y documentación. No cambian protocolo 2, routePlan, importación, confirmaciones, guardado, restauración, endpoints, dependencias, CMS ni infraestructura. Las acciones visuales no emiten mensajes de escritura. Los archivos GPX conservan sus SHA-256:

- Ida: `076e0144fe041fc73919fd6f730213607868193c13476c78448a5f98a4d2c59a`.
- Regreso: `bf3aa2421fb6eb8276da354f561c58ec8f11233f8ab8a75cfc9283fb4d65413c`.

Las capturas incluyen `complete-desktop.png`, `day1.png`, `day2.png`, `zoom-*-bearing-*.png`, `opposite-arrow-directions.png`, `mobile-satellite-detail.png`, `actual-1431-point-gpx.png` y `editor-same-day-pair.png` en el directorio de evidencia. Se revisaron visualmente escritorio, sentidos opuestos y móvil con fondo oscuro local.

Pendientes: satélite externo real, GPU/dispositivo móvil físico y lector de pantalla manual. El fondo oscuro local no acredita todos los contrastes de fotografía satelital. SwiftShader mejora frente al baseline incluso con ocho recorridos, pero no garantiza 60 FPS en todos los equipos. Coincidencias parciales/remuestreadas y casos extremos de curvas muy cerradas mantienen los límites documentados de esta primera versión. No se afirma una auditoría de todos los mapas/tours existentes.

El commit local se prepara únicamente después de aprobar el rendimiento y las validaciones aplicables, dejando fuera GPX, capturas, temporales y cambios ajenos. No se realiza push, merge, despliegue ni acceso al VPS/CMS/Cloudflare.
