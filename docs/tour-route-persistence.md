# Protección de recorridos GPX — implementación local

Fecha: 11 de noviembre de 2026. **Sin despliegue ni escrituras en productos reales.**

## Comportamiento

- Los clics normales permiten explorar el mapa. Solo «Cambiar ubicación» activa
  la edición de un punto. La salida heredada sigue sin poder editarse desde otro día.
- Cambiar ubicaciones/transporte, reordenar o eliminar visitas pide confirmación
  cuando afecta a una geometría. Cancelar conserva el plan previo.
- Una geometría cuyo origen, destino o transporte cambia se conserva como
  `geometryMeta.status="review"`. No se sustituye automáticamente por ORS.
- Al retirar una visita o reemplazar un GPX, el original se conserva en
  `routePlan.archivedLegs`, visible y descargable. No hay un botón de purga.
- Añadir o reordenar visitas conserva las coordenadas de los tramos no relacionados.
- Los GPX nuevos conservan nombre de archivo y fecha de importación. Los antiguos
  muestran «Nombre original no disponible». No se conserva el archivo binario:
  la descarga reconstruye un GPX 1.1 de un solo segmento desde sus coordenadas.
- Se muestran distancia, puntos, estado de revisión y persistencia. «GPX guardado»
  requiere una lectura autenticada nueva de Strapi que coincida con el plan actual.
  El selector de archivos queda oculto tras acciones explícitas para no confundir
  «Ningún archivo seleccionado» con ausencia de geometría.
- Los mapas públicos no recalculan automáticamente un trazado pendiente de revisión.
  La miniatura tampoco sustituye carreteras/senderos/ferrocarriles ausentes por rectas.

## Modelo compatible, sin migración

Se mantiene `routePlan.version=1` en el campo JSON existente. Nuevos datos opcionales:

```text
dayId
archivedLegs[]
legs[].geometryMeta = {
  source?: "gpx" | "routing",
  fileName?: string,
  importedAt?: string,
  status?: "valid" | "review",
  mode?: transportMode,
  from?: [longitud, latitud],
  to?: [longitud, latitud]
}
```

`from` y `to` vinculan la geometría con los puntos seleccionados. No son conectores
añadidos al trazado. La comprobación de extremos original mantiene sus tolerancias
para no invalidar los productos existentes por un cambio global de criterio.

Los planes antiguos válidos, sin metadatos, continúan funcionando. Los campos
aditivos desconocidos se conservan. Los datos inválidos producen un error visible
y bloquean la edición; no se convierten silenciosamente en un plan vacío ni en un
tramo sin geometría. El dato original del servidor no se reescribe al abrir el editor.

## Protocolo iframe / CMS

Versión de protocolo **2**, con origen exacto y ventana de origen comprobados:

```text
identity = { documentId, locale, dayKey, sessionId }
dreamy-route-ready  { protocol }
dreamy-route-init   { protocol, identity, sequence, ackSequence, value, persisted, ...context }
dreamy-route-change { protocol, identity, sequence, value }
```

El CMS solo acepta cambios del iframe correspondiente a ese documento, idioma, día
y sesión, con secuencia creciente. El iframe ignora mensajes repetidos/atrasados y
no cambia de identidad dentro de una instancia: otro día requiere otro iframe.
Una sincronización invalida operaciones asíncronas pendientes. El resultado de una
lectura GPX o de una petición de rutas solo se aplica si conserva operación,
identidad, revisión e identificador de tramo vigentes.

El adaptador utiliza `useForm().isSubmitting` y los valores iniciales para volver
a consultar el documento después de guardar. «Verificar guardado» permite repetir
la lectura. Un formulario limpio por sí solo no acredita persistencia. Si falla
la lectura o difiere inesperadamente el servidor, no muestra «Guardado» ni acepta
una sustitución silenciosa del estado.

La lectura administrativa usa la sesión/token ya existentes del panel y no envía
esas credenciales al iframe. No se añadieron claves ni endpoints públicos nuevos.

