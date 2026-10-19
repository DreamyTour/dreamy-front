import { expect, test } from "@playwright/test";
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
