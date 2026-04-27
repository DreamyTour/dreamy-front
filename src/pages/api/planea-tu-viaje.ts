import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
	try {
		const body = await request.json();

		const {
			nombres,
			pais,
			email,
			telefono,
			codigoPais,
			adultos,
			menores,
			fechaViaje,
			idioma,
			categoriaHotel,
			destinos,
			mensaje,
			tourName,
		} = body;

		// Validar campos requeridos
		if (!nombres || !pais || !email) {
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
				email,
				telefono,
				codigoPais,
				adultos,
				menores,
				fechaViaje,
				idioma,
				categoriaHotel,
				destinos,
				mensaje,
			});

			return new Response(
				JSON.stringify({
					success: true,
					message:
						"Solicitud recibida correctamente (simulación - API key no configurada)",
					simulation: true,
				}),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			);
		}

		// Importar Resend dinámicamente
		const { Resend } = await import("resend");
		const resend = new Resend(apiKey);

		// Construir el HTML del email
		const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px;">
          🌍 Nueva Solicitud de Viaje - Dreamy Tours
        </h1>
        
        <h2 style="color: #374151; margin-top: 20px;">INFORMACIÓN PERSONAL</h2>
        
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
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Email:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">WhatsApp:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${telefono ? `+${codigoPais} ${telefono}` : "No proporcionado"}</td>
          </tr>
        </table>
        
        <h2 style="color: #374151; margin-top: 20px;">DETALLES DEL VIAJE</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          ${
						tourName
							? `
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Tour de interés:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${tourName}</td>
          </tr>
          `
							: ""
					}
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">N° Adultos:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${adultos || 1}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">N° Menores:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${menores || 0}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Fecha de Viaje:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${fechaViaje || "No especificada"}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Idioma del Guiado:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${idioma}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Categoría de Hotel:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${categoriaHotel}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;" valign="top">Destinos:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${destinos && destinos.length > 0 ? destinos.join(", ") : "No especificados"}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;" valign="top">Mensaje:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; white-space: pre-wrap;">${mensaje || "Sin mensaje adicional"}</td>
          </tr>
        </table>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #eff6ff; border-radius: 8px;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            Este mensaje fue enviado desde el formulario de Planea Tu Viaje de Dreamy Tours
          </p>
        </div>
      </div>
    `;

		// Enviar el email usando Resend
		const { data, error } = await resend.emails.send({
			from: "Dreamy Tours <onboarding@resend.dev>",
			to: ["info@dreamy.tours"],
			reply_to: email,
			subject: tourName
				? `🎯 Solicitud de tour: ${tourName} - ${nombres}`
				: `🌍 Nueva solicitud de viaje de ${nombres} - ${pais}`,
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
				message: "Solicitud enviada correctamente",
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
