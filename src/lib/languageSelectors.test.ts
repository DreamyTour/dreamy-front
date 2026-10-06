import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { transform } from "@astrojs/compiler-rs";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { resolveLanguageUrls } from "./i18n";

const dir = mkdtempSync(join(import.meta.dir, ".language-render-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

for (const name of ["LanguageSwitcherInline", "layout/MobileMenu"]) {
	const source = readFileSync(
		new URL(`../components/${name}.astro`, import.meta.url),
		"utf8",
	);
	const result = transform(source, {
		filename: `${name}.astro`,
		internalURL: "astro/compiler-runtime",
		resultScopedSlot: true,
		resolvePath: (specifier: string) => specifier,
	});
	const path = join(dir, `${name.replace("/", "-")}.ts`);
	writeFileSync(path, result.code);
	const component = (await import(path)).default;
	for (const slugs of [
		{
			es: "warmiwanusca-camino-inca",
			en: "dead-womans-pass-inca-trail",
			pt: "warmiwanusca-trilha-inca",
		},
		{ es: "warmiwanusca-camino-inca", en: "dead-womans-pass-inca-trail" },
		{ es: "warmiwanusca-camino-inca" },
	]) {
		test(`${name}: initial HTML exposes exactly ${Object.keys(slugs).length} translations`, async () => {
			const urls = resolveLanguageUrls({
				pathname: "/es/blog/warmiwanusca-camino-inca/",
				slugMap: slugs,
			});
			const container = await AstroContainer.create();
			const html = await container.renderToString(component, {
				props: {
					currentLang: "es",
					lang: "es",
					languageUrls: urls,
					menu: { menuItems: [] },
					logoUrl: "/es/",
				},
			});
			const links = (html.match(/<a\b[^>]*>/g) || []).filter((tag) =>
				/data-language(?:-option)?=/.test(tag),
			);
			expect(links).toHaveLength(Object.keys(slugs).length);
			for (const [locale, href] of Object.entries(urls)) {
				expect(
					links.some(
						(tag) =>
							tag.includes(`href="${href}"`) &&
							(tag.includes(`data-language="${locale}"`) ||
								tag.includes(`data-language-option="${locale}"`)),
					),
				).toBe(true);
			}
			expect(html).not.toContain('href="/blog/warmiwanusca-camino-inca/"');
			expect(html).not.toContain('href="/pt/blog/warmiwanusca-camino-inca/"');
		});
	}
	for (const fixture of [
		{
			pathname: "/es/blog/camino-inca/3/",
			slugMap: { en: "inca-trail", es: "camino-inca", pt: "trilha-inca" },
			pageCounts: { en: 3, es: 4, pt: 2 },
			expected: ["/blog/inca-trail/3/", "/es/blog/camino-inca/3/"],
		},
		{
			pathname: "/es/blog/3/",
			pageCounts: { en: 3, es: 4, pt: 2 },
			expected: ["/blog/3/", "/es/blog/3/"],
		},
	]) {
		test(`${name}: paginated HTML omits destinations without that page (${fixture.pathname})`, async () => {
			const languageUrls = resolveLanguageUrls(fixture);
			const container = await AstroContainer.create();
			const html = await container.renderToString(component, {
				props: {
					currentLang: "es",
					lang: "es",
					languageUrls,
					menu: { menuItems: [] },
					logoUrl: "/es/",
				},
			});
			const links = (html.match(/<a\b[^>]*>/g) || []).filter((tag) =>
				/data-language(?:-option)?=/.test(tag),
			);
			expect(links).toHaveLength(2);
			for (const href of fixture.expected)
				expect(links.some((tag) => tag.includes(`href="${href}"`))).toBe(true);
			expect(
				links.some((tag) => /data-language(?:-option)?="pt"/.test(tag)),
			).toBe(false);
		});
	}
}
