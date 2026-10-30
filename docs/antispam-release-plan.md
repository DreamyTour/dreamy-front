# Preparación de publicación antispam

Estado: **no publicar hasta verificar configuración remota y cerrar los checks**.
Este documento no autoriza commits, pushes ni despliegues.

## Revisión de autorización con la versión activa 997944ac

Confirmaciones visuales aportadas por el usuario: versión `997944ac`, 100 % del
tráfico; `DRY_RUN=true` en runtime de producción; `TURNSTILE_SECRET_KEY` cifrado;
`PUBLIC_TURNSTILE_SITE_KEY` en compilación; GitHub/main con `bun run build` y
`npx wrangler deploy`; publicaciones del CMS pausadas. Estas confirmaciones
actualizan el estado remoto anteriormente desconocido, pero no identifican el
commit fuente de la versión activa ni prueban que ambas claves sean del widget.

Lecturas independientes de Git y de los checks públicos de GitHub:

- HEAD local y `main` remoto son exactamente
  `7774dc44e33d0b3de4e1b4f2862f66389faee907`. No hay commits posteriores en main.
  Este commit no contiene el guard antispam ni la migración del Durable Object.
- El check exitoso `Workers Builds: dreamy-front` de ese commit registra el build
  `e97d9c94-749c-4ea4-8354-0f3df99bb435` y la versión
  `5ee845e9-eb94-4571-b02a-2ce94d2f03b2`.
- Esa versión no coincide con el prefijo activo `997944ac`. No se debe afirmar
  que este último contiene el mismo código sin evidencia adicional. Una nueva
  versión de configuración podría explicarlo, pero es solo una hipótesis.
- La lectura autenticada de versiones con Wrangler no está disponible localmente.
  Falta consultar los metadatos de la versión completa `997944ac…`, su build y
  commit o su procedencia si fue creada fuera de GitHub. No hay evidencia para
  descartar cambios posteriores realizados directamente en Cloudflare.

**Bloqueo para autorizar el push:** vincular la versión activa con un SHA fuente
verificado y preparar/probar el paquete de recuperación compatible descrito al
final. Si los metadatos muestran otro SHA o código modificado manualmente,
compararlo con main antes de reemplazar producción; no usar reset ni force-push.

## Variables de la próxima compilación y del runtime

- La configuración original y `dist/server/wrangler.json` tienen
  `keep_vars: true`; `.wrangler/deploy/config.json` dirige el deploy hacia la
  configuración generada. `vars: {}` no sobrescribe `DRY_RUN`.
- Con el `DRY_RUN=true` de producción confirmado por el usuario y sin overrides
  del comando ni cambios de panel, `npx wrangler deploy` conservará ese valor.
  Wrangler conserva los secrets existentes. Verificar otra vez después del build
  y del despliegue; una configuración remota puede cambiar durante la ventana.
- La clave pública está confirmada en Builds y presente en el cliente compilado.
  Mantener `VITE_STRAPI_URL=https://cms.dreamy.tours` en las variables/secrets de
  compilación, según la configuración existente: el preflight impide publicar
  si falta o difiere. No copiar `.env` local al repositorio ni al CI.
- `.node-version` contiene `22` y `packageManager` fija Bun `1.3.14`. Comprobar en
  los logs que ninguna variable remota NODE_VERSION/BUN_VERSION los sustituya.
- `TURNSTILE_SECRET_KEY` se lee de bindings runtime, no del bundle público.
  No hace falta convertirlo en variable de compilación. Su presencia cifrada no
  prueba la correspondencia con la site key: la procedencia del mismo widget
  Managed y sus hostnames debe confirmarse manualmente sin mostrar el secreto.
  No regenerar claves ni sobrescribir el secret durante esta revisión. No
  validar enviando un formulario de producción ahora. Tras autorización del
  despliegue, un envío real con token válido y DRY_RUN=true permite comprobar el
  emparejamiento sin correo, siempre dentro de la prueba de humo autorizada.

## Secuencia única elegida: GitHub, sin deploy CLI adicional

Los bloques siguientes son una propuesta para ejecutar **solo después de una
autorización explícita** de commit y push/publicación, con los bloqueos cerrados.
No se han ejecutado. El push a main es el acto que inicia el despliegue.

