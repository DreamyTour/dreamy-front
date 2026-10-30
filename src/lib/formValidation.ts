import { countries } from "../data/countries";

const countryNames = new Set(countries.flatMap((c) => [c.nameES, c.nameEN]));
const otherCountries = new Set(["Otro", "Other", "Outro"]);
const text = (value: unknown) =>
	typeof value === "string" ? value.trim() : "";

export type ComplaintValidationField =
	| "nombres"
	| "pais"
	| "ciudad"
	| "documento"
	| "email"
	| "telefono"
	| "datosApoderado"
	| "tipo"
	| "detalle";

function mailFormValidationField(
	body: Record<string, unknown>,
	complaint = false,
	allowOther = true,
): ComplaintValidationField | null {
	const name = text(body.nombres);
	const country = text(body.pais);
	if (
		!countryNames.has(country) &&
		!(allowOther && otherCountries.has(country))
	)
		return "pais";
	if (
		name.length < 5 ||
		name.split(/\s+/).length < 2 ||
		/^(test|testing|prueba)$/i.test(name)
	)
		return "nombres";
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(body.email))) return "email";
	if (
		body.telefono != null &&
		body.telefono !== "" &&
		!/^\+[1-9]\d{6,14}$/.test(text(body.telefono))
	)
		return "telefono";
	if (
		complaint &&
		(!/^[a-z0-9]{8,15}$/i.test(text(body.documento)) ||
			text(body.detalle).length < 20)
	)
		return !/^[a-z0-9]{8,15}$/i.test(text(body.documento))
			? "documento"
			: "detalle";
	return null;
}

/** Shared by every mail endpoint; booking adapters pass the holder's details. */
export function validateMailForm(
	body: Record<string, unknown>,
	complaint = false,
	allowOther = true,
) {
	return mailFormValidationField(body, complaint, allowOther) === null;
}

/**
 * Complaint-only constraints with a safe field identifier for UI feedback.
 * Values, tokens and security decisions are intentionally never returned.
 */
export function validateComplaintForm(
	body: Record<string, unknown>,
): ComplaintValidationField | null {
	const mailField = mailFormValidationField(body, true, false);
	if (mailField) return mailField;
	if (!text(body.ciudad)) return "ciudad";
	if (!text(body.telefono)) return "telefono";
	if (!text(body.tipo) || !["reclamo", "queja"].includes(text(body.tipo)))
		return "tipo";
	if (text(body.menorEdad) === "si" && !text(body.datosApoderado))
		return "datosApoderado";
	return null;
}
