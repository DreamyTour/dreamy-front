import { expect, test } from "bun:test";
import { dayMarkerTooltipLabel } from "./tour-marker-labels";

test("published day title takes precedence over geographic location", () => {
	expect(
		dayMarkerTooltipLabel("DÍA: 04", "  Editorial title  ", "Station", "es"),
	).toBe("Día 04: Editorial title");
});

test("empty titles fall back to the geographic name without guessing content", () => {
	expect(dayMarkerTooltipLabel("DÍA: 01", "  ", "Cusco", "es")).toBe(
		"Día 01: Cusco",
	);
	expect(dayMarkerTooltipLabel("DÍA: 01", undefined, undefined, "es")).toBe(
		"Día 01",
	);
});

test("day prefixes follow ES, EN and PT without translating published titles", () => {
	for (const [lang, prefix] of [
		["es", "Día"],
		["en", "Day"],
		["pt", "Dia"],
	] as const)
		expect(
			dayMarkerTooltipLabel("DAY: 15", "Published text", "Place", lang),
		).toBe(`${prefix} 15: Published text`);
});
