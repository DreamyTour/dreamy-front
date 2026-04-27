import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
	try {
		const body = await request.json();

		// Extraer los datos del formulario
		const {
			nombres,
			pais,
			ciudad,
			documento,
			email,
			telefono,
			menorEdad,
			datosApoderado,
			tipo,
			detalle,
		} = body;

		// Validar campos requeridos
		if (
			!nombres ||
			!pais ||
			!ciudad ||
			!documento ||
			!email ||
			!telefono ||
			!tipo ||
			!detalle
		) {
			return new Response(
				JSON.stringify({
					error: "Todos los campos requeridos deben ser completados",
				}),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		// Verificar si tenemos la API key de Resend configurada
		const apiKey = import.meta.env.RESEND_API_KEY;

		if (!apiKey) {
			console.log("📧 Simulación de email (RESEND_API_KEY no configurada):");
			console.log("Datos recibidos:", {
				nombres,
				pais,
				ciudad,
				documento,
				email,
				telefono,
				menorEdad,
				datosApoderado,
				tipo,
				detalle,
			});

			return new Response(
				JSON.stringify({
					success: true,
					message:
						"Reclamación recibida correctamente (simulación - API key no configurada)",
					simulation: true,
				}),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			);
		}

		// Importar Resend dinámicamente (solo funciona en server-side)
		const { Resend } = await import("resend");

		const resend = new Resend(apiKey);

		// Construir el HTML del email
		const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px;">
          📝 Nuevo Libro de Reclamaciones - Dreamy Tours
        </h1>
        
        <h2 style="color: #374151; margin-top: 20px;">IDENTIFICACIÓN DEL CONSUMIDOR RECLAMANTE</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Nombres:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${nombres}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">País:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${pais}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Ciudad:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${ciudad}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Documento:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${documento}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Email:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Teléfono:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${telefono}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Menor de edad:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${menorEdad === "si" ? "Sí" : "No"}</td>
          </tr>
          ${
						menorEdad === "si" && datosApoderado
							? `
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Datos del Apoderado:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${datosApoderado}</td>
          </tr>
          `
							: ""
					}
        </table>
        
        <h2 style="color: #374151; margin-top: 20px;">MANIFIESTO DEL CONSUMIDOR RECLAMANTE</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Tipo:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; color: ${tipo === "reclamo" ? "#dc2626" : "#d97706"}; font-weight: bold;">
              ${tipo === "reclamo" ? "🔴 RECLAMO" : "🟡 QUEJA"}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;" valign="top">Detalle:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; white-space: pre-wrap;">${detalle}</td>
          </tr>
        </table>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #eff6ff; border-radius: 8px;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            Este mensaje fue enviado desde el formulario de Libro de Reclamaciones de Dreamy Tours
          </p>
        </div>
      </div>
    `;

		// Enviar el email usando Resend
		const { data, error } = await resend.emails.send({
			from: "Dreamy Tours <onboarding@resend.dev>", // Cambiar a tu email verificado en producción
			to: ["info@dreamy.tours"],
			reply_to: email,
			subject: `📝 Nuevo ${tipo === "reclamo" ? "RECLAMO" : "QUEJA"} - ${nombres} - ${pais}/${ciudad}`,
			html: htmlContent,
		});

		if (error) {
			console.error("Error de Resend:", error);
			return new Response(
				JSON.stringify({ error: "Error al enviar el email", details: error }),
				{ status: 500, headers: { "Content-Type": "application/json" } },
			);
		}

		return new Response(
			JSON.stringify({
				success: true,
				message: "Reclamación enviada correctamente",
				id: data?.id,
			}),
			{ status: 200, headers: { "Content-Type": "application/json" } },
		);
	} catch (error) {
		console.error("Error en el endpoint:", error);
		return new Response(
			JSON.stringify({ error: "Error interno del servidor" }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
};
