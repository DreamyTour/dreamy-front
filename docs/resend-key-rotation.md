# Rotación de `RESEND_API_KEY`

La clave que se haya expuesto en un artefacto local debe considerarse comprometida. No se reutiliza ni se copia a archivos del proyecto.

1. Un propietario de Resend revoca la clave expuesta y crea una nueva clave con el alcance mínimo necesario para enviar correo.
2. Un propietario de Cloudflare guarda la nueva clave únicamente como secreto de runtime `RESEND_API_KEY` del Worker `dreamy-front`. No debe crearse como variable de compilación, `PUBLIC_`, `VITE_`, archivo `.env` ni `.dev.vars` compartido.
3. Mantener `DRY_RUN=true` durante la publicación de esta corrección. Confirmar que el secreto aparece por nombre en la configuración del Worker, sin revelar su valor.
4. Publicar una sola vez el Worker. Con esta corrección, si el secreto no está disponible y `DRY_RUN=false`, los formularios responden `503` y no simulan el envío.
5. Ejecutar una prueba controlada con `DRY_RUN=true` y revisar los logs estructurados: `form_security` debe indicar `verified` y `mail_delivery` debe indicar `dry_run`.
6. Con autorización separada, cambiar `DRY_RUN=false`, enviar una solicitud de prueba no personal y comprobar `mail_delivery: accepted` junto con el registro de Resend.
7. Revocar cualquier clave anterior y conservar solo la nueva clave activa. Verificar que no haya claves con formato de Resend en `dist/`, `.env`, `.dev.vars` ni historiales de terminal compartidos.
