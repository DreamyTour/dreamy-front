import { expect, test } from "bun:test";
import {
	type ContentKind,
	canonicalRoute,
	createRouteMap,
	type PublishedRoute,
	resolveLocalizedRoute,
} from "./localizedRouteResolver";

const locales = ["en", "es", "pt"] as const;
const slugs = {
	en: "dead-womans-pass-inca-trail",
	es: "warmiwanusca-camino-inca",
	pt: "warmiwanusca-trilha-inca",
};
function records(kind: ContentKind = "post"): PublishedRoute[] {
	return locales.map((locale) => ({
		kind,
		documentId: "abc",
		locale,
		slug: slugs[locale],
		pages: 3,
	}));
}
for (const kind of ["post", "category", "tour", "page"] as const) {
	const map = createRouteMap(records(kind));
	for (const locale of locales) {
		test(`${kind}: canonical ${locale} does not resolve`, () => {
			expect(
				resolveLocalizedRoute(canonicalRoute(kind, locale, slugs[locale]), map),
			).toBeNull();
		});
		for (const from of locales.filter((value) => value !== locale)) {
			test(`${kind}: ${from} slug under ${locale}, slash and no slash, single jump`, () => {
				const destination = canonicalRoute(kind, locale, slugs[locale]);
				const source = canonicalRoute(kind, locale, slugs[from]);
				for (const path of [source, source.slice(0, -1)]) {
					expect(resolveLocalizedRoute(path, map)).toEqual({
						status: 301,
						pathname: destination,
					});
				}
				expect(resolveLocalizedRoute(destination, map)).toBeNull();
			});
		}
	}
}
test("missing translation falls back to the real slug locale with 302", () => {
	const map = createRouteMap(
		records().filter((record) => record.locale === "es"),
	);
	expect(resolveLocalizedRoute(`/pt/blog/${slugs.es}/`, map)).toEqual({
		status: 302,
		pathname: `/es/blog/${slugs.es}/`,
	});
});
test("unknown slugs and non-content paths do not resolve", () => {
	const map = createRouteMap(records());
	for (const path of [
		"/blog/slug-totalmente-inexistente/",
		"/api/tours/",
		"/blog/999/",
		"/_astro/code.js",
		"/pt/",
		"/blog/test/0/",
		"/blog/test/03/",
		"/en/blog/test/",
	])
		expect(resolveLocalizedRoute(path, map)).toBeNull();
});
test("ambiguous documentId or shared URL namespaces never guess", () => {
	const map = createRouteMap([
		{ kind: "post", documentId: "one", locale: "es", slug: "same" },
		{ kind: "category", documentId: "two", locale: "pt", slug: "same" },
	]);
	expect(resolveLocalizedRoute("/blog/same/", map)).toEqual({
		ambiguous: true,
	});
	expect(resolveLocalizedRoute("/es/blog/same/", map)).toBeNull();
	expect(() =>
		createRouteMap([
			{ kind: "tour", documentId: "one", locale: "en", slug: "same" },
			{ kind: "page", documentId: "two", locale: "en", slug: "same" },
		]),
	).toThrow("Canonical collision");
});
test("category pagination preserves N, insufficient destination stays 404", () => {
	const map = createRouteMap(
		records("category").map((record) => ({
			...record,
			pages: record.locale === "pt" ? 2 : 3,
		})),
	);
	expect(resolveLocalizedRoute(`/blog/${slugs.es}/3/`, map)).toEqual({
		status: 301,
		pathname: `/blog/${slugs.en}/3/`,
	});
	expect(resolveLocalizedRoute(`/pt/blog/${slugs.es}/3/`, map)).toBeNull();
	expect(resolveLocalizedRoute(`/blog/${slugs.es}/4/`, map)).toBeNull();
});
test("pagination on a missing translation also requires the real page N", () => {
	const map = createRouteMap(
		records("category").filter((record) => record.locale === "es"),
	);
	expect(resolveLocalizedRoute(`/pt/blog/${slugs.es}/3/`, map)).toEqual({
		status: 302,
		pathname: `/es/blog/${slugs.es}/3/`,
	});
	expect(resolveLocalizedRoute(`/pt/blog/${slugs.es}/4/`, map)).toBeNull();
});
test("duplicate metadata is deduplicated; conflicting metadata fails", () => {
	const data = records();
	expect(
		Object.values(createRouteMap([...data, ...data]).slugIndex).flat().length,
	).toBe(3);
	expect(() =>
		createRouteMap([...data, { ...data[0], slug: "another" }]),
	).toThrow("Conflicting document locale");
});

test("encoded exact slugs resolve without accepting encoded path separators", () => {
	const map = createRouteMap([
		{ kind: "post", documentId: "unicode", locale: "es", slug: "montaña" },
		{ kind: "post", documentId: "unicode", locale: "en", slug: "mountain" },
	]);
	expect(resolveLocalizedRoute("/blog/monta%C3%B1a/", map)).toEqual({
		status: 301,
		pathname: "/blog/mountain/",
	});
	expect(resolveLocalizedRoute("/blog/monta%2F%C3%B1a/", map)).toBeNull();
	expect(resolveLocalizedRoute("/blog/%invalid/", map)).toBeNull();
});

test("a page suffix never converts a post into a category", () => {
	const map = createRouteMap(records());
	expect(resolveLocalizedRoute(`/blog/${slugs.es}/1/`, map)).toBeNull();
	expect(() =>
		createRouteMap([
			{ kind: "category", documentId: "reserved", locale: "en", slug: "2" },
		]),
	).toThrow("Reserved or unsupported");
});
