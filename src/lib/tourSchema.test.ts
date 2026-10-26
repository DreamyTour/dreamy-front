import { describe, expect, test } from "bun:test";
import { buildTourSchemas } from "./tourSchema";
import type { Tour } from "@/types/tours";

const makeSchema = (
	priceTour: number | undefined,
	slug = "inca-trail-4-days",
) =>
	buildTourSchemas({
		tour: { titulo: "Inca Trail", slug, priceTour } as Tour,
		canonicalUrl: "https://dreamy.tours/inca-trail-4-days/",
		siteUrl: "https://dreamy.tours",
		lang: "en",
	})[0];

describe("tour pricing in structured data", () => {
	test("advertises the published starting price and currency", () => {
		expect(makeSchema(799).offers).toEqual({
			"@type": "Offer",
			name: "From",
			price: 799,
			priceCurrency: "USD",
			url: "https://dreamy.tours/inca-trail-4-days/",
		});
	});
	test("does not invent a price or availability", () => {
		for (const value of [
			undefined,
			0,
			-1,
			Number.NaN,
			Number.POSITIVE_INFINITY,
		]) {
			expect(makeSchema(value).offers).toBeUndefined();
		}
		expect(makeSchema(799).aggregateRating).toBeUndefined();
		expect(makeSchema(799).offers).not.toHaveProperty("availability");
		for (const slug of [
			"huchuy-qosqo-machu-picchu-2-day",
			"private-full-day-inca-trail",
			"camino-inca-full-day-privado",
			"trilha-inca-full-day-privado",
		]) {
			expect(makeSchema(799, slug).offers).toBeUndefined();
		}
	});
});
