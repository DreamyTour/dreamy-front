import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { LANGS, resolveLanguageUrls } from "../src/lib/i18n";

const root = resolve("dist/client");
const paths = {
	en: "/blog/dead-womans-pass-inca-trail/",
	es: "/es/blog/warmiwanusca-camino-inca/",
	pt: "/pt/blog/warmiwanusca-trilha-inca/",
};
function htmlFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		return entry.isDirectory()
			? htmlFiles(path)
			: entry.name === "index.html"
				? [path]
				: [];
	});
}
function attribute(tag: string, name: string) {
	return tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
}
function languageLinks(html: string) {
	return (html.match(/<a\b[^>]*>/g) || [])
		.filter((tag) => /data-language(?:-option)?=/.test(tag))
		.map((tag) => ({
			locale:
				attribute(tag, "data-language") ||
				attribute(tag, "data-language-option"),
			href: attribute(tag, "href"),
		}));
}

test("all production language links target generated pages and use document slugs", () => {
	let count = 0;
	const cardinalities = new Set<number>();
	for (const file of htmlFiles(root)) {
		const html = readFileSync(file, "utf8");
		const links = languageLinks(html);
		const mapText = html.match(
			/<script[^>]*id="blog-slug-map"[^>]*>(.*?)<\/script>/s,
		)?.[1];
		const map = mapText ? JSON.parse(mapText) : undefined;
		if (map) cardinalities.add(Object.keys(map).length);
		for (const link of links) {
			expect(link.href, `${file}: ${link.locale}`).toBeTruthy();
			expect(
				existsSync(join(root, link.href ?? "missing-href", "index.html")),
				`${file} -> ${link.href}`,
			).toBe(true);
			if (map) {
				const path = `/${file
					.slice(root.length + 1)
					.replaceAll("\\", "/")
					.replace(/index\.html$/, "")}`;
				// Existence was independently checked; pageCounts only permits this page.
				const expected = resolveLanguageUrls({
					pathname: path,
					slugMap: map,
					pageCounts: { en: 999, es: 999, pt: 999 },
				});
				expect(link.href).toBe(expected[link.locale as keyof typeof expected]);
			}
			count++;
		}
	}
	expect(count).toBeGreaterThan(100);
	console.log(
		`Audited ${count} production language hrefs; blog map sizes: ${[...cardinalities].join(", ")}`,
	);
});

for (const from of LANGS) {
	test(`initial HTML without JavaScript: ${from} exposes correct desktop and mobile destinations`, async ({
		browser,
	}) => {
		const context = await browser.newContext({ javaScriptEnabled: false });
		const page = await context.newPage();
		await page.goto(`http://127.0.0.1:4323${paths[from]}`);
		for (const to of LANGS) {
			await expect(
				page.locator(`[data-mobile-menu-root] a[data-language="${to}"]`),
			).toHaveAttribute("href", paths[to]);
			await expect(
				page.locator(
					`[data-desktop-language-switcher] a[data-language-option="${to}"]`,
				),
			).toHaveAttribute("href", paths[to]);
		}
		for (const to of LANGS.filter((lang) => lang !== from)) {
			const slug = paths[from].split("/").filter(Boolean).at(-1);
			const wrong = `${to === "en" ? "" : `/${to}`}/blog/${slug}/`;
			expect(await page.locator(`a[href="${wrong}"]`).count()).toBe(0);
		}
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
			"href",
			`https://dreamy.tours${paths[from]}`,
		);
		await expect(page.locator('link[hreflang="en"]')).toHaveAttribute(
			"href",
			`https://dreamy.tours${paths.en}`,
		);
		await expect(page.locator('link[hreflang="es-PE"]')).toHaveAttribute(
			"href",
			`https://dreamy.tours${paths.es}`,
		);
		await expect(page.locator('link[hreflang="pt-BR"]')).toHaveAttribute(
			"href",
			`https://dreamy.tours${paths.pt}`,
		);
		await context.close();
	});
	for (const to of LANGS.filter((lang) => lang !== from)) {
		for (const mode of ["desktop", "mobile"] as const) {
			test(`${mode} click ${from} -> ${to}`, async ({ page }) => {
				await page.setViewportSize({
					width: mode === "desktop" ? 1440 : 390,
					height: 900,
				});
				await page.route("**/*", (route) =>
					new URL(route.request().url()).hostname === "127.0.0.1"
						? route.continue()
						: route.abort(),
				);
				await page.goto(paths[from]);
				if (mode === "desktop") {
					await page
						.locator("[data-desktop-language-switcher] [data-language-toggle]")
						.click();
					await page
						.locator(
							`[data-desktop-language-switcher] a[data-language-option="${to}"]`,
						)
						.click();
				} else {
					await page
						.locator("[data-mobile-menu-root] [data-language-switcher] summary")
						.click();
					await page
						.locator(`[data-mobile-menu-root] a[data-language="${to}"]`)
						.click();
				}
				await expect(page).toHaveURL(new RegExp(`${paths[to]}$`));
				await expect(page.locator("html")).toHaveAttribute("lang", to);
				await expect(page.locator("h1")).not.toHaveText(/404/);
			});
		}
	}
}
