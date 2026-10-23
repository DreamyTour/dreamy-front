# Acceso al editor de recorridos

`/cms/*` no se incluye en el sitemap. El middleware exige una sesión de editor
para abrir esas rutas y `/api/tour-places`. Las respuestas no se almacenan en
caché y llevan `X-Robots-Tag: noindex, nofollow`.

El componente `src/admin/tour-route-input.tsx` del repositorio `dreamy-cms`
envía el token de administrador de Strapi por HTTPS a `POST /api/cms/session`.
El frontend comprueba el token con `/admin/users/me` del CMS configurado y crea
una sesión en el binding `SESSION` existente. El token no se guarda en la sesión
ni se incluye en URLs. La cookie es HttpOnly, Secure en producción, host-only y
SameSite=Lax. Se acepta CORS únicamente desde el origen del CMS configurado.

La autorización dura cinco minutos y el panel la renueva cada dos minutos.
Al cerrar sesión en Strapi, una autorización ya emitida puede seguir siendo
válida hasta cinco minutos. El guard comprueba también la fecha de caducidad
guardada, independientemente de cuándo expire el registro en KV.

## Configuración y despliegue

- Frontend: `VITE_STRAPI_URL` apunta al CMS; se admite `STRAPI_URL` como respaldo.
  En producción debe usar HTTPS. El backend debe poder consultar `/admin/users/me`.
- CMS: `STRAPI_ADMIN_TOUR_MAP_FRONTEND_URL` apunta al origen del frontend.
- Ambos orígenes deben compartir sitio en producción, como `dreamy.tours` y
  `cms.dreamy.tours`, para que el iframe pueda utilizar la cookie SameSite=Lax.
- Publicar coordinadamente frontend y panel de Strapi: el cambio requiere
  recompilar el panel. El panel anterior no crea la sesión y recibirá 401.
- No hacen falta nuevas contraseñas ni secretos compartidos.

`/api/tour-route` sigue siendo público porque los mapas de los tours lo usan.
Esta protección no limita por sí sola el consumo anónimo de ese endpoint.
El guard protege el acceso al editor; Strapi sigue controlando los permisos
de escritura y la publicación del tour.

## Validación

`bun test src/lib/cms-editor-auth.test.ts` prueba las decisiones de autorización.
`bun run test:cms-editor` levanta un CMS simulado y Astro, y comprueba en Chromium
el intercambio CORS, la cookie, la carga del iframe, el rechazo anónimo y la
revocación. No utiliza cuentas reales ni modifica datos de Strapi.
