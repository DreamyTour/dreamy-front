import type { APIRoute } from "astro";
import { countries } from "../../data/countries";
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

function getCountryName(countryCode?: string) {
	const normalizedCode = countryCode?.trim().toUpperCase();
	const country = countries.find(
		(country) =>
			country.iso2 === normalizedCode || country.iso3 === normalizedCode,
	);

	return country?.nameES || countryCode || "";
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
		const emailTitle = `${safeCart.tourName} - Dreamy Tours`;
		const tableLabelStyle =
			"padding: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;";
		const tableValueStyle = "padding: 8px; border: 1px solid #e5e7eb;";
		const passengerTables = passengers
			.map((p: CheckoutPassenger, i: number) => {
				const passenger = {
					name: escapeHtml(p.name),
					lastname: escapeHtml(p.lastname),
					gender: escapeHtml(p.gender),
					dob: escapeHtml(p.dob),
					country: escapeHtml(getCountryName(p.country)),
					documentType: escapeHtml(p.documentType),
					documentNumber: escapeHtml(p.documentNumber),
				};

				return `
          <h3 style="color: #374151; margin: 20px 0 8px;">PASAJERO ${i + 1}</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 0 0 15px;">
            <tr>
              <td style="${tableLabelStyle}">Nombre Completo:</td>
              <td style="${tableValueStyle}">${passenger.name} ${passenger.lastname}</td>
            </tr>
            <tr>
              <td style="${tableLabelStyle}">Genero:</td>
              <td style="${tableValueStyle}">${passenger.gender}</td>
            </tr>
            <tr>
              <td style="${tableLabelStyle}">Fecha de Nacimiento:</td>
              <td style="${tableValueStyle}">${passenger.dob}</td>
            </tr>
            <tr>
              <td style="${tableLabelStyle}">Pais Emisor:</td>
              <td style="${tableValueStyle}">${passenger.country}</td>
            </tr>
            <tr>
              <td style="${tableLabelStyle}">${passenger.documentType}:</td>
              <td style="${tableValueStyle}">${passenger.documentNumber}</td>
            </tr>
          </table>
        `;
			})
			.join("");

		if (resend && contactInfo.email) {
			const { data: emailData, error: resendError } = await resend.emails.send({
				from: getDreamySender(),
				to: getDreamyRecipients(),
				subject: `Reserva: ${cart.tourName} - Dreamy Tours`,
				replyTo: contactInfo.email,
				html: `
          <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; color: #333; line-height: 1.6;">
            <h1 style="color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px;">
              ${emailTitle}
            </h1>

            <h2 style="color: #374151; margin-top: 20px;">DETALLES DE LA RESERVA</h2>
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
              <tr>
                <td style="${tableLabelStyle}">Tour:</td>
                <td style="${tableValueStyle}">${safeCart.tourName}</td>
              </tr>
              <tr>
                <td style="${tableLabelStyle}">Fecha de Viaje:</td>
                <td style="${tableValueStyle}">${safeCart.date}</td>
              </tr>
              <tr>
                <td style="${tableLabelStyle}">Cantidad de Pasajeros:</td>
                <td style="${tableValueStyle}">${safeCart.passengers}</td>
              </tr>
            </table>

            <h2 style="color: #374151; margin-top: 20px;">DETALLES DE PAGO</h2>
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
              <tr>
                <td style="${tableLabelStyle}">Monto Pagado por PayPal:</td>
                <td style="${tableValueStyle}">US$${safeCart.amountPaid} <em>(${safeCart.amountToPayLabel})</em></td>
              </tr>
              <tr>
                <td style="${tableLabelStyle}">Precio Total Original:</td>
                <td style="${tableValueStyle}">US$${safeCart.totalPrice}</td>
              </tr>
            </table>

            <h2 style="color: #374151; margin-top: 20px;">DATOS DE CONTACTO</h2>
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
              <tr>
                <td style="${tableLabelStyle}">Nombre Completo:</td>
                <td style="${tableValueStyle}">${safeContact.firstname} ${safeContact.lastname}</td>
              </tr>
              <tr>
                <td style="${tableLabelStyle}">Correo Electronico:</td>
                <td style="${tableValueStyle}">${safeContact.email}</td>
              </tr>
              <tr>
                <td style="${tableLabelStyle}">Telefono / WhatsApp:</td>
                <td style="${tableValueStyle}">${safeContact.phoneCode} ${safeContact.phone}</td>
              </tr>
            </table>

            <h2 style="color: #374151; margin-top: 20px;">DATOS DE PASAJEROS</h2>
            ${passengerTables}

            <div style="margin-top: 20px; padding: 15px; background-color: #eff6ff; border-radius: 8px;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                Este mensaje fue enviado desde el checkout de Dreamy Tours
              </p>
            </div>
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