1. Confirmar metadatos de `997944ac…`, versión completa, SHA fuente, estado de
   runtime y widget. Registrar el SHA de recuperación verificado; mantener el CMS
   pausado. Preparar el paquete de recuperación y validarlo antes del push.
2. Revalidar que main no ha cambiado, sin actualizar ni sobrescribir trabajo:

   ```powershell
   Set-Location D:\dreamy\dreamy-front
   $expectedBase = '7774dc44e33d0b3de4e1b4f2862f66389faee907'
   $remoteMain = ((git ls-remote --heads origin main) -split '\s+')[0]
   if ($LASTEXITCODE -ne 0 -or $remoteMain -ne $expectedBase) { throw 'main cambió: detener y revisar' }
   if ((git rev-parse HEAD) -ne $expectedBase) { throw 'HEAD cambió: detener y revisar' }
   git status --short
   git diff --check
   ```

3. Ejecutar la secuencia de build y pruebas de este documento con Node 22.
   Mantener DRY_RUN=true; detenerse ante cualquier fallo. Comprobar keep_vars y
   bindings en el resultado generado, y ejecutar solo Wrangler **--dry-run**.
4. Revisar los archivos de `docs/antispam-release-files.txt` (lista explícita de
   los cambios preparados), comprobar que no existen cambios ajenos ni archivos
   privados y revisar el contenido antes de crear el commit:

   ```powershell
   git diff --cached --name-only
   # Si ya hay archivos staged ajenos a esta revisión, detenerse.
   git add --pathspec-from-file=docs/antispam-release-files.txt
   git diff --cached --check
   git diff --cached --stat
   git diff --cached
   # Detenerse si falla un check o la revisión no coincide con lo autorizado.
   git commit -m "Prepara protección antispam y despliegue seguro"
   if ($LASTEXITCODE -ne 0) { throw 'Commit fallido' }
   $releaseCommit = git rev-parse HEAD
   ```

5. Revisar y autorizar el SHA de release. Volver a comprobar main inmediatamente
   antes de publicar. Ejecutar **un solo push**, sin force:

   ```powershell
   $remoteMain = ((git ls-remote --heads origin main) -split '\s+')[0]
   if ($LASTEXITCODE -ne 0 -or $remoteMain -ne $expectedBase) { throw 'main cambió: detener' }
   git push origin HEAD:main
   if ($LASTEXITCODE -ne 0) { throw 'Push no confirmado: consultar remoto antes de reintentar' }
   ```

6. Cloudflare ejecutará `bun run build` y después `npx wrangler deploy`. **No
   ejecutar además wrangler deploy localmente, ni pulsar Retry/Redeploy mientras
   el build esté en curso.** Si falla, comprobar qué etapa falló y cuál es la
   versión activa antes de autorizar cualquier reintento.
7. En modo lectura, comprobar que el check y build corresponden a `$releaseCommit`,
   y registrar la nueva versión que recibe el 100 % del tráfico. Confirmar
   DRY_RUN=true, secret presente, keep_vars/bindings y migración. No basta un check
   verde de un commit anterior ni una versión solo subida sin tráfico.
8. En la prueba de humo posteriormente autorizada: home ES/EN/PT, rutas y assets,
   cuatro endpoints sin token (403), honeypot y trampa (éxito aparente sin correo),
   envío válido con Turnstile real y DRY_RUN=true, y rate limit controlado por IP.
   Repartir los intentos o esperar la ventana para no confundir un 429 con otro
   fallo. No enviar correos ni cambiar DRY_RUN a false. Verificar Resend sin envíos
   nuevos durante la ventana. Los formularios reales también simularán éxito y
   no avisarán al equipo mientras DRY_RUN siga activo: acotar y aceptar ese impacto.

## Recuperación operativa por el mismo canal

No ejecutar `git revert` de toda la release ni `wrangler rollback 997944ac`:
ambos pueden retirar la exportación/configuración del nuevo Durable Object o
cruzar su creación. El paquete de recuperación debe ser un nuevo commit basado
en la release, con la restauración selectiva desde el SHA activo **verificado**.

Conservar obligatoriamente `FormRateLimiter`, su exportación en `src/worker.ts`,
FORM_RATE_LIMITER, `form-antispam-v1`, SESSION/IMAGES/ASSETS, keep_vars y
workers_dev=false; además conservar el guard, DRY_RUN y los tokens de formularios.
No añadir migraciones de borrado, transferencias ni renombrados. Probar el paquete
localmente, incluidas migración y rutas, antes de la primera publicación.

