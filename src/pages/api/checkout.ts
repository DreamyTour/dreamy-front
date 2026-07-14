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
		tourId?: string | number;
		date?: string;
		passengers?: number;
		amountToPayLabel?: "minimum" | "total";
		lang?: "en" | "es" | "pt";
	};
}

interface StrapiTour {
	documentId: string;
	priceTour?: number;
	titulo: string;
}

interface StrapiTourResponse {
	data?: StrapiTour | null;
}

const PAYPAL_FEE_RATE = 0.08;
const MAX_PASSENGERS_PER_BOOKING = 20;
const MAX_REQUEST_BYTES = 64 * 1024;
const STRAPI_REQUEST_TIMEOUT_MS = 8_000;
const PAYPAL_BUSINESS_EMAIL =
	import.meta.env.PAYPAL_BUSINESS_EMAIL || "info@turismoperu.com.pe";

function jsonResponse(body: unknown, status: number) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"Cache-Control": "no-store",
			"Content-Type": "application/json; charset=utf-8",
			"X-Content-Type-Options": "nosniff",
		},
	});
}

async function getAuthoritativeTour(
	tourId: string,
): Promise<StrapiTour | null> {
	const baseUrl = import.meta.env.STRAPI_URL || import.meta.env.VITE_STRAPI_URL;
	if (!baseUrl) throw new Error("Strapi URL is not configured");

	const url = new URL(`/api/tours/${encodeURIComponent(tourId)}`, baseUrl);
	url.searchParams.append("fields[0]", "documentId");
	url.searchParams.append("fields[1]", "titulo");
	url.searchParams.append("fields[2]", "priceTour");

	const response = await fetch(url, {
		headers: { Accept: "application/json" },
		signal: AbortSignal.timeout(STRAPI_REQUEST_TIMEOUT_MS),
	});

	if (response.status === 404) return null;
	if (!response.ok) throw new Error(`Strapi returned ${response.status}`);

	const payload = (await response.json()) as StrapiTourResponse;
	return payload.data ?? null;
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

		const contentLength = Number(request.headers.get("content-length") || 0);
		if (contentLength > MAX_REQUEST_BYTES) {
			return jsonResponse({ error: "Request body is too large" }, 413);
		}

		const rawBody = await request.text();
		if (!rawBody.trim()) {
			return jsonResponse({ error: "Empty request body" }, 400);
		}
		if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
			return jsonResponse({ error: "Request body is too large" }, 413);
		}

		const data = JSON.parse(rawBody) as CheckoutPayload;
		const { passengersInfo, contactInfo, cart } = data;
		const passengers = Array.isArray(passengersInfo) ? passengersInfo : [];

		if (!cart) {
			return jsonResponse({ error: "Missing cart data" }, 400);
		}

		const tourId = String(cart.tourId || "").trim();
		if (!/^[a-zA-Z0-9_-]{1,100}$/.test(tourId)) {
			return jsonResponse({ error: "Missing cart data" }, 400);
		}

		if (!contactInfo?.email) {
			console.error("Missing contact email");
			return jsonResponse({ error: "Missing contact email" }, 400);
		}

		const passengerCount = Number(cart.passengers);

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

		if (
			cart.amountToPayLabel !== "minimum" &&
			cart.amountToPayLabel !== "total"
		) {
			return jsonResponse({ error: "Invalid payment option" }, 400);
		}

		const checkoutLang =
			cart.lang === "es" || cart.lang === "pt" ? cart.lang : "en";
		let tour: StrapiTour | null;
		try {
			tour = await getAuthoritativeTour(tourId);
		} catch (error) {
			console.error("Unable to validate checkout price with Strapi", error);
			return jsonResponse({ error: "Unable to validate tour price" }, 502);
		}

		const pricePerPerson = Number(tour?.priceTour);
		if (!tour || !Number.isFinite(pricePerPerson) || pricePerPerson <= 0) {
			return jsonResponse({ error: "Tour is unavailable for checkout" }, 409);
		}
		const totalPrice = pricePerPerson * passengerCount;

		const amountPaid = getPaymentAmount({
			totalPrice,
			amountToPayLabel: cart.amountToPayLabel,
		});

		let emailSent = false;
		const safeCart = {
			tourName: escapeHtml(tour.titulo),
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
				subject: `Reserva: ${tour.titulo} - Dreamy Tours`,
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
				console.error("Resend Error:", resendError);
			} else {
				emailSent = true;
				console.log("Resend email sent:", emailData);
			}
		} else {
			console.log("Resend not configured, skipping email");
		}

		const amount = amountPaid.toFixed(2);
		const successPath =
			checkoutLang === "en"
				? "/checkout/success"
				: `/${checkoutLang}/checkout/success`;
		const paypalUrl = new URL("https://www.paypal.com/cgi-bin/webscr");
		paypalUrl.search = new URLSearchParams({
			cmd: "_xclick",
			business: PAYPAL_BUSINESS_EMAIL,
			item_name: tour.titulo,
			amount,
			currency_code: "USD",
			return: `${new URL(request.url).origin}${successPath}`,
		}).toString();

		return jsonResponse(
			{
				success: true,
				emailSent,
				redirectUrl: paypalUrl.toString(),
			},
			200,
		);
	} catch (error) {
		if (error instanceof SyntaxError) {
			return jsonResponse({ error: "Invalid JSON body" }, 400);
		}
		console.error("Checkout API Error:", error);
		return jsonResponse({ error: "Internal Server Error" }, 500);
	}
};