## Protección en Strapi

Middleware de Document Service limitado a `api::tour.tour`:

1. Abre una transacción y bloquea las filas del documento antes de comparar y escribir.
2. Lee borrador/publicación con los componentes del mapa poblados.
3. Para un plan modificado exige `_baseRevision`, SHA-256 del JSON canónico del
   día que leyó el cliente. Otra revisión o un cliente antiguo que intenta cambiar
   recorridos provoca rechazo. Días no modificados no requieren el token nuevo.
4. Exige que todas las geometrías existentes sigan presentes, activas o archivadas,
   incluyendo su nombre original cuando ya existía. Rechaza también reemplazos
   parciales de componentes que omitan los recorridos.
5. Retira `_baseRevision` del JSON antes de persistir. Es un token de solicitud,
   no una nueva columna ni una revisión que deba migrarse.
6. Publicar/descartar borrador no puede perder geometrías de la otra versión.
   Eliminar un día con plan o un tour con geometrías queda bloqueado. No se añadió
   un mecanismo de borrado definitivo que pueda eludir la conservación.

Se utiliza `ApplicationError` de la misma copia de `@strapi/utils` que Strapi,
resuelta a través de su dependencia existente. Strapi presenta HTTP 400 con
`error.details.code` (`stale_route`, `geometry_loss`, `day_loss`, etc.) y mensaje
explicativo. No se añadió dependencia ni se cambiaron lockfiles.

La protección cubre las escrituras que pasan por Document Service (incluido Content
Manager). SQL directo, Query Engine usado para eludir Document Service, restaurar
una base completa o cambiar este código administrativamente requieren sus propios
controles y copias de seguridad. No es una garantía frente a esas operaciones.

## Archivos

Frontend:

- `src/components/tours/RoutePlanEditor.tsx`: modo explícito, confirmaciones,
  protección de operaciones, estados GPX, metadatos y descarga.
- `src/lib/tour-route-plan.ts`: modelo aditivo y lectura sin descarte silencioso.
- `src/lib/tour-route-safety.ts`: conservación, archivo, revisión, distancia y GPX.
- `src/lib/tour-route-contract.ts`: identidad y serialización canónica compartidas.
- `src/components/tours/useCalculatedTourRoutes.ts`: evita recalcular rutas en revisión.
- `src/components/tours/MapTab.tsx`: respeta y anuncia rutas en revisión.
- `src/components/tours/RouteMapPreview.tsx`: no dibuja conexiones terrestres inventadas.
- `tests/cms-editor.integration.ts`: fixture actualizado al protocolo 2.
- `src/lib/tour-route-safety.test.ts`, `tests/route-editor-safety.integration.mjs`,
  `tests/route-persistence.integration.mjs`: nuevas pruebas.

CMS (`D:/dreamy/dreamy-cms`):

- `src/admin/tour-route-input.tsx`: protocolo, aislamiento y lectura tras guardar.
- `src/shared/tour-route-contract.ts`: copia idéntica del contrato, comprobada por test.
- `src/extensions/tour-route-protection.ts`: política de conservación y concurrencia.
- `src/index.ts`: registro del middleware.

No se cambió `map-stops.json`, no se reemplazó MapLibre y no se añadió migración.
El archivo no rastreado `dreamy-cms/config/features.ts` ya existía al comenzar y
no forma parte de esta implementación.

## Pruebas y límites

Comandos desde `dreamy-front`:

```powershell
bun test src/lib/tour-route-safety.test.ts src/lib/tour-route-plan.test.ts src/lib/tour-map-transport.test.ts
node tests/route-editor-safety.integration.mjs
node tests/route-persistence.integration.mjs
bun run test:cms-editor
bun run check
```

- **21 pruebas unitarias de rutas superadas**: compatibilidad antigua, retención,
  reordenación/inserción/eliminación, validación sin pérdida, identidad, descarga,
  cambio de origen heredado y reemplazo de archivo con coordenadas iguales.
