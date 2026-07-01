import type { APIRoute } from "astro";
import { escapeHtml } from "../../lib/html";
import { isResendConfigured, sendDreamyEmail } from "../../lib/resend";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const prerender = false;

async function readRequestData(request: Request) {
	const contentType = request.headers.get("content-type") || "";

	if (contentType.includes("application/json")) {
		return await request.json();
	}

	const formData = await request.formData();
	const data: Record<string, unknown> = Object.fromEntries(formData.entries());
	const destinos = formData.getAll("destinos").map(String).filter(Boolean);

	if (destinos.length > 0) {
		data.destinos = destinos;
	}

	return data;
}

function expectsJson(request: Request) {
	const accept = request.headers.get("accept") || "";
	const contentType = request.headers.get("content-type") || "";

	return (
		accept.includes("application/json") ||
		contentType.includes("application/json")
	);
}

function htmlFormResponse({
	title,
	message,
	backUrl,
	status = 200,
}: {
	title: string;
	message: string;
	backUrl: string;
	status?: number;
}) {
	return new Response(
		`<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f8faf7;
        color: #1f2d29;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main {
        width: min(92vw, 34rem);
        border: 1px solid #dfe7df;
        border-radius: 8px;
        background: white;
        padding: 2rem;
        box-shadow: 0 24px 70px rgba(31, 45, 41, 0.12);
      }
      h1 {
        margin: 0 0 0.75rem;
        font-size: clamp(1.7rem, 4vw, 2.4rem);
        line-height: 1.1;
      }
      p {
        margin: 0 0 1.5rem;
        color: #5f6f67;
        line-height: 1.6;
      }
      a {
        display: inline-flex;
        min-height: 44px;
        align-items: center;
        border-radius: 4px;
        background: #1f6c43;
        color: white;
        padding: 0 1rem;
        font-weight: 700;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(message)}</p>
      <a href="${escapeHtml(backUrl)}">Volver al tour</a>
    </main>
  </body>
</html>`,
		{ status, headers: { "Content-Type": "text/html; charset=utf-8" } },
	);
}

export const POST: APIRoute = async ({ request }) => {
	try {
		const shouldReturnJson = expectsJson(request);
		const backUrl = request.headers.get("referer") || "/";
		const body = await readRequestData(request);
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
		const emailValue = String(email || "").trim();

		if (!nombres || !pais || !emailValue || !emailPattern.test(emailValue)) {
			if (!shouldReturnJson) {
				return htmlFormResponse({
					title: "No se pudo enviar",
					message: "Completa los campos requeridos e intenta nuevamente.",
					backUrl,
					status: 400,
				});
			}

			return new Response(
				JSON.stringify({
					error: "Todos los campos requeridos deben ser completados",
				}),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		if (!isResendConfigured()) {
			console.log("Email simulation: RESEND_API_KEY is not configured", {
				form: "planea-tu-viaje",
				hasPhone: Boolean(telefono),
				hasMessage: Boolean(mensaje),
				destinationsCount: Array.isArray(destinos) ? destinos.length : 0,
			});

			if (!shouldReturnJson) {
				return htmlFormResponse({
					title: "Formulario enviado",
					message: "Gracias por contactarnos. Te responderemos pronto.",
					backUrl,
				});
			}

			return new Response(
				JSON.stringify({
					success: true,
					message:
						"Solicitud recibida correctamente (simulacion - API key no configurada)",
					simulation: true,
				}),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			);
		}

		const safe = {
			nombres: escapeHtml(nombres),
			pais: escapeHtml(pais),
			email: escapeHtml(emailValue),
			telefono: escapeHtml(telefono),
			codigoPais: escapeHtml(codigoPais),
			adultos: escapeHtml(adultos || 1),
			menores: escapeHtml(menores || 0),
			fechaViaje: escapeHtml(fechaViaje || "No especificada"),
			idioma: escapeHtml(idioma),
			categoriaHotel: escapeHtml(categoriaHotel),
			destinos:
				Array.isArray(destinos) && destinos.length > 0
					? destinos.map(escapeHtml).join(", ")
					: "No especificados",
			mensaje: escapeHtml(mensaje || "Sin mensaje adicional"),
			tourName: escapeHtml(tourName),
		};

		const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px;">
          Nueva Solicitud de Viaje - Dreamy Tours
        </h1>

        <h2 style="color: #374151; margin-top: 20px;">INFORMACION PERSONAL</h2>

        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Nombres:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${safe.nombres}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Pais:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${safe.pais}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Email:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${safe.email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">WhatsApp:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${telefono ? `+${safe.codigoPais} ${safe.telefono}` : "No proporcionado"}</td>
          </tr>
        </table>

        <h2 style="color: #374151; margin-top: 20px;">DETALLES DEL VIAJE</h2>

        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          ${
						tourName
							? `
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Tour de interes:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${safe.tourName}</td>
          </tr>
          `
							: ""
					}
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Nro. Adultos:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${safe.adultos}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Nro. Menores:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${safe.menores}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Fecha de Viaje:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${safe.fechaViaje}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Idioma del Guiado:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${safe.idioma}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Categoria de Hotel:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${safe.categoriaHotel}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;" valign="top">Destinos:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${safe.destinos}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;" valign="top">Mensaje:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; white-space: pre-wrap;">${safe.mensaje}</td>
          </tr>
        </table>

        <div style="margin-top: 20px; padding: 15px; background-color: #eff6ff; border-radius: 8px;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            Este mensaje fue enviado desde el formulario de Planea Tu Viaje de Dreamy Tours
          </p>
        </div>
      </div>
    `;

		const { data, error } = await sendDreamyEmail({
			replyTo: emailValue,
			subject: tourName
				? `Solicitud de tour: ${String(tourName)} - ${String(nombres)}`
				: `Nueva solicitud de viaje de ${String(nombres)} - ${String(pais)}`,
			html: htmlContent,
		});

		if (error) {
			console.error("Error de Resend:", error);
			if (!shouldReturnJson) {
				return htmlFormResponse({
					title: "No se pudo enviar",
					message:
						"Hubo un problema al enviar el formulario. Intenta nuevamente o escribenos por WhatsApp.",
					backUrl,
					status: 500,
				});
			}

			return new Response(
				JSON.stringify({ error: "Error al enviar el email", details: error }),
				{ status: 500, headers: { "Content-Type": "application/json" } },
			);
		}

		if (!shouldReturnJson) {
			return htmlFormResponse({
				title: "Formulario enviado",
				message: "Gracias por contactarnos. Te responderemos pronto.",
				backUrl,
			});
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
