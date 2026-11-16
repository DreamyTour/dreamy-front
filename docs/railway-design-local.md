# Propuesta ferroviaria local: una sola vía

Estado: propuesta local revisada; se prepara un commit limitado a los cambios relacionados. Base productiva `d5c1ab721dac5341b2c62a2d932945b519b761a2`. Rama `fix/round-trip-visual-density-local`. Sin push, merge ni despliegue.

## Diseño

El tren utiliza dos rieles finos de carbón `#343434` y travesaños rectangulares perpendiculares. No usa naranja/coral ni flechas permanentes. Se conserva el mismo estilo en vista completa y en cada día. Los nombres de origen y destino, con el día correspondiente, aparecen en una lista accesible fuera del canvas; el sentido ya no depende del color ni de una flecha cartográfica. No se añadieron flechas de selección porque el texto identifica el sentido sin recargar la vía.

No se recibió una imagen adjunta accesible en este tramo de la conversación. Se implementa la descripción de rieles/travesaños y se entregan capturas; la identidad exacta con una referencia gráfica queda pendiente de compararla con el usuario.

## Implementación

`RailwayRoutes.tsx` añade una fuente GeoJSON y **tres capas nativas de línea**, con `tolerance: 0`:

1. Contraste claro discreto alrededor de los rieles, con más opacidad sobre satélite.
2. Travesaños mediante `line-dasharray`, terminaciones `butt` y ancho transversal mayor que el de los rieles.
3. Dos rieles mediante `line-gap-width`, conservando transparente el espacio entre ellos.

El motor orienta los travesaños y adapta los rieles a las curvas del GPX. Se prefieren líneas nativas frente a cientos de símbolos o componentes: no hay un SVG/React por travesaño ni eventos de cámara en el componente. El ancho se interpola entre zoom 8 y 13; la relación del patrón se ajusta discretamente en zoom 11. El espacio final es una repetición en píxeles, no una afirmación sobre el número o la separación física de traviesas reales. El patrón depende de la teselación normal de MapLibre; no representa infraestructura levantada punto por punto.

`railwayFeatures()` deduplica solo secuencias **exactamente iguales o exactamente inversas**, sin tolerancia, redondeo o modificación de coordenadas. Se comparan claves canónicas una vez al cambiar los segmentos visibles. El feature gráfico conserva los identificadores de ambos tramos; las dos geometrías del plan siguen independientes. En una vista individual se entrega la secuencia propia de ese día, incluido el orden inverso del regreso. Variantes, coincidencias parciales y distintos muestreos permanecen separados.

La integración utiliza los segmentos ya validados por `routePlanSegments`; no cambia validadores ni recupera geometrías marcadas para revisión. Los trenes sin coordenadas válidas no reciben líneas inventadas. MapTab y editor comparten el renderer. Buses, caminatas, barcos y vuelos conservan sus componentes, estilos y lógica anteriores; `RoundTripRoutes`, `TransportRoute` y el helper de parejas permanecen intactos.

Los marcadores y popups DOM permanecen sobre las capas del canvas. No se añaden acciones de escritura ni controles nuevos. Cada pin numerado usa el destino final del `routePlan`; en una jornada cerrada usa solo el atractivo principal identificado explícitamente, y si no existe, conserva el destino final. Esta selección es de presentación y no modifica `routePlan`.

