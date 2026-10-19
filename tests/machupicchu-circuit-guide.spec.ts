import { expect, test } from "@playwright/test";
import { parse } from "parse5";
import {
	circuitOverviewPath,
	localizedRoutePath,
	translatedRoutes,
} from "../src/data/circuitGuideTranslations";
import {
	circuitRouteGuides,
	routeGuideHref,
	routeMapImage,
} from "../src/data/machuPicchuGuide";

test("the three circuit cards link to ten complete route guides", async ({
	page,
	request,
}) => {
	test.setTimeout(120_000);
	await page.goto("/es/circuitos-machupicchu/");
	await expect(page.getByRole("heading", { level: 1 })).toHaveText(
		"Circuitos de Machu Picchu",
	);
	await expect(page.locator(".circuit-card")).toHaveCount(3);
	await expect(page.locator(".route-link")).toHaveCount(10);
	await expect(
		page.locator(".route-link").filter({ hasText: "De temporada" }),
	).toHaveCount(4);
	for (const route of circuitRouteGuides) {
		await expect(
			page.locator(`.route-link[href="${routeGuideHref(route)}"]`),
		).toHaveCount(1);
		const response = await request.get(routeGuideHref(route));
		expect(response.status()).toBe(200);
		const html = await response.text();
		const canonical = html.match(
			/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/,
		)?.[1];
		const selfLanguage = html.match(
			/<link[^>]*hreflang="es-PE"[^>]*href="([^"]+)"/,
		)?.[1];
		expect(canonical).toBe(`https://dreamy.tours${routeGuideHref(route)}`);
		expect(selfLanguage).toBe(canonical);
		expect(html).toContain(`Ruta ${route.code}: ${route.name}`);
		expect(html).toContain(routeMapImage(route));
		expect(html).toContain(route.maxStay);
		expect((await request.get(routeMapImage(route))).status()).toBe(200);
	}
});

test("general and individual maps open, close with Escape and restore focus", async ({
	page,
}) => {
	await page.goto("/es/circuitos-machupicchu/");
	const trigger = page.locator("#circuito1 [data-map-open]");
	await trigger.click();
	await expect(page.locator("#general-1-dialog")).toBeVisible();
	await page.keyboard.press("Escape");
	await expect(page.locator("#general-1-dialog")).not.toBeVisible();
	await expect(trigger).toBeFocused();
	await page
		.locator('.route-link[href="/es/circuitos-machupicchu/ruta-1-a/"]')
		.click();
	await expect(page.getByRole("heading", { level: 1 })).toHaveText(
		"Ruta 1-A: Montaña Machupicchu",
	);
	const routeMap = page.locator("[data-map-open]");
	await routeMap.focus();
	await page.keyboard.press("Enter");
	await expect(page.locator("#map-ruta-1-a-dialog")).toBeVisible();
	await page.getByRole("button", { name: "Cerrar mapa" }).click();
	await expect(routeMap).toBeFocused();
	await page
		.getByRole("link", {
			name: "Volver a todos los circuitos y mapas generales",
		})
		.click();
	await expect(page.locator(".circuit-card")).toHaveCount(3);
	// Map controls must also work after returning from a route guide.
	await page.locator("#circuito2 [data-map-open]").click();
	await expect(page.locator("#general-2-dialog")).toBeVisible();
});

test("cards and route maps fit a narrow mobile viewport", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	for (const path of [
		"/es/circuitos-machupicchu/",
		"/es/circuitos-machupicchu/ruta-3-c/",
	]) {
		await page.goto(path);
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= window.innerWidth,
			),
		).toBe(true);
		await page.locator("[data-map-open]").first().click();
		await expect(page.locator("dialog[open]")).toBeVisible();
		expect(
			await page
				.locator("dialog[open]")
				.evaluate(
					(el) => el.getBoundingClientRect().width <= window.innerWidth,
				),
		).toBe(true);
		await page.getByRole("button", { name: "Cerrar mapa" }).click();
	}
});

