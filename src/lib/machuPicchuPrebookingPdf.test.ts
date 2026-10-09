import { describe, expect, test } from "bun:test";
import { PDFDocument } from "pdf-lib";
import type { MachuPicchuPrebooking } from "./machuPicchuPrebooking";
import { generateMachuPicchuPrebookingPdf } from "./machuPicchuPrebookingPdf";

function request(count: number): MachuPicchuPrebooking {
	return {
		requestId: "12345678-1234-4123-8123-123456789abc",
		selection: { date: "2027-01-09", route: "2A", time: "08:00" },
		travelers: Array.from({ length: count }, () => ({
			name: "María",
			lastname: "Muñoz Peña",
			dob: "1990-02-12",
			country: "PE",
			documentType: "passport",
			documentNumber: "AB123456",
		})),
		contact: { email: "maria@example.com", phone: "+51 987654321" },
		preference: "advice",
		acceptedTerms: true,
	};
}
describe("Machu Picchu prebooking PDF", () => {
	test("creates an A4 request with reference and pending-review metadata", async () => {
		const bytes = await generateMachuPicchuPrebookingPdf({
			request: request(1),
			reference: "MP-EXAMPLE",
			createdAt: new Date("2026-10-09T15:00:00Z"),
		});
		expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
		const pdf = await PDFDocument.load(bytes);
		expect(pdf.getTitle()).toContain("MP-EXAMPLE");
		expect(pdf.getSubject()).toContain("No confirma disponibilidad ni pago");
		expect(pdf.getPageCount()).toBe(1);
		expect(pdf.getPage(0).getWidth()).toBeCloseTo(595.28);
		expect(pdf.getPage(0).getHeight()).toBeCloseTo(841.89);
	});
	test("paginates a maximum-size group with long names and contact details", async () => {
		const p = request(20);
		p.contact.email = `${"a".repeat(200)}@example.com`;
		p.travelers.forEach((traveler) => {
			traveler.name = "María ".repeat(16);
			traveler.lastname = "Muñoz Peña ".repeat(9);
		});
		const bytes = await generateMachuPicchuPrebookingPdf({
			request: p,
			reference: "MP-GROUP",
			createdAt: new Date("2026-10-09T15:00:00Z"),
		});
		const pdf = await PDFDocument.load(bytes);
		expect(pdf.getPageCount()).toBeGreaterThan(2);
		expect(pdf.getPages().every((page) => page.getHeight() === 841.89)).toBe(
			true,
		);
	});
	test("normalizes accents and handles unsupported font characters", async () => {
		const p = request(1);
		p.travelers[0].name = "Mari\u0301a 李";
		const bytes = await generateMachuPicchuPrebookingPdf({
			request: p,
			reference: "MP-UNICODE",
			createdAt: new Date("2026-10-09T15:00:00Z"),
		});
		expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
	});
});
