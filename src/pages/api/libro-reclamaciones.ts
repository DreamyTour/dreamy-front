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
  return Object.fromEntries(formData.entries());
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await readRequestData(request);
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
    const emailValue = String(email || "").trim();
    const typeValue = tipo === "reclamo" ? "reclamo" : "queja";

    if (
      !nombres ||
      !pais ||
      !ciudad ||
      !documento ||
      !emailValue ||
      !emailPattern.test(emailValue) ||
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

    if (!isResendConfigured()) {
      console.log("Email simulation: RESEND_API_KEY is not configured", {
        form: "libro-reclamaciones",
        type: typeValue,
        hasGuardianData: Boolean(datosApoderado),
      });

      return new Response(
        JSON.stringify({
          success: true,
          message:
            "Reclamacion recibida correctamente (simulacion - API key no configurada)",
          simulation: true,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const safe = {
      nombres: escapeHtml(nombres),
      pais: escapeHtml(pais),
      ciudad: escapeHtml(ciudad),
      documento: escapeHtml(documento),
      email: escapeHtml(emailValue),
      telefono: escapeHtml(telefono),
      datosApoderado: escapeHtml(datosApoderado),
      detalle: escapeHtml(detalle),
    };

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px;">
          Nuevo Libro de Reclamaciones - Dreamy Tours
        </h1>

        <h2 style="color: #374151; margin-top: 20px;">IDENTIFICACION DEL CONSUMIDOR RECLAMANTE</h2>

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
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Ciudad:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${safe.ciudad}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Documento:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${safe.documento}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Email:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${safe.email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Telefono:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${safe.telefono}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Menor de edad:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${menorEdad === "si" ? "Si" : "No"}</td>
          </tr>
          ${
            menorEdad === "si" && datosApoderado
              ? `
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Datos del Apoderado:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${safe.datosApoderado}</td>
          </tr>
          `
              : ""
          }
        </table>

        <h2 style="color: #374151; margin-top: 20px;">MANIFIESTO DEL CONSUMIDOR RECLAMANTE</h2>

        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Tipo:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; color: ${typeValue === "reclamo" ? "var(--secondary)" : "#d97706"}; font-weight: bold;">
              ${typeValue === "reclamo" ? "RECLAMO" : "QUEJA"}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;" valign="top">Detalle:</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; white-space: pre-wrap;">${safe.detalle}</td>
          </tr>
        </table>

        <div style="margin-top: 20px; padding: 15px; background-color: #eff6ff; border-radius: 8px;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            Este mensaje fue enviado desde el formulario de Libro de Reclamaciones de Dreamy Tours
          </p>
        </div>
      </div>
    `;

    const { data, error } = await sendDreamyEmail({
      replyTo: emailValue,
      subject: `Nuevo ${typeValue === "reclamo" ? "RECLAMO" : "QUEJA"} - ${String(nombres)} - ${String(pais)}/${String(ciudad)}`,
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
        message: "Reclamacion enviada correctamente",
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
