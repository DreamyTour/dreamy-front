import { describe, expect, test } from "bun:test";
import {
	collapseRepeatedBlogPath,
	localizePath,
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

	test("translates blog slugs when production URLs include trailing slash", () => {
		const translated = translatePathForSlug(
			"/es/blog/puerto-maldonado/",
			"peruvian-amazon-guide",
		);

		expect(translated).toBe("/blog/peruvian-amazon-guide/");
		expect(localizePath(translated, "en")).toBe("/blog/peruvian-amazon-guide/");
	});
});
