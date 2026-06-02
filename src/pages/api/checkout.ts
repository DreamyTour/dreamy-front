import type { APIRoute } from "astro";
import { escapeHtml } from "../../lib/html";

export const prerender = false;

interface CheckoutPassenger {
	name?: string;
	lastname?: string;
	gender?: string;
	dob?: string;
	country?: string;
	documentType?: string;
	documentNumber?: string;
}

interface CheckoutPayload {
	passengersInfo?: CheckoutPassenger[];
	contactInfo?: {
		firstname?: string;
		lastname?: string;
		email?: string;
		phoneCode?: string;
		phone?: string;
	};
	cart?: {
		tourName?: string;
		date?: string;
		passengers?: number;
		amountPaid?: number;
		amountToPayLabel?: "minimum" | "total";
		totalPrice?: number;
		lang?: "en" | "es" | "pt";
	};
}

export const POST: APIRoute = async ({ request }) => {
	let resend = null;
	const resendApiKey =
		import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;

	if (resendApiKey) {
		try {
			const { Resend } = await import("resend");
			resend = new Resend(resendApiKey);
		} catch (e) {
			console.error("Failed to load Resend:", e);
		}
	}

	try {
		const contentType = request.headers.get("content-type") || "";
		if (!contentType.includes("application/json")) {
			return new Response(
				JSON.stringify({ error: "Content-Type must be application/json" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const rawBody = await request.text();
		if (!rawBody.trim()) {
			return new Response(JSON.stringify({ error: "Empty request body" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const data = JSON.parse(rawBody) as CheckoutPayload;
		const { passengersInfo, contactInfo, cart } = data;
		const passengers = Array.isArray(passengersInfo) ? passengersInfo : [];

		console.log("Checkout API received:", {
			passengersCount: passengers.length,
			hasContactEmail: Boolean(contactInfo?.email),
			tourName: cart?.tourName,
		});

		if (!cart?.tourName || !cart.totalPrice) {
			console.error("Missing cart data");
			return new Response(JSON.stringify({ error: "Missing cart data" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		if (!contactInfo?.email) {
			console.error("Missing contact email");
			return new Response(JSON.stringify({ error: "Missing contact email" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const totalPrice = Number(cart.totalPrice);
		const amountPaid = Number(cart.amountPaid);

		if (!Number.isFinite(totalPrice)) {
			throw new Error("Invalid cart.totalPrice value");
		}

		let emailSent = false;
		let emailError: string | null = null;
		const safeCart = {
			tourName: escapeHtml(cart.tourName),
			date: escapeHtml(cart.date || "Sin definir"),
			passengers: escapeHtml(cart.passengers),
			amountPaid: Number.isFinite(amountPaid) ? amountPaid.toFixed(2) : "0.00",
			totalPrice: totalPrice.toFixed(2),
			amountToPayLabel:
				cart.amountToPayLabel === "minimum" ? "Adelanto del 50%" : "Pago Total",
		};
		const safeContact = {
			firstname: escapeHtml(contactInfo.firstname),
			lastname: escapeHtml(contactInfo.lastname),
			email: escapeHtml(contactInfo.email),
			phoneCode: escapeHtml(contactInfo.phoneCode),
			phone: escapeHtml(contactInfo.phone),
		};

		if (resend && contactInfo.email) {
			const { data: emailData, error: resendError } = await resend.emails.send({
				from: "Reservas Dreamy Tours <info@dreamy.tours>",
				to: ["info@dreamy.tours"],
				subject: `Reserva Confirmada: ${cart.tourName}`,
				replyTo: contactInfo.email,
				html: `
             <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
               <h2>Detalles de la Reserva</h2>
               <p><strong>Tour:</strong> ${safeCart.tourName}</p>
               <p><strong>Fecha de Viaje:</strong> ${safeCart.date}</p>
               <p><strong>Cantidad de Pasajeros:</strong> ${safeCart.passengers}</p>

               <h3>Detalles de Pago</h3>
               <p><strong>Monto Pagado a traves de PayPal:</strong> US$${safeCart.amountPaid}
                 <em>(${safeCart.amountToPayLabel})</em>
               </p>
               <p><strong>Precio Total Original:</strong> US$${safeCart.totalPrice}</p>

               <h3>Datos de Contacto Principales</h3>
               <ul style="list-style: none; padding: 0;">
                  <li><strong>Nombre Completo:</strong> ${safeContact.firstname} ${safeContact.lastname}</li>
                  <li><strong>Correo Electronico:</strong> ${safeContact.email}</li>
                  <li><strong>Telefono / WhatsApp:</strong> ${safeContact.phoneCode} ${safeContact.phone}</li>
               </ul>

               <h3>Informacion de los Pasajeros (Travelers)</h3>
               <ul>
                 ${passengers
										.map((p: CheckoutPassenger, i: number) => {
											const passenger = {
												name: escapeHtml(p.name),
												lastname: escapeHtml(p.lastname),
												gender: escapeHtml(p.gender),
												dob: escapeHtml(p.dob),
												country: escapeHtml(p.country),
												documentType: escapeHtml(p.documentType),
												documentNumber: escapeHtml(p.documentNumber),
											};

											return `<li style="margin-bottom: 12px; background: #f9f9f9; padding: 10px; border-radius: 6px;">
                      <strong style="color: #6d28d9;">Pasajero ${i + 1}:</strong> ${passenger.name} ${passenger.lastname}<br/>
                      <strong>Genero:</strong> ${passenger.gender} |
                      <strong>Fecha de Nacimiento:</strong> ${passenger.dob} |
                      <strong>Pais Emisor:</strong> ${passenger.country}<br/>
                      <strong>${passenger.documentType}:</strong> ${passenger.documentNumber}
                   </li>`;
										})
										.join("")}
               </ul>
             </div>
           `,
			});

			if (resendError) {
				emailError = resendError.message;
				console.error("Resend Error:", resendError);
			} else {
				emailSent = true;
				console.log("Resend email sent:", emailData);
			}
		} else {
			console.log("Resend not configured, skipping email");
		}

		const businessEmail = "info@turismoperu.com.pe";
		const itemName = encodeURIComponent(cart.tourName);
		const amount = Number.isFinite(amountPaid)
			? amountPaid.toFixed(2)
			: totalPrice.toFixed(2);
		const checkoutLang = cart.lang === "es" || cart.lang === "pt" ? cart.lang : "en";
		const successPath =
			checkoutLang === "en"
				? "/checkout/success"
				: `/${checkoutLang}/checkout/success`;
		const returnUrl = encodeURIComponent(
			`${new URL(request.url).origin}${successPath}`,
		);

		const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${businessEmail}&item_name=${itemName}&amount=${amount}&currency_code=USD&return=${returnUrl}`;

		console.log("PayPal URL generated:", paypalUrl);

		return new Response(
			JSON.stringify({
				success: true,
				emailSent,
				emailError,
				redirectUrl: paypalUrl,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("Checkout API Error:", error);
		return new Response(
			JSON.stringify({
				error: "Internal Server Error",
				details: String(error),
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};
