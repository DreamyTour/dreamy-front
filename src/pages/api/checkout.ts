import type { APIRoute } from "astro";
import { countries } from "../../data/countries";
import { escapeHtml } from "../../lib/html";
import {
	fetchIncaTrailTickets,
	shiftDateKey,
} from "../../lib/incaTrailAvailability";
import { getIncaTrailBookingConfig } from "../../lib/incaTrailBooking";
import {
	getAgeOnDate,
	getDateKeyInTimeZone,
	getPreferredPaymentAmount,
	isAdultBookingHolder,
	isPlausibleBirthDate,
	isStrictDateKey,
	MAX_PASSENGERS_PER_BOOKING,
	type PaymentPreference,
} from "../../lib/prebooking";
import {
	bytesToBase64,
	formatPrebookingDate,
	generatePrebookingPdf,
	normalizePrebookingText,
} from "../../lib/prebookingPdf";
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
		email?: string;
		phone?: string;
	};
	cart?: {
		quoteRequestId?: string;
		tourId?: string | number;
		date?: string;
		passengers?: number;
		paymentPreference?: PaymentPreference;
		lang?: "en" | "es" | "pt";
	};
}

interface StrapiTour {
	documentId: string;
	priceTour?: number;
	titulo: string;
	slug: string;
}

interface StrapiTourResponse {
	data?: StrapiTour | null;
}

type CheckoutLang = "en" | "es" | "pt";

const MAX_REQUEST_BYTES = 64 * 1024;
const STRAPI_REQUEST_TIMEOUT_MS = 8_000;
const CALENDAR_REQUEST_TIMEOUT_MS = 8_000;
const errorCopy = {
	es: {
		invalidContact: "Completa correctamente todos los datos de contacto.",
		invalidPassenger: "Completa correctamente los datos de cada pasajero.",
		invalidBirthDate: "Revisa las fechas de nacimiento ingresadas.",
		adultHolder:
			"El Viajero 1 es el titular de la pre-reserva y debe tener al menos 18 años.",
		invalidTravelDate: "La fecha del viaje debe ser válida y no estar vencida.",
		noAvailability: "La fecha seleccionada ya no tiene cupos disponibles.",
		insufficientAvailability:
			"Los cupos disponibles ya no alcanzan para la cantidad de pasajeros.",
		calendarUnavailable:
			"No pudimos verificar los cupos en este momento. Inténtalo nuevamente.",
		emailUnavailable:
			"El envío de pre-reservas no está configurado. Comunícate con Dreamy Tours.",
		emailFailed:
			"No pudimos enviar la pre-reserva. Tus datos siguen en pantalla para que vuelvas a intentarlo.",
	},
	en: {
		invalidContact: "Please complete all contact details correctly.",
		invalidPassenger: "Please complete every traveler's details correctly.",
		invalidBirthDate: "Please review the entered dates of birth.",
		adultHolder:
			"Traveler 1 is the pre-booking holder and must be at least 18 years old.",
		invalidTravelDate: "The travel date must be valid and not in the past.",
		noAvailability: "The selected date is no longer available.",
		insufficientAvailability:
			"There are no longer enough spaces for the selected number of travelers.",
		calendarUnavailable:
			"We could not verify availability right now. Please try again.",
		emailUnavailable:
			"Pre-booking delivery is not configured. Please contact Dreamy Tours.",
		emailFailed:
			"We could not send the pre-booking. Your details remain on screen so you can try again.",
	},
	pt: {
		invalidContact: "Preencha corretamente todos os dados de contato.",
		invalidPassenger: "Preencha corretamente os dados de cada viajante.",
		invalidBirthDate: "Revise as datas de nascimento informadas.",
		adultHolder:
			"O Viajante 1 é o titular da pré-reserva e deve ter pelo menos 18 anos.",
		invalidTravelDate: "A data da viagem deve ser válida e não estar vencida.",
		noAvailability: "A data selecionada não possui mais vagas.",
		insufficientAvailability:
			"As vagas disponíveis não são suficientes para a quantidade de viajantes.",
		calendarUnavailable:
			"Não foi possível verificar as vagas agora. Tente novamente.",
		emailUnavailable:
			"O envio de pré-reservas não está configurado. Entre em contato com a Dreamy Tours.",
		emailFailed:
			"Não foi possível enviar a pré-reserva. Seus dados continuam na tela para tentar novamente.",
	},
} as const;

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
	url.searchParams.append("fields[3]", "slug");

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
	return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isTextInRange(value: unknown, min: number, max: number) {
	return (
		typeof value === "string" &&
		value.trim().length >= min &&
		value.trim().length <= max
	);
}

