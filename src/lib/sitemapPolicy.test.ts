import { expect, test } from "bun:test";
import { isExcludedFromSitemap } from "./sitemapPolicy";

test("blog index pagination stays out of the sitemap as the CMS grows", () => {
	for (const locale of ["", "/es", "/pt"]) {
		for (const page of [2, 8, 9, 10, 100]) {
			expect(isExcludedFromSitemap(`${locale}/blog/${page}/`)).toBe(true);
		}
	}
});

test("published posts, blog roots and category pagination remain eligible", () => {
	for (const path of [
		"/blog/",
		"/es/blog/",
		"/pt/blog/",
		"/blog/lima/2/",
		"/es/blog/lima/2/",
		"/pt/blog/lima/2/",
		"/blog/caral-from-lima/",
		"/es/blog/lugares-turisticos-de-arequipa/",
	]) {
		expect(isExcludedFromSitemap(path)).toBe(false);
	}
	expect(isExcludedFromSitemap("/es/checkout/")).toBe(true);
});
