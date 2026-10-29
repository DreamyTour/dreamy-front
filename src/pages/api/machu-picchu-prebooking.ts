import type { APIRoute } from "astro";
import { countries } from "../../data/countries";
import { checkFormSecurity, securityError } from "../../lib/formSecurity";
import { validateMailForm } from "../../lib/formValidation";
import {
	type MachuPicchuPrebooking,
	validateMachuPicchuPrebooking,
} from "../../lib/machuPicchuPrebooking";
import { buildMachuPicchuPrebookingEmail } from "../../lib/machuPicchuPrebookingEmail";
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
	if (!payload || typeof payload !== "object" || Array.isArray(payload))
		return json({ error: "Invalid body" }, 400);
	const security = await checkFormSecurity(
		request,
		payload as Record<string, unknown>,
	);
	if (security === "discard")
		return json({ reference: "MP-RECEIVED", status: "pending_review" });
	if (security !== "allow") return securityError(security);
	const error = validateMachuPicchuPrebooking(payload);
	if (error) return json({ error }, 400);
	const p = payload as MachuPicchuPrebooking;
	const holder = p.travelers[0];
	if (
		!validateMailForm(
			{
				nombres: `${holder.name} ${holder.lastname}`,
				pais: countries.find((c) => c.iso2 === holder.country)?.nameES,
				email: p.contact.email,
				telefono: p.contact.phone,
			},
			false,
			false,
		)
	)
		return json({ error: "Invalid contact details" }, 400);
	const resend = await getResendClient();
	if (!resend)
		return json(
			{
				error:
					"El envío no está disponible. Comunícate con Dreamy Tours o vuelve a intentarlo más tarde.",
			},
			503,
		);
	const sender = await getDreamySender();
	const recipients = await getDreamyRecipients();
	const reference = `MP-${p.requestId.replaceAll("-", "").slice(0, 12).toUpperCase()}`;
	try {
		const pdf = await generateMachuPicchuPrebookingPdf({
			request: p,
			reference,
			createdAt: new Date(),
		});
		const result = await resend.emails.send(
			{
				from: sender,
				to: recipients,
				replyTo: p.contact.email.trim(),
				subject: `Pre-reserva Machu Picchu · ${reference}`,
				...buildMachuPicchuPrebookingEmail(p, reference, "team"),
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
		const customer = await resend.emails.send(
			{
				from: sender,
				to: [p.contact.email.trim()],
				replyTo: recipients[0],
				subject: `Solicitud recibida: Machu Picchu ? ${reference}`,
				...buildMachuPicchuPrebookingEmail(p, reference, "customer"),
				attachments: [
					{
						filename: `Pre-reserva-Machu-Picchu-${reference}.pdf`,
						content: bytesToBase64(pdf),
						contentType: "application/pdf",
					},
				],
			},
			{ idempotencyKey: `machu-picchu-customer/${p.requestId}` },
		);
		if (customer.error || !customer.data?.id) {
			return json(
				{
					error:
						"Recibimos tu solicitud, pero no pudimos enviar la confirmaci?n a tu correo. Intenta de nuevo para reenviarla.",
				},
				502,
			);
		}
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
