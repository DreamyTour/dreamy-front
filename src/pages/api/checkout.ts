import type { APIRoute } from "astro";
import { escapeHtml } from "../../lib/html";
import {
	getDreamyRecipients,
	getDreamySender,
	getResendClient,
} from "../../lib/resend";

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

const PAYPAL_FEE_RATE = 0.08;
const MAX_PASSENGERS_PER_BOOKING = 20;

function jsonResponse(body: unknown, status: number) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

function isValidEmail(email: string) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hasPassengerIdentity(passenger: CheckoutPassenger) {
	return Boolean(
		passenger.name &&
			passenger.lastname &&
			passenger.dob &&
			passenger.documentNumber,
	);
}

function getPaymentAmount({
	totalPrice,
	amountToPayLabel,
}: {
	totalPrice: number;
	amountToPayLabel?: "minimum" | "total";
}) {
	const subtotal = amountToPayLabel === "total" ? totalPrice : totalPrice / 2;

	return subtotal + subtotal * PAYPAL_FEE_RATE;
}

export const POST: APIRoute = async ({ request }) => {
	const resend = getResendClient();

	try {
		const contentType = request.headers.get("content-type") || "";
		if (!contentType.includes("application/json")) {
			return jsonResponse(
				{ error: "Content-Type must be application/json" },
				400,
			);
		}

		const rawBody = await request.text();
		if (!rawBody.trim()) {
			return jsonResponse({ error: "Empty request body" }, 400);
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
			return jsonResponse({ error: "Missing cart data" }, 400);
		}

		if (!contactInfo?.email) {
			console.error("Missing contact email");
			return jsonResponse({ error: "Missing contact email" }, 400);
		}

		const totalPrice = Number(cart.totalPrice);
		const passengerCount = Number(cart.passengers);

		if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
			return jsonResponse({ error: "Invalid cart.totalPrice value" }, 400);
		}

		if (
			!Number.isInteger(passengerCount) ||
			passengerCount < 1 ||
			passengerCount > MAX_PASSENGERS_PER_BOOKING
		) {
			return jsonResponse({ error: "Invalid passenger count" }, 400);
		}

		if (passengers.length !== passengerCount) {
			return jsonResponse(
				{ error: "Passenger information does not match passenger count" },
				400,
			);
		}

		if (!passengers.every(hasPassengerIdentity)) {
			return jsonResponse({ error: "Missing passenger information" }, 400);
		}

		if (!isValidEmail(contactInfo.email)) {
			return jsonResponse({ error: "Invalid contact email" }, 400);
		}

		const amountPaid = getPaymentAmount({
			totalPrice,
			amountToPayLabel: cart.amountToPayLabel,
		});

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
				from: getDreamySender(),
				to: getDreamyRecipients(),
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
		const amount = amountPaid.toFixed(2);
		const checkoutLang =
			cart.lang === "es" || cart.lang === "pt" ? cart.lang : "en";
		const successPath =
			checkoutLang === "en"
				? "/checkout/success"
				: `/${checkoutLang}/checkout/success`;
		const returnUrl = encodeURIComponent(
			`${new URL(request.url).origin}${successPath}`,
		);

		const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${businessEmail}&item_name=${itemName}&amount=${amount}&currency_code=USD&return=${returnUrl}`;

		console.log("PayPal URL generated:", paypalUrl);

		return jsonResponse(
			{
				success: true,
				emailSent,
				emailError,
				redirectUrl: paypalUrl,
			},
			200,
		);
	} catch (error) {
		console.error("Checkout API Error:", error);
		return jsonResponse(
			{
				error: "Internal Server Error",
				details: String(error),
			},
			500,
		);
	}
};
