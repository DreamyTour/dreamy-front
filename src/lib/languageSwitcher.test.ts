import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { localizePath, translatePathForSlug } from "./i18n";

// Exercise the actual inline desktop helpers, which cannot import i18n.ts.
const component = readFileSync(
	new URL("../components/LanguageSwitcherInline.astro", import.meta.url),
	"utf8",
);
const start = component.indexOf("const stripLangPrefix =");
const end = component.indexOf("const getAvailableLangs =", start);
if (start < 0 || end < 0) throw new Error("Desktop language helpers not found");
const desktop = runInNewContext(
	`${component.slice(start, end)}; ({ localizePath, translatePathForSlug });`,
	{ langs: ["en", "es", "pt"], defaultLang: "en" },
) as {
	localizePath: typeof localizePath;
	translatePathForSlug: typeof translatePathForSlug;
};

describe("desktop and shared language navigation agree", () => {
	for (const lang of ["en", "es", "pt"] as const) {
		for (const page of ["", "/2", "/10"]) {
			test(`translates a blog category to ${lang}, preserving page ${page || "1"}`, () => {
				const path = `/es/blog/viajar-a-peru${page}/`;
				const slug = lang === "es" ? "viajar-a-peru" : "peru";
				const expected = `${lang === "en" ? "" : `/${lang}`}/blog/${slug}${page}/`;
				for (const helpers of [
					desktop,
					{ localizePath, translatePathForSlug },
				]) {
					expect(
						helpers.localizePath(
							helpers.translatePathForSlug(path, slug),
							lang,
						),
					).toBe(expected);
				}
			});
		}
	}
	test("does not replace the page number with the unchanged Bolivia slug", () => {
		expect(
			desktop.localizePath(
				desktop.translatePathForSlug("/es/blog/bolivia/2/", "bolivia"),
				"pt",
			),
		).toBe("/pt/blog/bolivia/2/");
	});
	test("preserves blog index pagination and translates article slugs", () => {
		expect(desktop.localizePath("/es/blog/2/", "pt")).toBe("/pt/blog/2/");
		expect(
			desktop.localizePath(
				desktop.translatePathForSlug(
					"/es/blog/puerto-maldonado/",
					"peruvian-amazon-guide",
				),
				"en",
			),
		).toBe("/blog/peruvian-amazon-guide/");
	});
});
