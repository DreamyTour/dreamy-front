import { expect, test } from "bun:test";
import type { MachuPicchuPrebooking } from "./machuPicchuPrebooking";
import { buildMachuPicchuPrebookingEmail } from "./machuPicchuPrebookingEmail";

const request: MachuPicchuPrebooking = {
	requestId: "12345678-1234-4123-8123-123456789abc",
	selection: { date: "2026-12-09", route: "2A", time: "08:00" },
	travelers: [
		{
			name: "Ana <script>",
			lastname: "Pérez",
			dob: "1990-02-12",
			country: "PE",
			documentType: "passport",
			documentNumber: "AB12345",
		},
	],
	contact: { email: "ana@example.com", phone: "+51 987654321" },
	preference: "advice",
	acceptedTerms: true,
};
test("customer receipt includes selection and contact without claiming a confirmed booking", () => {
	const { html, text } = buildMachuPicchuPrebookingEmail(
		request,
		"MP-EXAMPLE",
		"customer",
	);
	for (const value of [
		"MP-EXAMPLE",
		"08:00",
		"Ruta 2A",
		"ana@example.com",
		"Pendiente de revisión",
		"no bloquea cupos",
	])
		expect(text).toContain(value);
	expect(html).toContain("&lt;script&gt;");
	expect(html).not.toContain("<script>");
	expect(text).not.toContain("AB12345");
	expect(text).not.toContain("1990-02-12");
});
test("team notification uses a distinct introduction", () => {
	expect(
		buildMachuPicchuPrebookingEmail(request, "MP-EXAMPLE", "team").text,
	).toContain("Nueva solicitud de pre-reserva");
});
