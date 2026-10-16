import { describe, expect, test } from "bun:test";
import { parseFragment } from "parse5";
import source from "@/i18n/purpose/es.json";
import translations from "@/i18n/purpose/translations.json";
import { purposeText } from "@/i18n/purpose";
import { purposeSlugs } from "@/data/purposeSlugs";
import { localizePurposeHtml } from "./localizePurposeHtml";
import { resolveLanguageUrls, translatePathForSlug } from "./i18n";

describe("purpose page localization", () => {
	test("every source phrase has a translation or a translated composition", () => {
		for (const [id, text] of Object.entries(source)) {
			if (id in translations) {
				const pair = translations[id as keyof typeof translations];
				expect(pair.every((value) => value.trim().length > 0)).toBe(true);
			} else {
				expect(purposeText(text, "en")).not.toBe(text);
			}
		}
	});

	test("translates markup without changing ids, styles, input values or scripts", () => {
		const html = `<section id="stable" class="card"><h2>Artesanías locales: conoce a quienes las crean</h2><a href="/es/proyecto-social/">Proyecto social</a><input name="nombres" value="Inicio"><script>const message = "Inicio";</script></section>`;
		const localized = localizePurposeHtml(html, "en");
		expect(localized).toContain("Local handicrafts: meet their creators");
		expect(localized).toContain('href="/social-project/"');
		expect(localized).toContain('id="stable" class="card"');
		expect(localized).toContain('value="Inicio"');
		expect(localized).toContain('const message = "Inicio";');
		expect(localizePurposeHtml(html, "es")).toBe(html);
	});

	test("localizes image descriptions and gallery controls, including dynamic labels", () => {
		const html = `<project-gallery data-title="Juegos y alegría en Saylla · 2025"><img alt="Navidad en Patacolca: recuerdo 2 de la campaña navideña de Dreamy Tours"><button aria-label="Mostrar foto 3 de Juegos y alegría en Saylla · 2025">Ampliar</button></project-gallery>`;
		const output = localizePurposeHtml(html, "en");
		expect(output).toContain('data-lang="en"');
		expect(output).toContain("Show photo 3 of Games and joy in Saylla · 2025");
		expect(output).toContain(
			"Christmas in Patacolca: photo 2 from the Dreamy Tours Christmas campaign",
		);
		expect(parseFragment(output).childNodes).toHaveLength(1);
	});

	test("maps tour links by the supplied localized document map", () => {
		const output = localizePurposeHtml(
			'<a href="/es/turismo-vivencial-misminay-full-day/">Conoce el tour</a>',
			"pt",
			new Map([
				["/turismo-vivencial-misminay-full-day", "/pt/experiencia-misminay/"],
			]),
		);
		expect(output).toContain('href="/pt/experiencia-misminay/"');
		expect(output).toContain("Conheça o tour");
	});

	test("keeps registered nested project pages connected in every language", () => {
		for (const slugs of Object.values(purposeSlugs)) {
			const urls = resolveLanguageUrls({
				pathname: `/es/${slugs.es}/`,
				slugMap: slugs,
			});
			expect(urls).toEqual({
				es: `/es/${slugs.es}/`,
				en: `/${slugs.en}/`,
				pt: `/pt/${slugs.pt}/`,
			});
			expect(translatePathForSlug(`/es/${slugs.es}/`, slugs.en)).toBe(
				`/${slugs.en}/`,
			);
		}
	});
});