- **17 escenarios de navegador superados** con los componentes reales
  `RoutePlanEditor`, `tour-route-input`, `MapTab` y `TransportRoute`. Se adaptan
  únicamente el renderizador MapLibre, hooks de formulario/autenticación de Strapi
  y almacenamiento HTTP de fixture. Incluye cancelar cambio/reemplazo,
  guardado/lectura/reapertura, mensajes atrasados y de otro día, lectura GPX
  atrasada, cálculo atrasado, y descarga efectiva del GPX archivado.
- **Strapi real 5.59 + SQLite temporal**: guardar/releer, aislar Día 1/Día 2,
  rechazar pérdida de geometrías, reemplazos parciales, revisión antigua y borrado
  de día, conservar archivo, publicar, y competir dos escritores con una revisión
  común. También admite un plan antiguo sin metadatos: **16 comprobaciones superadas**.
- **Integración Astro/CMS de autenticación superada**, con servidor CMS ficticio:
  iframe autenticado, origen, cookies y revocación.
- TypeScript del servidor CMS y `astro check` sin errores; lint de los archivos
  frontend modificados sin errores.
- Compilación local del panel CMS y compilación completa Astro verificadas. El
  build frontend requiere `VITE_STRAPI_URL=https://cms.dreamy.tours` en el entorno
  del proceso por el preflight existente; no se cambió `.env`. El build solo lee
  contenido publicado y genera archivos locales. No publica ni despliega.

La prueba de Strapi crea una aplicación mínima en el directorio temporal del
sistema, con su propia base `fixture.db`. Strapi inicializa allí sus tablas
internas; no se arranca la aplicación real ni se carga el `.env` del CMS.

La suite general `bun test src` tiene un fallo ajeno a este cambio:
`src/lib/languageSelectors.test.ts` no resuelve el import CSS generado de
`layout/MobileMenu.astro?astro&type=style&index=0&lang.css`. No se modificaron
ni el menú ni esa prueba para ocultarlo. Ver `artifacts/route-safety-tests.log`.
Esa prueba dejó las carpetas temporales `src/lib/.language-render-1pIdtf/` y
`src/lib/.language-render-FlP1j4/`. La revisión automática bloqueó su limpieza;
se dejaron sin rastrear y no forman parte del cambio ni deben incluirse en commits.

No se probó concurrencia real sobre PostgreSQL/MySQL ni el panel de producción:
debe repetirse el flujo en staging con el motor y permisos de producción antes
del despliegue. La prueba pública utiliza el componente real con datos de prueba,
no guarda contenido ni usa el producto turístico real.

## Copia de seguridad y reversión

Los originales se encuentran en:
`artifacts/route-safety-backup/20261111-175852/`.
El `manifest.json` contiene SHA-256 de ocho archivos originales. Los archivos se
guardaron con sufijo `.bak` para no incluir fuentes duplicadas en `astro check`.
Los archivos nuevos se identifican arriba y no reemplazan originales existentes.

Antes de desplegar puede revertirse restaurando **solo** esos ocho archivos a
sus rutas originales y retirando los archivos nuevos de esta implementación.
No usar `git reset --hard`: hay artefactos GPX y trabajo previo que deben conservarse.
La copia no contiene `.env`, secretos ni datos de producción.

Tras guardar planes con metadatos/archivo, **no volver a habilitar el editor
antiguo para escribir**: su normalizador desconoce esos campos. Para una reversión
posterior hay que pausar la edición, exportar los JSON completos y mantener la
protección de servidor hasta preparar una versión compatible. Restaurar código
no requiere ni justifica restaurar toda la base de datos.

## Despliegue propuesto — requiere autorización

1. Revisar ambos repositorios y respaldar base real y `routePlan` de los tours.
2. Publicar primero a staging el servidor/panel CMS y el frontend compatibles.
   Repetir las pruebas con el motor real y verificar lectura administrativa y
   archivos GPX antiguos/nuevos. No usar productos reales como fixtures.
