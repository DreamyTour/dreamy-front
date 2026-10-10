import { countries } from "../data/countries";
import {
	MACHU_PICCHU_ROUTES,
	type MachuPicchuPrebooking,
} from "./machuPicchuPrebooking";
import { generatePrebookingPdf } from "./prebookingPdf";
import { getAgeOnDate } from "./prebooking";

export interface MachuPicchuPdfData {
	request: MachuPicchuPrebooking;
	reference: string;
	createdAt: Date;
}

export async function generateMachuPicchuPrebookingPdf({
	request,
	reference,
	createdAt,
}: MachuPicchuPdfData): Promise<Uint8Array> {
	const holder = request.travelers[0];
	return generatePrebookingPdf({
		reference,
		createdAt:
			new Intl.DateTimeFormat("es-PE", {
				timeZone: "America/Lima",
				dateStyle: "short",
				timeStyle: "short",
			}).format(createdAt) + " - Perú",
		creationDate: createdAt,
		tourName: `Machu Picchu - ${MACHU_PICCHU_ROUTES[request.selection.route]}`,
		travelDate: request.selection.date,
		travelEndDate: request.selection.date,
		permitDate: request.selection.date,
		road: request.selection.route,
		visit: { route: request.selection.route, time: request.selection.time },
		availableSpaces: null,
		passengerCount: request.travelers.length,
		pricePerPerson: null,
		totalPrice: null,
		paymentPreference: {
			minimum: "Adelanto del 50%",
			total: "Pago total",
			advice: "Asesoría antes de decidir",
		}[request.preference],
		preferredPaymentAmount: null,
		contact: {
			firstname: holder.name.trim(),
			lastname: holder.lastname.trim(),
			email: request.contact.email.trim(),
			phone: request.contact.phone.trim(),
		},
		passengers: request.travelers.map((traveler) => ({
			name: traveler.name.trim(),
			lastname: traveler.lastname.trim(),
			gender: "",
			dob: traveler.dob,
			age: getAgeOnDate(traveler.dob, request.selection.date) ?? 0,
			country:
				countries.find((country) => country.iso2 === traveler.country)
					?.nameES || traveler.country,
			documentType:
				traveler.documentType === "passport" ? "Pasaporte" : "Identidad",
			documentNumber: traveler.documentNumber.trim(),
		})),
	});
}
