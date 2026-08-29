import { describe, expect, test } from "bun:test";
import { PDFDocument } from "pdf-lib";
import {
	bytesToBase64,
	formatPrebookingDate,
	generatePrebookingPdf,
	normalizePrebookingText,
} from "@/lib/prebookingPdf";

describe("prebooking PDF", () => {
	test("formats ISO dates with the day first", () => {
		expect(formatPrebookingDate("2026-10-09")).toBe("09/10/2026");
		expect(formatPrebookingDate("09/10/2026")).toBe("09/10/2026");
	});

	test("preserves eñes and normalizes decomposed accents", () => {
		expect(normalizePrebookingText("Mun\u0303oz Pen\u0303a Mari\u0301a")).toBe(
			"Muñoz Peña María",
		);
	});

	test("generates a readable PDF with the quote data", async () => {
		const pdf = await generatePrebookingPdf({
			reference: "DT-ABC12345",
			createdAt: "29/08/2026 10:30",
			tourName: "Camino Inca Clásico 4 días",
			travelDate: "2026-10-10",
			travelEndDate: "2026-10-13",
			permitDate: "2026-10-10",
			road: "1",
			availableSpaces: 12,
			passengerCount: 1,
			pricePerPerson: 620,
			totalPrice: 620,
			paymentPreference: "Adelanto del 50%",
			preferredPaymentAmount: 310,
			contact: {
				firstname: "María",
				lastname: "Muñoz Peña",
				email: "maria@example.com",
				phone: "+51 999888777",
			},
			passengers: [
				{
					name: "María",
					lastname: "Muñoz Peña",
					gender: "Femenino",
					dob: "1990-05-12",
					age: 36,
					country: "Perú",
					documentType: "Pasaporte",
					documentNumber: "P123456",
				},
			],
		});

		expect(new TextDecoder().decode(pdf.slice(0, 5))).toBe("%PDF-");
		expect(bytesToBase64(pdf).startsWith("JVBER")).toBe(true);
		const loaded = await PDFDocument.load(pdf);
		expect(loaded.getPageCount()).toBeGreaterThan(0);
		const firstPage = loaded.getPage(0);
		expect(firstPage.getWidth()).toBeCloseTo(595.28, 1);
		expect(firstPage.getHeight()).toBeCloseTo(841.89, 1);
	});
});
