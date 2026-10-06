import { describe, expect, spyOn, test } from "bun:test";
import { LANGS, resolveLanguageUrls } from "./i18n";

const slugs = {
	en: "dead-womans-pass-inca-trail",
	es: "warmiwanusca-camino-inca",
	pt: "warmiwanusca-trilha-inca",
};
const expected = {
	en: "/blog/dead-womans-pass-inca-trail/",
	es: "/es/blog/warmiwanusca-camino-inca/",
	pt: "/pt/blog/warmiwanusca-trilha-inca/",
};

describe("server language URLs", () => {
	for (const from of LANGS) {
		for (const to of LANGS.filter((lang) => lang !== from)) {
			test(`${from} -> ${to} uses the destination document slug`, () => {
				expect(
					resolveLanguageUrls({ pathname: expected[from], slugMap: slugs })[to],
				).toBe(expected[to]);
			});
		}
	}
	test("two translations never invent Portuguese", () => {
		expect(
			resolveLanguageUrls({
				pathname: expected.es,
				slugMap: { es: slugs.es, en: slugs.en },
			}),
		).toEqual({ en: expected.en, es: expected.es });
	});
	test("one translation and absent maps never infer from the current path", () => {
		expect(
			resolveLanguageUrls({ pathname: expected.es, slugMap: { es: slugs.es } }),
		).toEqual({ es: expected.es });
		expect(resolveLanguageUrls({ pathname: expected.es })).toEqual({});
		expect(resolveLanguageUrls({ pathname: expected.es, slugMap: {} })).toEqual(
			{},
		);
	});
	test("categories keep only existing target page numbers", () => {
		expect(
			resolveLanguageUrls({
				pathname: "/es/blog/camino-inca/3/",
				slugMap: { es: "camino-inca", en: "inca-trail", pt: "trilha-inca" },
				pageCounts: { es: 4, en: 3, pt: 2 },
			}),
		).toEqual({ en: "/blog/inca-trail/3/", es: "/es/blog/camino-inca/3/" });
	});
	test("first category page uses its own locale slug", () => {
		expect(
			resolveLanguageUrls({
				pathname: "/es/blog/camino-inca/",
				slugMap: { en: "inca-trail", es: "camino-inca" },
				pageCounts: { en: 1, es: 2 },
			}),
		).toEqual({ en: "/blog/inca-trail/", es: "/es/blog/camino-inca/" });
	});
	test("index pagination omits nonexistent locales", () => {
		expect(
			resolveLanguageUrls({
				pathname: "/es/blog/3/",
				pageCounts: { es: 4, en: 3, pt: 2 },
			}),
		).toEqual({ en: "/blog/3/", es: "/es/blog/3/" });
		expect(resolveLanguageUrls({ pathname: "/blog/3/" })).toEqual({});
	});
	test("tours and commercial pages use document maps", () => {
		expect(
			resolveLanguageUrls({
				pathname: "/es/viaje/",
				slugMap: { es: "viaje", en: "trip" },
			}),
		).toEqual({ en: "/trip/", es: "/es/viaje/" });
	});
	test("static pages use explicit known routes only", () => {
		expect(resolveLanguageUrls({ pathname: "/es/" })).toEqual({
			en: "/",
			es: "/es/",
			pt: "/pt/",
		});
		expect(resolveLanguageUrls({ pathname: "/es/not-registered/" })).toEqual(
			{},
		);
	});
	test("invalid slugs are reported and omitted", () => {
		const warning = spyOn(console, "warn").mockImplementation(() => {});
		try {
			expect(
				resolveLanguageUrls({
					pathname: expected.es,
					slugMap: { es: slugs.es, en: " ", pt: "bad/slug" },
				}),
			).toEqual({ es: expected.es });
			expect(warning).toHaveBeenCalledTimes(2);
		} finally {
			warning.mockRestore();
		}
	});
});