Referencias técnicas contrastadas con la dependencia instalada y la [especificación oficial de MapLibre](https://maplibre.org/maplibre-style-spec/layers/): `line-gap-width`, `line-dasharray`, terminaciones y propiedades por zoom.

## Capturas reproducibles

```powershell
node tests/round-trip-rendering.visual.mjs <worktree-d5c1ab7> production-real --real-basemaps
node tests/round-trip-rendering.visual.mjs D:/dreamy/dreamy-front real-basemaps --real-basemaps
```

El test compila MapTab/editor reales, carga ambos GPX locales de 1.431 puntos y ejecuta Chromium con MapLibre/WebGL. La aplicación se sirve en localhost. En modo `--real-basemaps` solo se permiten peticiones a Carto y Esri para los mapas base públicos; no se permite tráfico al CMS ni a APIs de Dreamy Tours. La clave MapTiler se deja vacía únicamente en el bundle del fixture, sin leer ni cambiar `.env`. Las capturas usan los estilos reales de `tour-map-styles.ts`, no fondos pintados para imitar teselas.

Se registra el éxito de respuestas de teselas y se comprueba ausencia de errores MapLibre/JS, conservación exacta de coordenadas y ausencia de mensajes de escritura. Se incluyen escritorio 1100 px y móvil 390 px, zoom general 9,2 y cercano 11,8, mapa y satélite.

Evidencia local en `artifacts/railway-design/`:

- `production-real/`: capturas anteriores del commit productivo.
- `real-basemaps/`: capturas de esta propuesta con teselas reales.
- `railway/`: prueba adicional con mapas base locales sin red.
- `integration/`: días individuales, rotaciones, variante, píxeles de rieles/travesaños y editor.
- `captures.json` dentro de cada carpeta: cámara, capas, proveedor y respuestas de teselas, cuando corresponda.

Las capturas no equivalen a probar un teléfono físico. No se ha inspeccionado ni modificado un tour publicado. El harness usa un plan local con los dos GPX reales y nombres de los extremos; no pretende copiar todo el contenido del tour del CMS.

## Validación y límites

La integración MapLibre comprueba una sola vía para el par exacto, cada secuencia por día, curvas/zoom/rotación, píxeles de dos rieles y travesaños, variantes conservadas, buses/barcos con el renderer anterior y editor sin mensajes de escritura. La selección de días también se ejecuta por teclado. Los textos de dirección se exponen en una lista con nombre accesible y separador verbal para lectores de pantalla.

Se mantienen las pruebas de seguridad GPX, buscador y persistencia. El test de seguridad usa el mismo editor y formulario reales y un adaptador de mapa; su aserción de geometría se actualiza para leer la nueva fuente ferroviaria en lugar del antiguo componente MapRoute. Los cambios del adaptador no sustituyen la prueba WebGL real.

La línea de carbón tiene contraste alto sobre mapas claros. Sobre satélite se mantiene el carbón y se añade únicamente contraste claro detrás de los rieles; una fotografía puede variar de luminosidad, por lo que las capturas no prueban un contraste universal ni conformidad WCAG completa. Quedan pendientes lector de pantalla manual, móvil físico y revisión por el usuario de la referencia gráfica. Curvas muy cerradas y geometrías diferentes que comparten parcialmente una vía pueden producir densidad local: no se recorta ni simplifica el GPX para ocultarla.

El build de validación usa compilación/prerender completos con fixture CMS en localhost; no valida todo el catálogo real. Los problemas globales de Biome y del test de idiomas preexistentes están documentados en `round-trip-final-review.md`; no se corrigen en esta propuesta.

El resultado final de rendimiento y verificaciones se guarda en el informe local `artifacts/railway-design/RESULTADOS.md`. No se modifican GPX, routePlan, protocolo 2, API, persistencia, Strapi, VPS, Cloudflare ni variables.

## Comprobación de marcadores diarios

El harness con MapLibre/WebGL carga el snapshot público de Machu Picchu de dos días y compara la posición proyectada de cada pin con las coordenadas del último destino de su `routePlan`. En ese snapshot, el Día 1 termina en Aguas Calientes y el Día 2 en Plaza Regocijo, Cusco. La prueba también verifica que el pin seleccionado siga activo y visible y que los overlays no oculten los pines.

Hay un marcador principal numerado por día, situado en el destino final/pernocte de su `routePlan`. Si el inicio y el destino final coinciden exactamente, se usa el atractivo principal solo cuando `primaryLegId` identifica un leg no terminal; si no existe, el marcador permanece en el destino final. El último día sigue la misma regla y representa dónde termina el servicio. Esta política se aplica por día, independientemente de que el itinerario tenga 2, 4, 7, 10 o 15 días.

Las salidas, visitas (`kind: "visit"`) y waypoints (`kind: "waypoint"`) aparecen como marcadores secundarios al seleccionar ese día; el leg `kind: "end"` se reserva para el marcador principal. La vista completa mantiene los marcadores principales diarios, pero no dibuja los secundarios de todos los días a la vez. Los puntos coincidentes con un pin diario no se duplican.

Los pines diarios separados por menos de 58 px en pantalla se agrupan para limitar la densidad regional. El control agrupado muestra la identidad de cada día y permite seleccionarlos individualmente por teclado; el día seleccionado permanece destacado y expuesto con `aria-pressed`. En móvil, los detalles se muestran debajo del mapa en vez de cubrir los marcadores.

La comprobación funcional no infiere atractivos por el texto del itinerario. El inicio explícito de cada `routePlan` prevalece sobre el fin del día anterior; ese fin solo se usa si el inicio del plan no existe. Si faltan datos suficientes, se conserva el fallback seguro disponible y no se modifica `routePlan`. Las pruebas unitarias cubren los itinerarios de 2/4/7/10/15 días, cierres con y sin atractivo explícito, waypoints, precisión de coordenadas y no mutación; el harness MapLibre/WebGL prueba la selección individual por teclado de días agrupados.

## Preparación limpia de publicación

La rama publicable se prepara desde `d5c1ab7`, sin incorporar los commits de revisión ni sus PNG. Las evidencias, GPX, snapshots públicos y resultados de rendimiento permanecen fuera del commit. Los harness visuales requieren esos archivos locales; no son pruebas autosuficientes del catálogo ni descargan datos del CMS. Las unitarias y los fixtures sintéticos cubren el comportamiento sin ellos.

`node tests/build-isolated.mjs --check` y `node tests/build-isolated.mjs` ejecutan Astro con un CMS desechable, variables permitidas y directorio de entorno temporal. El wrapper rechaza `.dev.vars` locales y evita cargar el entorno de Wrangler. No lee valores de secretos reales. `DREAMY_BUILD_ENV_DIR` es una opción de aislamiento para pruebas; cuando no está definida, Astro y la integración de rutas siguen usando la raíz habitual. Se mantiene este soporte mínimo porque permite repetir la validación sin credenciales. No se cambia `bun run build`, Wrangler, dependencias ni configuración remota de Cloudflare.

El 502 `no_route` de los buses Aguas Calientes ↔ Control Machu Picchu sigue siendo una incidencia externa pendiente. Este cambio no introduce rutas alternativas, conectores, imports de GPX de bus ni cambios del endpoint. Tampoco corrige los desfases entre estaciones, pueblos y extremos ferroviarios guardados: requieren aprobación de datos independiente.
