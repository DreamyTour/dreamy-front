import { countries } from "../data/countries";
import {
	getDateKeyInTimeZone,
	isAdultBookingHolder,
	isPlausibleBirthDate,
	isStrictDateKey,
	MAX_PASSENGERS_PER_BOOKING,
} from "./prebooking";

export const MACHU_PICCHU_ROUTES: Record<string, string> = {
	"1A": "Machu Picchu + Montaña",
	"1B": "Foto clásica",
	"1C": "Machu Picchu + Intipunku",
	"1D": "Machu Picchu + Puente Inca",
	"2A": "Circuito clásico",
	"2B": "Circuito clásico · terraza inferior",
	"3A": "Machu Picchu + Huayna Picchu",
	"3B": "Templos de la parte baja",
	"3C": "Machu Picchu + Templo de la Luna",
	"3D": "Machu Picchu + Huchuy Picchu",
};
export interface MachuPicchuSelection {
	date: string;
	route: string;
	time: string;
}
export interface MachuPicchuTraveler {
	name: string;
	lastname: string;
	dob: string;
	country: string;
	documentType: string;
	documentNumber: string;
}
export interface MachuPicchuPrebooking {
	requestId: string;
	selection: MachuPicchuSelection;
	travelers: MachuPicchuTraveler[];
	contact: { email: string; phone: string };
	preference: "minimum" | "total" | "advice";
	acceptedTerms: boolean;
}
export function validateMachuPicchuSelection(
	value: unknown,
	today = getDateKeyInTimeZone(),
): value is MachuPicchuSelection {
	if (!value || typeof value !== "object") return false;
	const s = value as MachuPicchuSelection;
	return (
		isStrictDateKey(s.date) &&
		s.date >= today &&
		s.date.slice(0, 4) <= String(Number(today.slice(0, 4)) + 1) &&
		typeof s.route === "string" &&
		Object.hasOwn(MACHU_PICCHU_ROUTES, s.route) &&
		typeof s.time === "string" &&
		/^(0[6-9]|1[0-5]):00$/.test(s.time)
	);
}
const text = (value: unknown, max: number) =>
	typeof value === "string" && value.trim().length > 0 && value.length <= max;
export function validateMachuPicchuPrebooking(
	value: unknown,
	today = getDateKeyInTimeZone(),
): string | null {
	if (!value || typeof value !== "object") return "La solicitud no es válida.";
	const p = value as MachuPicchuPrebooking;
	if (
		typeof p.requestId !== "string" ||
		!/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(
			p.requestId,
		)
	)
		return "La referencia de solicitud no es válida.";
	if (!validateMachuPicchuSelection(p.selection, today))
		return "Revisa la fecha, circuito y horario de tu visita.";
	if (
		!Array.isArray(p.travelers) ||
		!p.travelers.length ||
		p.travelers.length > MAX_PASSENGERS_PER_BOOKING
	)
		return "Revisa el número de viajeros.";
	for (const [index, traveler] of p.travelers.entries()) {
		if (
			!traveler ||
			!text(traveler.name, 100) ||
			!text(traveler.lastname, 100) ||
			!countries.some((c) => c.iso2 === traveler.country) ||
			!["passport", "id"].includes(traveler.documentType) ||
			!text(traveler.documentNumber, 30) ||
			!/^[\p{L}\p{N} .-]+$/u.test(traveler.documentNumber)
		)
			return `Completa los datos del viajero ${index + 1}.`;
		if (!isPlausibleBirthDate(traveler.dob, today))
			return `Revisa la fecha de nacimiento del viajero ${index + 1}.`;
	}
	if (!isAdultBookingHolder(p.travelers[0].dob, today))
		return "El primer viajero debe ser mayor de edad y será el titular de la solicitud.";
	if (
		!p.contact ||
		!text(p.contact.email, 254) ||
		!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.contact.email) ||
		!text(p.contact.phone, 30) ||
		!/^\+?[\d ()-]{7,30}$/.test(p.contact.phone) ||
		p.contact.phone.replace(/\D/g, "").length < 7
	)
		return "Revisa tu correo y teléfono de contacto.";
	if (!["minimum", "total", "advice"].includes(p.preference))
		return "Selecciona una preferencia para el futuro pago.";
	if (p.acceptedTerms !== true)
		return "Acepta los términos para enviar tu pre-reserva.";
	return null;
}
