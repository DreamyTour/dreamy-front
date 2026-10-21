import { describe, expect, test } from "bun:test";
import { getUsefulInfoItems, getValidTourRecommendations } from "./categoryTourSections";
import type { TourRecommendation } from "../types/page";

const recommendation: TourRecommendation = {
	titulo: "Lima",
	tour: { documentId: "tour-1", titulo: "City Tour", slug: "city-tour", locale: "es" },
};

describe("category tour CMS recommendations", () => {
	test("useful information stays hidden for missing or empty CMS components", () => {
		for (const info of [undefined, null, {}, { items: [] }, { items: [{}, { etiqueta: "  ", titulo: " ", contenido: [{ type: "paragraph", children: [{ type: "text", text: " " }] }] }] }]) {
			expect(getUsefulInfoItems(info)).toEqual([]);
		}
		expect(getUsefulInfoItems({ items: [{}, { titulo: "Transporte" }, { contenido: [{ type: "paragraph", children: [{ type: "text", text: "Recojo incluido" }] }] }] })).toHaveLength(2);
	});
	test("old pages and empty components have no recommendations", () => {
		for (const selector of [undefined, null, {}, { recomendaciones: [] }]) {
			expect(getValidTourRecommendations(selector, "es", "es")).toEqual([]);
		}
	});
	test("omits missing relations, blank slugs and wrong/missing locales without reordering", () => {
		const warnings: string[] = [];
		const result = getValidTourRecommendations({ recomendaciones: [
			{ tour: null },
			recommendation,
			{ tour: { ...recommendation.tour!, slug: " " } },
			{ tour: { ...recommendation.tour!, locale: "en" } },
			{ ...recommendation, titulo: "Second valid choice" },
		]}, "es", "es", (message) => warnings.push(message));
		expect(result.map((item) => item.sourceIndex)).toEqual([1, 4]);
		expect(result.map((item) => item.titulo)).toEqual(["Lima", "Second valid choice"]);
		expect(warnings).toHaveLength(3);
		for (const [locale, lang] of [[undefined, "es"], ["en", "es"]] as const) {
			expect(getValidTourRecommendations({ recomendaciones: [recommendation] }, locale, lang)).toEqual([]);
		}
	});
});
