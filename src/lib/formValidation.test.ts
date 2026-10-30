import { expect, test } from "bun:test";
import { validateComplaintForm, validateMailForm } from "./formValidation";
import { internationalPhone } from "./formSecurityClient";

const validComplaint = () => ({
	nombres: "María García",
	pais: "Perú",
	ciudad: "Lima",
	documento: "AB123456",
	email: "maria@example.com",
	telefono: "+51987654321",
	menorEdad: "no",
	tipo: "reclamo",
	detalle: "Solicito revisar la atención recibida durante mi visita.",
});

test("normalizes the selected calling code before complaint validation", () => {
	const telefono = internationalPhone("987 654 321", "51");
	expect(telefono).toBe("+51987654321");
	expect(validateComplaintForm({ ...validComplaint(), telefono })).toBeNull();
});

test("normalizes formatted country codes used by Plan your trip", () => {
	expect(internationalPhone("555 0100", "1 264")).toBe("+12645550100");
	expect(internationalPhone("+51 987 654 321", "51")).toBe("+51987654321");
});

test("reports only the invalid complaint field", () => {
	for (const [change, field] of [
		[{ nombres: "Test" }, "nombres"],
		[{ pais: "Atlantis" }, "pais"],
		[{ ciudad: "" }, "ciudad"],
		[{ documento: "1234-5678" }, "documento"],
		[{ email: "invalid" }, "email"],
		[{ telefono: "999999999" }, "telefono"],
		[{ menorEdad: "si", datosApoderado: "" }, "datosApoderado"],
		[{ tipo: "other" }, "tipo"],
		[{ detalle: "Muy malo" }, "detalle"],
	] as const) {
		expect(validateComplaintForm({ ...validComplaint(), ...change })).toBe(
			field,
		);
	}
});

test("the ES, EN and PT country values remain valid", () => {
	for (const pais of ["Perú", "Peru"])
		expect(validateMailForm({ ...validComplaint(), pais }, true, false)).toBe(
			true,
		);
});