Tras autorización de recuperación: crear/revisar ese commit compatible sobre la
release, registrar `$recoveryCommit` y hacer un único `git push origin HEAD:main`.
Cloudflare hará el único despliegue; no acompañarlo de un deploy CLI. Comprobar
que el build es el de `$recoveryCommit`, que su versión queda activa al 100 % y
que el namespace permanece. Repetir la prueba de humo con DRY_RUN=true. Si main
avanzó después de la release, detenerse y preparar la recuperación encima de los
nuevos cambios revisados, sin reset ni force-push.

## Evidencia local anterior, 28/10/2026

Se usó Node 22.23.4 portátil, descargado desde nodejs.org y verificado contra su
SHA-256 oficial, sin cambiar el Node del sistema. El código permanece sin commit
en `main`; HEAD local sigue en `7774dc4`.

| Comprobación final | Resultado |
| --- | --- |
| `bun run build`, con Node 22 en PATH | Código 0; artefacto nuevo |
| `astro check` bajo Node 22 | 0 errores, advertencias e hints |
| `bun run test` | 206 aprobadas |
| Antispam y Durable Object | 20 aprobadas; verificación con clave oficial de prueba y cero correos; concurrencia/persistencia aprobadas |
| `bun run test:e2e` bajo Node 22 | 57 aprobadas, ninguna desactivada |
| Navegación por teclado repetida | 9 aprobadas, tres repeticiones de sus tres pruebas |
| Auditoría sitemap con registro separado | Aprobada: 721 URLs históricas conservadas y 33 incorporaciones verificadas |
| Integración de rutas del Worker | 1.054 comprobaciones HTTP aprobadas y fixture aprobada |
| Auditoría SEO | Aprobada |
| Wrangler deploy **--dry-run**, después del build final | Código 0; bindings presentes |
| Entorno del artefacto | Clave pública en bundle; keep_vars=true en fuente y generado; sin credenciales privadas locales detectadas en cliente |
| Lectura remota Cloudflare con Node 22 | Bloqueada: falta autenticación; valores runtime y versión activa no verificados |

Las evidencias locales de comandos y códigos de salida están en
`.codex-trust-preview/antispam-predeploy/` (ignorado por Git). No se ejecutaron
despliegues reales, commits, push ni cambios en variables/secretos remotos o VPS.
Las pruebas impiden envíos de Resend. `DRY_RUN` no se cambió a `false`.

Pendientes críticos antes de autorizar publicación: verificar runtime remoto,
confirmar widget y claves correspondientes, revisar autodeploy y registrar la
versión/SHA activos para preparar y probar el paquete de recuperación.

## Entorno y pruebas

- Usar Node 22 (`.node-version`), Bun 1.3.14 y el lockfile existente.
- `bun run build` requiere `VITE_STRAPI_URL=https://cms.dreamy.tours` en el proceso;
  `.env` local apunta a desarrollo y no se debe cambiar ni quitar el preflight.
- Ejecutar build antes de `bun run test:e2e`: la suite ahora sirve `dist` en
  Miniflare/workerd con Node 22, `DRY_RUN=true` y Siteverify simulado localmente.
  No se envían secretos reales al servidor de pruebas. El mock bloquea conexiones
  externas del Worker salvo la lectura del CMS publicado, incluido Resend. Los tokens de fixture no funcionan en
  producción. No hay bypass ni polyfill en el código de producción.
- El arranque anterior mediante `astro dev` detectaba el agente, activaba
  `astro/logger/json` y lo ejecutaba dentro de workerd, donde ese logger Node usa
  `process`. También activaba un daemon y HMR. La suite evita esa ruta del CLI
  y valida el artefacto que se publicaría. No se cambió el CLI de desarrollo.
- Las pruebas no deben esperar `networkidle` con scripts de terceros activos;
  se espera DOM y controles funcionales. No hay pruebas desactivadas.
- Se actualizaron expectativas antiguas de pruebas a la interfaz publicada:
  el control de rutas de permisos sustituye al selector de tours anterior,
  el texto ES es `Reservar tour`, el menú móvil se busca por su propio contenido
  y Escape se envía al foco real del menú sin volver a enfocar el disparador.
  Se mantienen las comprobaciones de selección, duración, apertura y cierre.

