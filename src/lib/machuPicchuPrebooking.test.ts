import { describe, expect, test } from "bun:test";
import {
	type MachuPicchuPrebooking,
	validateMachuPicchuPrebooking,
	validateMachuPicchuSelection,
} from "./machuPicchuPrebooking";

const today = "2026-10-09";
function valid(): MachuPicchuPrebooking {
	return {
		requestId: "12345678-1234-4123-8123-123456789abc",
		selection: { date: "2026-12-09", route: "2A", time: "08:00" },
		travelers: [
			{
				name: "Ana",
				lastname: "Pérez",
				dob: "1990-02-12",
				country: "PE",
				documentType: "passport",
				documentNumber: "AB12345",
			},
		],
		contact: { email: "example@example.com", phone: "+51 987654321" },
		preference: "advice",
		acceptedTerms: true,
	};
}
describe("Machu Picchu manual prebooking", () => {
	test("accepts a request without trusting a price or availability from the client", () => {
		expect(validateMachuPicchuPrebooking(valid(), today)).toBeNull();
	});
	test("rejects past and impossible dates, unknown routes and malformed times", () => {
		for (const change of [
			{ date: "2026-10-08" },
			{ date: "2026-02-30" },
			{ date: "2028-01-01" },
			{ route: "__proto__" },
			{ time: "25:00" },
			{ time: "08:30" },
		])
			expect(
				validateMachuPicchuSelection(
					{ ...valid().selection, ...change },
					today,
				),
			).toBe(false);
	});
	test("requires an adult holder and plausible traveler birth dates", () => {
		const p = valid();
		p.travelers[0].dob = "2015-01-01";
		expect(validateMachuPicchuPrebooking(p, today)).toContain("mayor de edad");
		p.travelers[0].dob = "2027-01-01";
		expect(validateMachuPicchuPrebooking(p, today)).toContain("nacimiento");
	});
	test("requires complete travelers, contact, consent and valid preferences", () => {
		for (const change of [
			{ travelers: [] },
			{ travelers: Array(21).fill(valid().travelers[0]) },
			{ contact: { email: "bad", phone: "123" } },
			{ acceptedTerms: false },
			{ preference: "charge-now" },
			{ requestId: "bad" },
		])
			expect(
				validateMachuPicchuPrebooking({ ...valid(), ...change }, today),
			).not.toBeNull();
	});
	test("rejects malformed JSON shapes", () => {
		for (const value of [null, [], "test", {}, { travelers: [null] }])
			expect(validateMachuPicchuPrebooking(value, today)).not.toBeNull();
	});
});
