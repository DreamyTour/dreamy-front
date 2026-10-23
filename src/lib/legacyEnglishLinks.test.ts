import { expect, test } from "bun:test";
import { currentEnglishCmsHref } from "./legacyEnglishLinks";

test("repairs only the verified CMS links and preserves query strings and fragments", () => {
	expect(
		currentEnglishCmsHref(
			"https://dreamy.tours/en/lima/gastronomic-tour-in-lima/",
		),
	).toBe("https://dreamy.tours/lima-culinary-tour/");
	expect(
		currentEnglishCmsHref(
			"https://dreamy.tours/en/lima/magic-water-tour-full-day/?x=1&x=2#map",
		),
	).toBe("https://dreamy.tours/magic-water-circuit-tour-lima/?x=1&x=2#map");
	expect(currentEnglishCmsHref("/en/lima/")).toBe("/lima/");
});

test("leaves external backlinks, protected historical sources and other languages unchanged", () => {
	for (const href of [
		"https://external.example/en/lima/",
		"https://dreamy.tours.attacker.example/en/lima/",
		"/en/inca-trail-treks/short-inca-trail-to-machu-picchu/",
		"/es/lima/",
		"/pt/lima/",
		"/lima/",
		"mailto:info@dreamy.tours",
		"#en",
		"/en/unknown/",
	])
		expect(currentEnglishCmsHref(href)).toBe(href);
});
