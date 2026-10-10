import { escapeHtml } from "./html";
import {
	MACHU_PICCHU_ROUTES,
	type MachuPicchuPrebooking,
} from "./machuPicchuPrebooking";

export function buildMachuPicchuPrebookingEmail(
	request: MachuPicchuPrebooking,
	reference: string,
	audience: "customer" | "team",
) {
	const safe = (value: string) => escapeHtml(value.trim());
	const holder = `${request.travelers[0].name} ${request.travelers[0].lastname}`;
	const date = new Intl.DateTimeFormat("es-PE", {
		dateStyle: "long",
		timeZone: "UTC",
	}).format(new Date(`${request.selection.date}T12:00:00Z`));
	const title =
		audience === "customer"
			? "Confirmación de tu solicitud de pre-reserva"
			: "Nueva solicitud de pre-reserva";
	const intro =
		audience === "customer"
			? `Hola ${holder}, hemos recibido tu solicitud para visitar Machu Picchu. Nuestro equipo revisará los cupos y te contactará para confirmar la disponibilidad y enviarte la cotización.`
			: "Hemos recibido una nueva solicitud para visitar Machu Picchu. Revisa los detalles y contacta al cliente para confirmar la disponibilidad y la cotización.";
	const rows = [
		["Experiencia", "Visita a Machu Picchu"],
		["Fecha de visita", date],
		["Horario solicitado", `${request.selection.time} h · Hora de Perú`],
		[
			"Circuito y ruta",
			`${MACHU_PICCHU_ROUTES[request.selection.route]} · Ruta ${request.selection.route}`,
		],
		["Viajero principal", holder],
		["Viajeros", String(request.travelers.length)],
		[
			"Nombres de los viajeros",
			request.travelers.map((t) => `${t.name} ${t.lastname}`).join("; "),
		],
		["Correo de contacto", request.contact.email],
		["Teléfono", request.contact.phone],
		["Ubicación", "Machu Picchu, Cusco, Perú"],
		["Precio", "Pendiente de cotización"],
		["Estado", "Pendiente de revisión"],
	];
	const note =
		"Esta confirmación acredita la recepción de tu solicitud. Todavía no confirma una reserva, no bloquea cupos y no constituye un boleto de ingreso. No se ha realizado ningún cobro.";
	const text = `Dreamy Tours\n${title}\n\n${intro}\n\nReferencia: ${reference}\n\nDetalles de la solicitud\n${rows.map(([label, value]) => `${label}: ${value}`).join("\n")}\n\n${note}\n\nEncontrarás el resumen de tu solicitud en el PDF adjunto.\nPara cualquier consulta, responde a este correo e indica tu referencia.`;
	const html = `<!doctype html><html lang="es"><body style="margin:0;background:#f5f7f6;font-family:Arial,sans-serif;color:#25332e"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid #e3e9e5;border-radius:16px"><tr><td style="padding:28px 32px;background:#b71532;color:#fff;border-radius:16px 16px 0 0"><p style="margin:0 0 14px;font-size:18px;font-weight:bold">Dreamy Tours</p><h1 style="margin:0;font-size:25px;line-height:1.3">${title}</h1></td></tr><tr><td style="padding:28px 32px"><p style="margin:0 0 22px;line-height:1.7">${safe(intro)}</p><p style="margin:0;padding:16px;background:#edf6ef;color:#007020;border-radius:8px;font-size:14px">Referencia de tu solicitud<br><strong style="font-size:20px">${safe(reference)}</strong></p><h2 style="margin:28px 0 16px;font-size:20px;color:#007020">Detalles de la solicitud</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.map(([label, value]) => `<tr><td style="padding:11px 0;border-bottom:1px solid #edf0ee;font-size:14px;line-height:1.6"><span style="color:#64736b">${safe(label)}</span><br><strong>${safe(value)}</strong></td></tr>`).join("")}</table><p style="margin:24px 0 0;padding:16px;background:#fff1f3;border-radius:8px;font-size:13px;line-height:1.7;color:#852038">${note}</p><p style="margin:22px 0 0;font-size:14px;line-height:1.7">Encontrarás el resumen de tu solicitud en el <strong>PDF adjunto</strong>. Para cualquier consulta, responde a este correo e indica tu referencia.</p><p style="margin:24px 0 0;color:#007020;font-weight:bold">Gracias por elegir Dreamy Tours.</p></td></tr></table></td></tr></table></body></html>`;
	return { html, text };
}