function hasCompletePassengerIdentity(passenger: CheckoutPassenger) {
	return (
		isTextInRange(passenger.name, 1, 100) &&
		isTextInRange(passenger.lastname, 1, 100) &&
		(passenger.gender === "Male" || passenger.gender === "Female") &&
		(passenger.documentType === "Passport" ||
			passenger.documentType === "ID") &&
		isTextInRange(passenger.documentNumber, 3, 50) &&
		countries.some((country) => country.iso2 === passenger.country)
	);
}

function isValidContact(contactInfo: CheckoutPayload["contactInfo"]) {
	if (!contactInfo) return false;

	return (
		typeof contactInfo.email === "string" &&
		isValidEmail(contactInfo.email.trim()) &&
		typeof contactInfo.phone === "string" &&
		/^[\d\s()+-]{6,25}$/.test(contactInfo.phone.trim())
	);
}

function getCountryName(countryCode?: string) {
	const country = countries.find((item) => item.iso2 === countryCode);
	return country?.nameES || countryCode || "";
}

function getCheckoutLang(lang?: string): CheckoutLang {
	return lang === "es" || lang === "pt" ? lang : "en";
}

function getPaymentPreferenceLabel(preference: PaymentPreference) {
	return preference === "minimum" ? "Adelanto del 50%" : "Pago total";
}

function getGenderLabel(gender?: string) {
	return gender === "Female" ? "Femenino" : "Masculino";
}

function getDocumentTypeLabel(documentType?: string) {
	return documentType === "ID" ? "Documento de identidad" : "Pasaporte";
}

