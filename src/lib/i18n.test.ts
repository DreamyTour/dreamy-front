import { describe, expect, test } from "bun:test";
import {
	collapseRepeatedBlogPath,
	getAvailableLanguages,
	localizePath,
	rewriteUrl,
	stripDefaultLangPrefix,
	stripLangPrefix,
	translatePathForSlug,
} from "./i18n";

describe("i18n path normalization", () => {
	test("links directly to directory pages in every language", () => {
		for (const lang of ["en", "es", "pt"] as const) {
			const prefix = lang === "en" ? "" : `/${lang}`;
			expect(rewriteUrl("/tour", lang)).toBe(`${prefix}/tour/`);
			expect(rewriteUrl("/tour/", lang)).toBe(`${prefix}/tour/`);
			expect(localizePath("/", lang)).toBe(`${prefix}/`);
			expect(rewriteUrl("tour?date=2026-10-01#booking", lang)).toBe(
				`${prefix}/tour/?date=2026-10-01#booking`,
			);
			expect(rewriteUrl("/#machupicchu", lang)).toBe(`${prefix}/#machupicchu`);
		}
	});

	test("preserves special links, files and endpoints", () => {
		for (const url of [
			"#booking",
			"?page=2",
			"mailto:info@dreamy.tours",
			"tel:+51969787221",
			"https://example.com/tour",
			"//cdn.dreamy.tours/image.webp",
			"/imagenes/mapa.svg",
			"/tour-search.json?lang=es",
			"/api/checkout",
			"/_server-islands/BookingFormIsland?p=abc",
			"/document.pdf#page=2",
		]) {
			expect(rewriteUrl(url, "es")).toBe(url);
			expect(localizePath(url, "pt")).toBe(url);
		}
		expect(rewriteUrl(undefined, "es")).toBe("#");
	});

	test("collapses repeated blog slug segments", () => {
		expect(
			collapseRepeatedBlogPath(
				"/en/blog/peruvian-amazon-guide/blog/peruvian-amazon-guide/blog/peruvian-amazon-guide",
			),
		).toBe("/en/blog/peruvian-amazon-guide");
	});

	test("does not propagate repeated blog paths when switching languages", () => {
		const repeatedPath =
			"/en/blog/peruvian-amazon-guide/blog/peruvian-amazon-guide";

		expect(stripLangPrefix(repeatedPath)).toBe("/blog/peruvian-amazon-guide");
		expect(localizePath(repeatedPath, "es")).toBe(
			"/es/blog/peruvian-amazon-guide/",
		);
	});

	test("removes only the default-language prefix and preserves the leading slash", () => {
		expect(
			stripDefaultLangPrefix(
				"/en/lares-trek-machu-picchu-4-days/lares-trek-machu-picchu-4-days",
			),
		).toBe("/lares-trek-machu-picchu-4-days/lares-trek-machu-picchu-4-days");
		expect(stripDefaultLangPrefix("/en")).toBe("/");
		expect(stripDefaultLangPrefix("/enquiry")).toBe("/enquiry");
	});

	test("translates blog slugs when production URLs include trailing slash", () => {
		const translated = translatePathForSlug(
			"/es/blog/puerto-maldonado/",
			"peruvian-amazon-guide",
		);

		expect(translated).toBe("/blog/peruvian-amazon-guide/");
		expect(localizePath(translated, "en")).toBe("/blog/peruvian-amazon-guide/");
	});

	test("only exposes languages with a translation for localized content", () => {
		expect(
			getAvailableLanguages(
				{ en: "inca-trail-permits", es: "permisos-camino-inca" },
				"en",
			),
		).toEqual(["en", "es"]);
	});
});
