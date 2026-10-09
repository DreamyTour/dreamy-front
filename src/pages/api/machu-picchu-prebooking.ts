import type { APIRoute } from "astro";
import { escapeHtml } from "../../lib/html";
import {
	MACHU_PICCHU_ROUTES,
	type MachuPicchuPrebooking,
	validateMachuPicchuPrebooking,
} from "../../lib/machuPicchuPrebooking";
import { generateMachuPicchuPrebookingPdf } from "../../lib/machuPicchuPrebookingPdf";
import { bytesToBase64 } from "../../lib/prebookingPdf";
import {
	getDreamyRecipients,
	getDreamySender,
	getResendClient,
} from "../../lib/resend";

export const prerender = false;
const json = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), {
		status,
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "no-store",
		},
	});
export const POST: APIRoute = async ({ request }) => {
	if (
		request.headers.get("origin") &&
		request.headers.get("origin") !== new URL(request.url).origin
	)
		return json({ error: "Origen no permitido." }, 403);
	if (!request.headers.get("content-type")?.includes("application/json"))
		return json({ error: "Formato no válido." }, 415);
	if (Number(request.headers.get("content-length")) > 65536)
		return json({ error: "Solicitud demasiado grande." }, 413);
	let payload: unknown;
	try {
		const body = await request.text();
		if (new TextEncoder().encode(body).length > 65536)
			return json({ error: "Solicitud demasiado grande." }, 413);
		payload = JSON.parse(body);
	} catch {
		return json({ error: "Solicitud no válida." }, 400);
	}
	const error = validateMachuPicchuPrebooking(payload);
	if (error) return json({ error }, 400);
	const p = payload as MachuPicchuPrebooking;
	const resend = getResendClient();
	if (!resend)
		return json(
			{
				error:
					"El envío no está disponible. Comunícate con Dreamy Tours o vuelve a intentarlo más tarde.",
			},
			503,
		);
	const reference = `MP-${p.requestId.replaceAll("-", "").slice(0, 12).toUpperCase()}`;
	const safe = (value: string) => escapeHtml(value.trim());
	try {
		const pdf = await generateMachuPicchuPrebookingPdf({
			request: p,
			reference,
			createdAt: new Date(),
		});
		const result = await resend.emails.send(
			{
				from: getDreamySender(),
				to: getDreamyRecipients(),
				replyTo: p.contact.email.trim(),
				subject: `Pre-reserva Machu Picchu · ${reference}`,
				html: `<h1>Pre-reserva Machu Picchu</h1><p>Referencia: <strong>${reference}</strong></p><p>${safe(p.selection.date)} · ${safe(p.selection.time)} h (Perú)<br>${safe(MACHU_PICCHU_ROUTES[p.selection.route])} · Ruta ${safe(p.selection.route)}<br>${p.travelers.length} viajero(s)</p><p>La solicitud completa, los datos de viajeros y contacto están en el <strong>PDF adjunto</strong>.</p><p>Pendiente de revisión de disponibilidad y precio. No se ha cobrado ni emitido un boleto.</p>`,
				attachments: [
					{
						filename: `Pre-reserva-Machu-Picchu-${reference}.pdf`,
						content: bytesToBase64(pdf),
						contentType: "application/pdf",
					},
				],
			},
			{ idempotencyKey: `machu-picchu/${p.requestId}` },
		);
		if (result.error || !result.data?.id)
			return json(
				{
					error:
						"No pudimos enviar la solicitud. Tus datos siguen en pantalla para volver a intentarlo.",
				},
				502,
			);
		return json({ reference, status: "pending_review" });
	} catch {
		return json(
			{
				error:
					"No pudimos enviar la solicitud. Tus datos siguen en pantalla para volver a intentarlo.",
			},
			502,
		);
	}
};
