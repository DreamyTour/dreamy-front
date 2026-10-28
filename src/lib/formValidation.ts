import { countries } from "../data/countries";

const countryNames = new Set(countries.flatMap((c) => [c.nameES, c.nameEN]));
const otherCountries = new Set(["Otro", "Other", "Outro"]);
const text = (value: unknown) =>
	typeof value === "string" ? value.trim() : "";

/** Shared by every mail endpoint; booking adapters pass the holder's details. */
export function validateMailForm(
	body: Record<string, unknown>,
	complaint = false,
	allowOther = true,
) {
	const name = text(body.nombres);
	const country = text(body.pais);
	if (
		!countryNames.has(country) &&
		!(allowOther && otherCountries.has(country))
	)
		return false;
	if (
		name.length < 5 ||
		name.split(/\s+/).length < 2 ||
		/^(test|testing|prueba)$/i.test(name)
	)
		return false;
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(body.email))) return false;
	if (
		body.telefono != null &&
		body.telefono !== "" &&
		!/^\+[1-9]\d{6,14}$/.test(text(body.telefono))
	)
		return false;
	if (
		complaint &&
		(!/^[a-z0-9]{8,15}$/i.test(text(body.documento)) ||
			text(body.detalle).length < 20)
	)
		return false;
	return true;
}