test("all 33 circuit pages publish localized content and reciprocal language links", async ({
	request,
}) => {
	test.setTimeout(120_000);
	const uniqueTitles = new Set<string>();
	for (const lang of ["es", "en", "pt"] as const) {
		for (const route of [undefined, ...circuitRouteGuides]) {
			const path = route
				? localizedRoutePath(route.slug, lang)
				: circuitOverviewPath[lang];
			const response = await request.get(path);
			expect(response.status(), path).toBe(200);
			const html = await response.text();
			const doc = parse(html);
			const found: {
				title?: string;
				canonical?: string;
				language?: string;
				description?: string;
				h1: number;
				alternates: Record<string, string>;
				schemas: Record<string, any>[];
				links: string[];
			} = { h1: 0, alternates: {}, schemas: [], links: [] };
			function visit(node: any, content = false) {
				const attrs = Object.fromEntries(
					(node.attrs ?? []).map((a: any) => [a.name, a.value]),
				);
				const text = (node.childNodes ?? [])
					.map((n: any) => n.value ?? "")
					.join("");
				content =
					content ||
					(attrs.class ?? "")
						.split(/\s+/)
						.some((c: string) => ["circuit-guide", "route-guide"].includes(c));
				if (node.tagName === "html") found.language = attrs.lang;
				if (node.tagName === "h1") found.h1++;
				if (node.tagName === "title") found.title = text;
				if (node.tagName === "meta" && attrs.name === "description")
					found.description = attrs.content;
				if (node.tagName === "link" && attrs.rel === "canonical")
					found.canonical = attrs.href;
				if (node.tagName === "link" && attrs.hreflang)
					found.alternates[attrs.hreflang] = attrs.href;
				if (node.tagName === "script" && attrs.type === "application/ld+json")
					found.schemas.push(JSON.parse(text));
				if (content && node.tagName === "a") found.links.push(attrs.href);
				(node.childNodes ?? []).forEach((n: any) => visit(n, content));
			}
			visit(doc);
			expect(found.language).toBe(lang);
			expect(found.h1).toBe(1);
			expect(found.canonical).toBe("https://dreamy.tours" + path);
			expect(found.description?.length).toBeGreaterThan(100);
			expect(uniqueTitles.has(found.title!)).toBe(false);
			uniqueTitles.add(found.title!);
			for (const [locale, hreflang] of [
				["es", "es-PE"],
				["en", "en"],
				["pt", "pt-BR"],
			] as const)
				expect(found.alternates[hreflang]).toBe(
					"https://dreamy.tours" +
						(route
							? localizedRoutePath(route.slug, locale)
							: circuitOverviewPath[locale]),
				);
			if (lang !== "es")
				expect(found.links.some((href) => href.startsWith("/es/"))).toBe(false);
			if (route) {
				expect(
					found.schemas.find((s) => s["@type"] === "BreadcrumbList")
						?.itemListElement,
				).toHaveLength(3);
				if (lang !== "es") {
					const index = circuitRouteGuides.indexOf(route);
					expect(html).toContain(translatedRoutes[lang][index].paragraphs[0]);
					expect(html).toContain(translatedRoutes[lang][index].maxStay);
				}
			} else {
				const list = found.schemas.find((s) => s["@type"] === "ItemList");
				expect(list?.itemListElement).toHaveLength(10);
				expect(list?.itemListElement.map((item: any) => item.url)).toEqual(
					circuitRouteGuides.map(
						(item) =>
							"https://dreamy.tours" + localizedRoutePath(item.slug, lang),
					),
				);
			}
		}
	}
	expect(uniqueTitles.size).toBe(33);
});

for (const lang of ["en", "pt"] as const) {
	test(`${lang} guides retain maps, navigation and mobile layout`, async ({
		page,
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto(circuitOverviewPath[lang]);
		await expect(page.locator(".circuit-card")).toHaveCount(3);
		await expect(page.locator(".route-link")).toHaveCount(10);
		await page.locator("#circuito1 [data-map-open]").click();
		await expect(page.locator("#general-1-dialog")).toBeVisible();
		await page
			.getByRole("button", {
				name: lang === "en" ? "Close map" : "Fechar mapa",
			})
			.click();
		await page.locator(".route-link").first().click();
		await expect(page).toHaveURL(
			new RegExp(localizedRoutePath("ruta-1-a", lang)),
		);
		await expect(page.getByRole("heading", { level: 1 })).toHaveText(
			lang === "en"
				? "Route 1-A: Machupicchu Mountain"
				: "Rota 1-A: Montanha Machupicchu",
		);
		await page.locator("[data-map-open]").click();
		await expect(page.locator("dialog[open]")).toBeVisible();
		await page.keyboard.press("Escape");
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= innerWidth,
			),
		).toBe(true);
		await page
			.getByRole("link", {
				name:
					lang === "en"
						? "Back to all circuits and overview maps"
						: "Voltar a todos os circuitos e mapas gerais",
			})
			.click();
		await expect(page.locator(".circuit-card")).toHaveCount(3);
	});
}
