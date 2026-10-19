import { describe, expect, test } from "bun:test";
import {
	circuitRouteSlugMap,
	localizedRoutePath,
	translatedRoutes,
} from "@/data/circuitGuideTranslations";
import { circuitRouteGuides } from "@/data/machuPicchuGuide";
import {
	localizePath,
	resolveLanguageUrls,
	translatePathForSlug,
} from "./i18n";
import { circuitText, localizeCircuitGuideHtml } from "./localizeCircuitGuide";

describe("circuit guide languages", () => {
	test("all route descriptions and lists are translated in both languages", () => {
		for (const lang of ["en", "pt"] as const)
			for (const [index, route] of circuitRouteGuides.entries()) {
				const copy = translatedRoutes[lang][index];
				for (const key of ["paragraphs", "includes", "excludes"] as const) {
					expect(copy[key]).toHaveLength(route[key].length);
					route[key].forEach((text, i) => {
						expect(circuitText(text, lang)).toBe(copy[key][i]);
					});
				}
				expect(circuitText(route.advice, lang)).toBe(copy.advice);
			}
	});
	test("language switches and hreflang preserve the exact route", () => {
		for (const route of circuitRouteGuides)
			for (const lang of ["es", "en", "pt"] as const) {
				const pathname = localizedRoutePath(route.slug, lang);
				const slugs = circuitRouteSlugMap(route.slug);
				expect(resolveLanguageUrls({ pathname, slugMap: slugs })).toEqual(
					Object.fromEntries(
						["es", "en", "pt"].map((locale) => [
							locale,
							localizedRoutePath(route.slug, locale as "es" | "en" | "pt"),
						]),
					),
				);
				for (const target of ["es", "en", "pt"] as const)
					expect(
						localizePath(translatePathForSlug(pathname, slugs[target]), target),
					).toBe(localizedRoutePath(route.slug, target));
			}
	});
	test("localizes dialog names, map controls and links without changing assets", () => {
		const html =
			'<circuit-map><a href="/es/circuitos-machupicchu/ruta-1-a/" aria-label="Ampliar mapa general del circuito 1: panorámico">Abrir imagen a tamaño completo</a><img src="/imagenes/circuitos/ruta-1-a.webp" alt="Mapa de la ruta 1-A: Montaña Machupicchu"><p>Otras rutas del circuito 1</p></circuit-map>';
		const en = localizeCircuitGuideHtml(html, "en");
		expect(en).toContain("/machupicchu-circuits/route-1-a/");
		expect(en).toContain("Enlarge Overview map of circuit 1: Panoramic");
		expect(en).toContain("Other routes in circuit 1");
		expect(en).toContain("/imagenes/circuitos/ruta-1-a.webp");
		expect(en).toContain("Map of route 1-A: Machupicchu Mountain");
	});
});
