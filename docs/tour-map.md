# Tour map

## Editor sencillo: visitas, marcador y final del día

En el CMS, abre «Recorrido del día» y:

1. Elige la salida del primer día. Los siguientes heredan el destino final del anterior.
2. Pulsa «Añadir visita», busca el atractivo y elige cómo llegan.
3. Marca con la estrella la visita principal. Sin elección, se usa la primera visita.
4. Indica el final: «Volvemos a…» agrega el regreso; «Termina en otro lugar» permite buscar el alojamiento o destino siguiente.
5. Comprueba el recorrido y guarda el tour con el botón Guardar del CMS.

«Solo guía la ruta» conserva una parada para calcular la carretera sin mostrarla como atractivo. «Final del día / alojamiento» conserva el destino para la siguiente jornada sin convertirlo en el marcador del día. Si agregas una visita después de configurar el regreso, se coloca antes de ese final y se invalida su trazado para recalcularlo.

Ejemplo: Cusco → acceso a la caminata (guía) → Humantay (visita principal) → Cusco (final). El marcador se coloca en Humantay, pero la siguiente jornada empieza en Cusco.

El mapa agrupa días cercanos según el zoom y permite elegirlos. Al seleccionar una tarjeta o marcador encuadra la jornada, muestra sus otras visitas y atenúa las demás rutas. El botón de encuadrar restablece el viaje completo. Si no existe una ruta calculable, las visitas siguen visibles: no se inventa una carretera. GPX se encuentra en «Opciones avanzadas» y no es requisito para mostrar los atractivos.

Compatibilidad: los planes anteriores conservan sus tramos y geometrías. Sus paradas se consideran visitas hasta clasificarlas; revisa la estrella y marca los puntos de carretera y alojamientos con el tipo correspondiente. No se modifican automáticamente los tours guardados ni se agregan campos obligatorios al esquema del CMS: `kind` y `primaryLegId` se guardan dentro del JSON `routePlan` existente.

The tour map continues to read `maps.mapstops` from the CMS: `order`, `title`,
`description`, `imagen`, `duration`, `routeText`, `latitude`, and `longitude`.
Existing stops remain compatible. Destination cards use a clean background
with day, title, duration, and route text. Images appear in the selected destination popup.

Satellite is the initial view. Without additional configuration it uses Esri
World Imagery and CARTO labels; the street view uses CARTO Voyager. Provider
attributions remain visible in the map. Provider availability and usage terms
apply; these public endpoints are not a guarantee of unrestricted commercial use.

The map appears above the destination cards. Its height adapts to the viewport,
and its initial bounds are fitted after measuring the visible container. The
map module downloads as the tab section approaches the viewport; imagery still
loads on opening the map. Satellite rendering reduces saturation and keeps
neutral contrast to soften warm source imagery.

To use MapTiler streets and hybrid satellite maps instead, set
`PUBLIC_MAPTILER_KEY` in the build environment and rebuild. This is a browser
key: restrict it to the website's domains in MapTiler and use a plan appropriate
for production traffic. Never put a private service credential in this variable.

Transport trial
---------------

Open `http://localhost:4321/dev/map-transports` while the frontend dev server is
running. This page is development-only and returns 404 in production. It offers
an Andes sample with all four modes and a Lima–Paracas road sample. The selectors
change local preview state and never write to the CMS.

The local Strapi schema `shared.map-stops` now adds two optional fields. Restart
the CMS development server to make them available in the content editor:

- `transportMode`: `walking`, `bus`, `train`, or `flight`. This describes the
  incoming connection from the previous stop in `order` to this destination.
  Leave the first stop empty. Existing stops without a mode retain their arcs.
- `routeGeometry`: optional manual override; leave `null` for automatic bus and
  walking routes. It accepts a reviewed GeoJSON LineString, GeoJSON Feature containing a
  LineString, or an array of `[longitude, latitude]` pairs. The full path is
  included in the initial map bounds. Invalid geometry is rejected entirely.

Example `routeGeometry` structure (illustrative coordinates, not a real road):