## Sitemap y contenido

La referencia histórica `.astro/sitemap-phase2-baseline.json` queda intacta.
Las 32 incorporaciones originales se clasificaron así:

| Grupo | Cantidad | Decisión |
| --- | ---: | --- |
| Artículos publicados | 28 | Legítimos: documentId/locale/publishedAt comprobados en Strapi por GET, canonical propio y HTML generado |
| Segunda página de categoría Lima, EN/ES/PT | 3 | Legítimas: categoría con suficientes artículos; la política previa solo excluía paginación del índice general |
| `/es/blog/9/` | 1 | Regresión del filtro fijo hasta página 8; se excluye del sitemap sin borrar la ruta ni contenido |

Durante la revisión se publicaron dos traducciones adicionales del artículo
`lugares-turisticos-de-arequipa`: `/blog/tourist-attractions-in-arequipa/` y
`/pt/blog/pontos-turisticos-de-arequipa/`. Se verificaron por separado con el mismo
documentId y estado publicado. El registro explícito está en
`docs/sitemap-reviewed-additions.json`; no sustituye el baseline y la auditoría
sigue rechazando eliminaciones y nuevas URLs no revisadas.

El sitemap usa ahora una regla para todas las páginas numéricas del índice del
blog (>=2), manteniendo las páginas y las paginaciones de categorías disponibles.
No se añadieron reglas de robots ni se cambió la indexabilidad de las páginas.

Dos tours portugueses publicados usan `trilha` en sus slugs actuales; se añaden
alias al mapa de reservas conservando los antiguos con `caminho`. Las pruebas
visitan los slugs publicados. No se cambian slugs del CMS ni rutas/redirecciones.

## Condiciones remotas: evidencia requerida

1. En el Worker **dreamy-front**, comprobar que `DRY_RUN` es la cadena `true`
   guardada en runtime y que `TURNSTILE_SECRET_KEY` existe como secret. No copiar
   ni imprimir su valor. Un nombre de secret listado acredita presencia, no que
   pertenezca al mismo widget: comprobar esa correspondencia en el panel.
2. `keep_vars: true` está en `wrangler.jsonc` y debe estar también en
   `dist/server/wrangler.json`. Preserva variables de panel ya existentes, pero
   **no crea DRY_RUN ni demuestra que esté guardado**. `vars: {}` en el artefacto
   no elimina las variables remotas con keep_vars; tampoco prueba sus valores.
   Los secrets no se declaran en `vars` y no se imprimen en el dry-run.
3. `PUBLIC_TURNSTILE_SITE_KEY` debe existir durante el build y estar incorporada
   en el bundle cliente. La clave privada solo se lee desde `cloudflare:workers`
   en runtime; DRY_RUN no omite Turnstile.
4. Confirmar widget Managed, hostnames y cuenta/destino de despliegue. Mantener
   `workers_dev: false`, SESSION, IMAGES, ASSETS, FORM_RATE_LIMITER y la migración
   `form-antispam-v1` sin renombrarlos.

## GitHub y publicación inesperada

La consulta pública de GitHub del 28/10/2026 mostró: rama por defecto `main`,
ningún workflow Actions, ningún ruleset público y `main` sin protección. En el
último commit existe el check exitoso **Workers Builds: dreamy-front** de la app
**cloudflare-workers-and-pages**. Es evidencia de la integración Cloudflare;
la ausencia de workflows no implica ausencia de autodeploy.

No hacer push a `main` para “guardar avances”. Antes de autorizarlo, el usuario
debe revisar en Cloudflare Builds la rama de producción, autodeploy, previews,
build/deploy commands, raíz y variables por entorno. Registrar esos valores.
Si se necesita desactivar autodeploy o añadir protecciones, hacerlo solo con
autorización independiente. Esta preparación no modifica esas configuraciones.
Evitar dos publicaciones simultáneas (GitHub y CLI); escoger un único canal.

## Revalidacion local antes de publicar

La secuencia operativa vigente es la de GitHub definida arriba. Este bloque
comprueba el artefacto antes del commit/push que se autorice posteriormente:

