# Confirmación de formularios: seguridad y experiencia

Un formulario solo se considera enviado cuando el endpoint responde con
`success: true` después de que Resend acepta la solicitud. La interfaz nunca
presenta una confirmación real para una simulación, `DRY_RUN`, un descarte de
seguridad o un error HTTP.

## Contrato de respuestas

- `409` con `code: FORM_RETRY`: el formulario llegó antes de los tres segundos
  medidos desde la hidratación del widget. La interfaz conserva sus datos,
  reinicia Turnstile y muestra el diálogo de reintento.
- `400` con `code: FORM_NOT_CONFIRMED`: honeypot u otro descarte no confirmado.
  Se entrega un mensaje genérico y no se indica qué defensa intervino.
- `403`, `429` y `503`: siguen siendo rechazos, límite o indisponibilidad; no
  generan una confirmación ni limpian los campos.
- `DRY_RUN=true`: los endpoints de correo responden como no confirmados y no
  invocan Resend. Checkout y la pre-reserva de Machu Picchu también rechazan el
  flujo, sin referencia ficticia ni redirección de éxito.

El código `FORM_RETRY` es intencionalmente el único detalle específico expuesto:
evita que una persona que acaba de cargar una isla React pierda una solicitud
legítima. El resto de descartes comparte una respuesta genérica para reducir la
utilidad de la respuesta como oráculo para bots. Los logs estructurados guardan
solo endpoint y resultado, nunca campos, tokens ni dirección IP.

Los modales usan el elemento nativo `dialog`: el navegador gestiona foco,
Escape, modalidad y retorno al control que abrió el diálogo. El formulario de
Libro de Reclamaciones conserva el comportamiento existente de recargar al
aceptar una confirmación real; Escape únicamente cierra el diálogo.