3. Coordinar una ventana sin edición de recorridos. Desplegar el CMS con protección
   y reconstruir su panel; publicar el frontend con protocolo 2. Durante una
   discrepancia de versiones el editor queda bloqueado deliberadamente.
4. Reabrir el panel para descartar sesiones/cachés antiguas. Confirmar un ciclo de
   guardar/releer/reabrir y editar otro día antes de habilitar el uso normal.
5. Actualizar el sitio estático mediante el flujo habitual después de publicar
   cambios de contenido autorizados; una lectura del borrador no actualiza el HTML.

Los GPX ya desaparecidos **no se recuperan automáticamente** con esta corrección.
Su recuperación desde archivos/historial es una operación de contenido separada.
No se ejecutó ningún despliegue, restauración ni escritura de producción.

## Preparación de commits locales — 12 de noviembre de 2026

La entrega se limita a los 12 archivos frontend y 4 CMS enumerados arriba. Quedan
fuera `artifacts/`, las carpetas `.language-render-*`, las copias de seguridad y
`dreamy-cms/config/features.ts`. Las comprobaciones finales se ejecutan en copias
aisladas, sin copiar `.env` ni datos existentes. Los orígenes públicos se fijan
únicamente para los procesos locales de comprobación; no se cambia Cloudflare.

Resultados finales y límites que deben acompañar a los commits:

- 21 pruebas unitarias de rutas y 17 escenarios del editor con adaptadores: pasan.
- La prueba de persistencia con Strapi y SQLite desechables supera 16 comprobaciones
  tanto con Node 24.19.0 como, tras una instalación aislada con lockfile congelado,
  con Node 22.23.4. El primer intento con Node 22 reutilizando dependencias locales
  falló por ABI de SQLite; no se reconstruyó la dependencia compartida para
  resolverlo. La instalación propia valida el código del commit con Strapi 5.59.0.
- TypeScript del servidor CMS y compilación completa de servidor/panel CMS con
  Node 22.23.4: pasan. Compilar el panel no acredita el arranque del driver SQLite.
  La compilación completa se repitió correctamente con la instalación congelada
  propia de Strapi 5.59.0; su driver también pasó la prueba de persistencia.
- Compilación completa Astro con Node 22.23.4 y el preflight de origen sin
  desactivar: pasa, con 240 documentos y 720 slugs localizados. `astro check`
  informa cero errores y cero advertencias (un hint previo en un script ajeno).
  La integración de autenticación CMS y las cuatro pruebas del preflight pasan.
- La suite general conserva un fallo previo en
  `src/lib/languageSelectors.test.ts`: 213 pruebas pasan y una falla al importar
  el módulo virtual CSS de `MobileMenu.astro`. No se modificó ni se omitió esa prueba
  para presentar un resultado verde. Esta incidencia debe resolverse por separado
  o contar con una excepción de publicación explícita; los commits GPX no son una
  autorización de despliegue.

Durante la preparación aparecieron cambios adicionales fuera de GPX en el CMS:
`package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` y
`types/generated/contentTypes.d.ts`. No se incluyen ni se revierten. Las
comprobaciones con dependencias compartidas no sustituyen la validación del
lockfile del commit; se realizó por separado una instalación congelada y aislada,
sin modificar esos cambios ni la instalación que utiliza el desarrollo local.

El frontend se publica automáticamente tras push a `main`; el CMS lo actualiza
manualmente el administrador del VPS después del push comunicado por el usuario.
No publicar ambos repositorios sin coordinar antes la pausa de edición de
recorridos y los builds pendientes o disparados por hooks editoriales. El CMS
compatible debe estar listo antes de abrir el editor frontend de protocolo 2.
La publicación habitual de blogs puede continuar durante la preparación; una
barrera temporal de promoción del frontend requiere su propia autorización.

No habilitar el editor antiguo para escribir planes que ya contienen metadatos
o geometrías archivadas. Un rollback de código no debe restaurar toda la base y
perder las publicaciones editoriales posteriores. No se hizo push ni se accedió
al VPS durante esta preparación.