```json
{"type":"LineString","coordinates":[[-71.967,-13.532],[-72.264,-13.258]]}
```

Walking uses dashes on the calculated pedestrian path. Bus uses a blue line with
a contrasting border along the calculated road. Select the transport and leave
`routeGeometry` at `null`: the frontend requests the route from `/api/tour-route`
using the consecutive CMS stop coordinates. Reviewed manual geometry takes
priority. Successful calculations are cached in the browser; upstream requests
are sequential and abort when the map is closed or the destinations change.
Paths are included in the initial map bounds. While loading, only destination
markers are displayed; a failed route never produces an invented straight line.

Train retains rails and cross ties when reviewed railway geometry is provided;
no road routing profile is substituted for a railway. Without that geometry,
the map shows its destinations and "Recorrido no disponible". Flight uses an
illustrative curved connection, not a tracked flight path. The first stop has
no incoming segment. A tour within a single city also needs separate origin and
destination coordinates to calculate its internal transfers.

In local development, OSRM demonstration car and foot networks provide the
routes, paced to at most one request every 1.1 seconds. Attribution and a "fix
the map" link are displayed. Demo routing is disabled in production. To enable
automatic production routing, configure the private server secret `ORS_API_KEY`
for openrouteservice (Cloudflare runtime secret / local `.dev.vars`). The server
reads it with `astro:env/server` `getSecret`; it never reaches browser code.
Driving uses `driving-car`, walking uses `foot-hiking`. Configure provider quotas
and request limits appropriate for the site's traffic before publishing.
Missing configuration returns a sanitized 503; failures are never cached.
Routing service calculations follow their map network, so review specific tour
trails and use the manual override when an itinerary follows a prescribed path.

The saved OSRM samples in `src/data/map-demo/` remain as examples of reviewed
geometry; the interactive preview now calculates its bus and walking paths
without using those files.

Duration and route text continue to come from the existing editable CMS fields.

## Editor visual del CMS

Cada `shared.map-stops` ahora tiene `routePlan`, un custom field JSON con interfaz
visual, registrado en el servidor y admin de Strapi. El editor se abre en un
iframe de `/cms/map-editor`; solo acepta mensajes de la ventana y origen del
CMS configurado, y el admin solo acepta cambios de su iframe y origen frontend.
El cliente busca lugares, elige transporte, añade/reordena tramos, comprueba el
recorrido y usa Guardar en Strapi. El origen se hereda del último destino del día
anterior. En el primer día se elige una salida. Una salida sin tramos también se
conserva. Cada día mantiene una tarjeta y marcador principal; los destinos
intermedios aparecen con pines pequeños.

`Comprobar recorrido` guarda geometrías de bus/caminata dentro del plan, evitando
recalcularlas en cada visita pública. Los cambios de destino o transporte
descartan la geometría afectada; al cambiar el destino anterior se revisan los
extremos del trazado antes de reutilizarlo. Tren requiere un GPX del operador;
se validan los extremos y la continuidad de un único tramo. Camino Inca también
debe usar un GPX del itinerario contratado. El barco sin GPX y el vuelo son
conexiones ilustrativas, no rutas verificadas. No se incluyen trazados especiales
inventados ni una biblioteca de rutas presentada como verificada.

El bootstrap de Strapi organiza el formulario y oculta coordenadas, geometría y
transporte antiguos; conserva sus datos y ofrece “Usar destino existente”. Los
tours sin plan continúan usando sus campos originales. La búsqueda usa
`/api/tour-places`, con la misma clave privada ORS y validación de consultas.

Configurar `STRAPI_ADMIN_TOUR_MAP_FRONTEND_URL` en el CMS (localmente
`http://localhost:4321`; en producción, la URL pública del frontend). Reconstruir
el admin al cambiar esta variable. El frontend obtiene el origen permitido del
CMS de `VITE_STRAPI_URL`. La CSP permite únicamente ese frontend en Strapi y ese
CMS como padre del editor. La clave ORS permanece en el servidor del frontend.

Provider references:
- https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9
- https://www.carto.com/legal/basemap-terms/
- https://docs.maptiler.com/maplibre-gl-js/