function getReference(requestId: string) {
	return `DT-${requestId.replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}

function formatLimaDateTime(date: Date) {
	const parts = new Intl.DateTimeFormat("en-GB", {
		timeZone: "America/Lima",
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
	}).formatToParts(date);
	const value = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((part) => part.type === type)?.value || "";

	return `${value("day")}/${value("month")}/${value("year")} ${value("hour")}:${value("minute")}`;
}

export const POST: APIRoute = async ({ request }) => {
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
		const checkoutLang = getCheckoutLang(cart?.lang);
		const errors = errorCopy[checkoutLang];

		if (!cart) {
			return jsonResponse({ error: "Missing cart data" }, 400);
		}

		const quoteRequestId = String(cart.quoteRequestId || "").trim();
		if (
			!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
				quoteRequestId,
			)
		) {
			return jsonResponse({ error: "Invalid pre-booking request id" }, 400);
		}

		const tourId = String(cart.tourId || "").trim();
		if (!/^[a-zA-Z0-9_-]{1,100}$/.test(tourId)) {
			return jsonResponse({ error: "Missing cart data" }, 400);
		}

		if (!isValidContact(contactInfo)) {
			return jsonResponse({ error: errors.invalidContact }, 400);
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

		if (!passengers.every(hasCompletePassengerIdentity)) {
			return jsonResponse({ error: errors.invalidPassenger }, 400);
		}

		const todayDateKey = getDateKeyInTimeZone();
		if (
			!passengers.every(
				(passenger) =>
					typeof passenger.dob === "string" &&
					isPlausibleBirthDate(passenger.dob, todayDateKey),
			)
		) {
			return jsonResponse({ error: errors.invalidBirthDate }, 400);
		}

		if (
			typeof passengers[0]?.dob !== "string" ||
			!isAdultBookingHolder(passengers[0].dob, todayDateKey)
		) {
			return jsonResponse({ error: errors.adultHolder }, 400);
		}

		if (
			cart.paymentPreference !== "minimum" &&
			cart.paymentPreference !== "total"
		) {
			return jsonResponse({ error: "Invalid payment preference" }, 400);
		}

		if (
			!isStrictDateKey(cart.date) ||
			cart.date.localeCompare(todayDateKey) < 0
		) {
			return jsonResponse({ error: errors.invalidTravelDate }, 400);
		}

		let tour: StrapiTour | null;
		try {
			tour = await getAuthoritativeTour(tourId);
		} catch (error) {
			console.error(
				JSON.stringify({
					message: "Unable to validate pre-booking price with Strapi",
					error: error instanceof Error ? error.message : String(error),
				}),
			);
			return jsonResponse({ error: "Unable to validate tour price" }, 502);
		}

		const pricePerPerson = Number(tour?.priceTour);
		const bookingConfig = getIncaTrailBookingConfig(tour?.slug);
		if (
			!tour ||
			!bookingConfig ||
			!Number.isFinite(pricePerPerson) ||
			pricePerPerson <= 0
		) {
			return jsonResponse(
				{ error: "Tour is unavailable for pre-booking" },
				409,
			);
		}

		const permitDate = shiftDateKey(
			cart.date,
			Math.max(0, bookingConfig.permitStartOffsetDays),
		);
		const [, permitMonth] = permitDate.split("-").map(Number);
		const permitYear = Number(permitDate.slice(0, 4));
		let availableSpaces: number;

		try {
			const tickets = await fetchIncaTrailTickets({
				road: bookingConfig.road,
				year: permitYear,
				month: permitMonth,
				signal: AbortSignal.timeout(CALENDAR_REQUEST_TIMEOUT_MS),
			});
			availableSpaces = Number(tickets[permitDate] ?? 0);
		} catch (error) {
			console.error(
				JSON.stringify({
					message: "Unable to validate Inca Trail availability",
					error: error instanceof Error ? error.message : String(error),
					requestId: quoteRequestId,
				}),
			);
			return jsonResponse({ error: errors.calendarUnavailable }, 502);
		}

		if (!Number.isFinite(availableSpaces) || availableSpaces <= 0) {
			return jsonResponse({ error: errors.noAvailability }, 409);
		}
		if (availableSpaces < passengerCount) {
			return jsonResponse({ error: errors.insufficientAvailability }, 409);
		}

		const resend = getResendClient();
		if (!resend) {
			return jsonResponse({ error: errors.emailUnavailable }, 503);
		}

		const totalPrice = pricePerPerson * passengerCount;
		const preferredPaymentAmount = getPreferredPaymentAmount(
			totalPrice,
			cart.paymentPreference,
		);
		const paymentPreferenceLabel = getPaymentPreferenceLabel(
			cart.paymentPreference,
		);
		const travelEndDate = shiftDateKey(
			cart.date,
			Math.max(1, bookingConfig.durationDays) - 1,
		);
		const reference = getReference(quoteRequestId);
		const createdAt = formatLimaDateTime(new Date());
		const normalizedPassengers = passengers.map((passenger) => ({
			name: normalizePrebookingText(passenger.name?.trim()),
			lastname: normalizePrebookingText(passenger.lastname?.trim()),
			gender: getGenderLabel(passenger.gender),
			dob: passenger.dob || "",
			age: getAgeOnDate(passenger.dob || "", todayDateKey) ?? 0,
			country: getCountryName(passenger.country),
			documentType: getDocumentTypeLabel(passenger.documentType),
			documentNumber: normalizePrebookingText(passenger.documentNumber?.trim()),
		}));
		const bookingHolder = normalizedPassengers[0];
		const bookingHolderCountry = countries.find(
			(country) => country.iso2 === passengers[0]?.country,
		);
		const normalizedContact = {
			firstname: bookingHolder.name,
			lastname: bookingHolder.lastname,
			email: contactInfo?.email?.trim() || "",
			phoneCode: bookingHolderCountry
				? `+${bookingHolderCountry.phoneCode}`
				: "",
			phone: contactInfo?.phone?.trim() || "",
		};

		const pdfBytes = await generatePrebookingPdf({
			reference,
			createdAt,
			tourName: tour.titulo,
			travelDate: cart.date,
			travelEndDate,
			permitDate,
			road: bookingConfig.road,
			availableSpaces,
			passengerCount,
			pricePerPerson,
			totalPrice,
			paymentPreference: paymentPreferenceLabel,
			preferredPaymentAmount,
			contact: {
				firstname: normalizedContact.firstname,
				lastname: normalizedContact.lastname,
				email: normalizedContact.email,
				phone: `${normalizedContact.phoneCode} ${normalizedContact.phone}`,
			},
			passengers: normalizedPassengers,
		});

		const safe = {
			reference: escapeHtml(reference),
			tourName: escapeHtml(tour.titulo),
			travelDate: escapeHtml(formatPrebookingDate(cart.date)),
			travelEndDate: escapeHtml(formatPrebookingDate(travelEndDate)),
			permitDate: escapeHtml(formatPrebookingDate(permitDate)),
			road: escapeHtml(bookingConfig.road),
			passengers: escapeHtml(passengerCount),
			availableSpaces: escapeHtml(availableSpaces),
			totalPrice: totalPrice.toFixed(2),
			paymentPreference: escapeHtml(paymentPreferenceLabel),
			preferredPaymentAmount: preferredPaymentAmount.toFixed(2),
			contactName: escapeHtml(
				`${normalizedContact.firstname} ${normalizedContact.lastname}`,
			),
			contactEmail: escapeHtml(normalizedContact.email),
			contactPhone: escapeHtml(
				`${normalizedContact.phoneCode} ${normalizedContact.phone}`,
			),
		};

		const { data: emailData, error: resendError } = await resend.emails.send(
			{
				from: getDreamySender(),
				to: getDreamyRecipients(),
				replyTo: normalizedContact.email,
				subject: `Pre-reserva ${reference}: ${tour.titulo}`,
				html: `
          <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; color: #24332d; line-height: 1.6;">
            <p style="margin: 0 0 8px; color: #1f6c43; font-size: 12px; font-weight: bold; letter-spacing: .12em;">DREAMY TOURS</p>
            <h1 style="margin: 0 0 16px; color: #1f2d29;">Nueva solicitud de pre-reserva</h1>
            <p><strong>Referencia:</strong> ${safe.reference}</p>
            <p style="padding: 12px; background: #fff4ec; border-left: 4px solid #db5b24;"><strong>No se realizó ningún cobro.</strong> El cliente espera que un agente revise la solicitud y genere el enlace de pago.</p>
            <h2 style="margin-top: 24px; color: #1f6c43;">Tour y disponibilidad</h2>
            <p><strong>Tour:</strong> ${safe.tourName}</p>
            <p><strong>Viaje:</strong> ${safe.travelDate} al ${safe.travelEndDate}</p>
            <p><strong>Permiso / ruta:</strong> ${safe.permitDate} / ${safe.road}</p>
            <p><strong>Pasajeros:</strong> ${safe.passengers} (${safe.availableSpaces} cupos consultados)</p>
            <h2 style="margin-top: 24px; color: #1f6c43;">Cotización</h2>
            <p><strong>Precio total:</strong> US$${safe.totalPrice}</p>
            <p><strong>Preferencia:</strong> ${safe.paymentPreference}</p>
            <p><strong>Monto para el futuro enlace:</strong> US$${safe.preferredPaymentAmount}</p>
            <h2 style="margin-top: 24px; color: #1f6c43;">Contacto</h2>
            <p>${safe.contactName}<br />${safe.contactEmail}<br />${safe.contactPhone}</p>
            <p style="margin-top: 24px; color: #6f6258;">El PDF adjunto contiene los datos completos de los pasajeros.</p>
          </div>
        `,
				attachments: [
					{
						content: bytesToBase64(pdfBytes),
						filename: `pre-reserva-${reference}.pdf`,
						contentType: "application/pdf",
					},
				],
			},
			{ idempotencyKey: `prebooking-${quoteRequestId}` },
		);

		if (resendError || !emailData) {
			console.error(
				JSON.stringify({
					message: "Unable to send pre-booking email",
					error: resendError?.message || "Unknown Resend error",
					requestId: quoteRequestId,
				}),
			);
			return jsonResponse({ error: errors.emailFailed }, 502);
		}

		console.log(
			JSON.stringify({
				message: "Pre-booking email sent",
				requestId: quoteRequestId,
				reference,
				emailId: emailData.id,
			}),
		);

		const successPath =
			checkoutLang === "en"
				? "/checkout/success"
				: `/${checkoutLang}/checkout/success`;

		return jsonResponse(
			{
				success: true,
				reference,
				redirectUrl: successPath,
			},
			200,
		);
	} catch (error) {
		if (error instanceof SyntaxError) {
			return jsonResponse({ error: "Invalid JSON body" }, 400);
		}
		console.error(
			JSON.stringify({
				message: "Pre-booking API error",
				error: error instanceof Error ? error.message : String(error),
			}),
		);
		return jsonResponse({ error: "Internal Server Error" }, 500);
	}
};