```powershell
$env:VITE_STRAPI_URL='https://cms.dreamy.tours'
$env:DRY_RUN='true'
bun run build
if ($LASTEXITCODE -ne 0) { throw 'Build fallido' }
npx astro check
bun run test
bun run test:cms-origin
bun run test:antispam
bun run test:e2e
bun run test:legacy-en-build
bun run test:localized-routes
bun run test:seo-follow-up
npx wrangler deploy --dry-run
```

Detenerse ante cualquier codigo distinto de 0, incluso en comandos intermedios.
Usar Node 22 y conservar/restaurar el entorno local segun el README. No ejecutar
un deploy CLI real: la publicacion elegida es el push autorizado a GitHub.

## Recuperación sin revertir la migración

Cloudflare no permite rollback de versiones cruzando ciertos cambios del ciclo
de vida de Durable Objects. `form-antispam-v1` crea uno; no basar la recuperación
en `wrangler rollback` a una versión que no lo exportaba.

Preparar en un directorio aislado una nueva versión de recuperación que conserve
la clase `FormRateLimiter`, su exportación, binding y migración exactamente como
en el despliegue antispam. Restaurar el resto del código desde el **SHA real de
la versión activa comprobado en Cloudflare**, no asumir que HEAD local coincide.
El SHA local al iniciar esta revisión era `7774dc4`; es referencia local, no
prueba de lo que está en producción. No usar reset ni borrar el trabajo actual.

La versión de recuperación debe conservar DRY_RUN y la capa antispam delante de
los cuatro endpoints. Una recuperación literal del viejo `resend.ts` podría
ignorar DRY_RUN; no publicarla. Si se necesita restaurar los handlers antiguos,
mantener la frontera de correo compatible con DRY_RUN y probar cero envíos antes
de autorizar el nuevo despliegue. Priorizar restaurar UI/routing conservando el
backend protegido. No quitar bindings, borrar namespaces, usar migraciones
`deleted_classes` ni cambiar el historial para simular una reversión.
Conservar también `FormSecurity` y el envío del token/timestamp en los formularios
restaurados: un frontend anterior sin esos campos recibiría 403 del backend
protegido. Repetir los envíos válidos y rechazos en el paquete de recuperación;
restaurar solo assets antiguos no constituye una recuperación funcional probada.

Se preparó un candidato local aislado en `.codex-trust-preview/recovery/`,
derivado de `7774dc4` con la superposición de compatibilidad antispam. Compiló
con Node 22.23.4, pasó su simulación de persistencia del Durable Object y
`wrangler deploy --dry-run` con configuración explícita. Conserva
`FormRateLimiter`, `form-antispam-v1`, SESSION, IMAGES, ASSETS, `keep_vars` y
`DRY_RUN=true` **solo para la prueba local**; registró cero llamadas al proveedor
de correo. No es una recreación demostrada de `997944ac` ni está autorizado para
publicarse, porque el SHA fuente activo sigue sin verificarse. Tras obtener ese
SHA, reconstruir el candidato sobre esa fuente y repetir las pruebas.

Publicarlo sería un **nuevo despliegue hacia adelante** con código restaurado y
esquema compatible; también necesita autorización.

Referencias oficiales:
- https://developers.cloudflare.com/workers/wrangler/configuration/
- https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/#bindings
- https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/

## Desafío temporal firmado

El control temporal usa un desafío emitido por el Worker y firmado con
`FORM_CHALLENGE_SECRET`. No acepta relojes enviados por el navegador: la firma
vincula la hora de emisión y la ruta, y el Worker exige una antigüedad de al
menos tres segundos y un máximo de treinta minutos. Configurar
`FORM_CHALLENGE_SECRET` como secreto runtime antes de publicar; generar un valor
aleatorio de alta entropía localmente y cargarlo por el flujo seguro del panel o
`wrangler secret put FORM_CHALLENGE_SECRET` interactivo. Nunca incluir su valor
en Git, variables `PUBLIC_`/`VITE_` ni argumentos de comandos.

La firma HMAC evita que se fabriquen o adelanten desafíos, pero un token válido
no es de un solo uso sin almacenamiento del nonce. El rate limit por IP/ruta
sigue limitando su reutilización. Para operaciones futuras más sensibles se
debe añadir consumo de nonce en Durable Object, conservando su migración y
bindings; no se implementa esa escritura de estado en esta versión.
