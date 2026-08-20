import { describe, expect, test } from "bun:test";
import {
	collapseRepeatedBlogPath,
	getAvailableLanguages,
	localizePath,
	stripDefaultLangPrefix,
	stripLangPrefix,
	translatePathForSlug,
} from "./i18n";

describe("i18n path normalization", () => {
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
			"/es/blog/peruvian-amazon-guide",
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
