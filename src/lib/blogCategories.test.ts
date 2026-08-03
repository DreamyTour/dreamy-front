import { describe, expect, test } from "bun:test";

import { getCategoryIconName } from "@/lib/blogCategories";

describe("getCategoryIconName", () => {
	test.each([
		["bolivia", "landmark"],
		["chile", "mountain"],
		["lima", "city"],
		["arequipa-colca", "bird"],
		["ica-paracas-nazca", "plane"],
	] as const)("assigns %s a semantic %s icon", (slug, expectedIcon) => {
		expect(getCategoryIconName(slug)).toBe(expectedIcon);
	});
});
