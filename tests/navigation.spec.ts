import { expect, test } from "@playwright/test";

// Exercise normal navigation and the reduced-motion fallback in Chromium.
// Native cross-document animation is also checked against the production build.
test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });

test.beforeEach(async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
});

test("category labels open submenus on hover and arrows support the keyboard", async ({
	page,
}) => {
	await page.goto("/");
	const category = page.locator(".desktop-category-link").first();
	await expect(category).toHaveAttribute("href", /\/.+/);
	await category.hover();
	const panel = page
		.locator('[data-slot="navigation-menu-content"]:visible')
		.first();
	await expect(panel).toBeVisible();
	await panel.locator("a").first().hover();
	await expect(panel).toBeVisible();
	await page.keyboard.press("Escape");
	await expect(
		page.locator('[data-slot="navigation-menu-content"]:visible'),
	).toHaveCount(0);
	await page.mouse.move(1400, 750);
	const toggle = page.locator(".desktop-category-toggle").first();
	await toggle.focus();
	await toggle.press("Enter");
	await expect(toggle).toHaveAttribute("aria-expanded", "true");
	await toggle.press("Escape");
	await expect(toggle).toHaveAttribute("aria-expanded", "false");
});

test("navigation updates metadata, supports Back and excludes checkout", async ({
	page,
}) => {
	await page.goto("/");
	const homeTitle = await page.title();
	await page.locator('footer a[href="/privacy-policy/"]').click();
	await expect(page).toHaveURL(/\/privacy-policy\/?$/);
	await expect(page).toHaveTitle(/Privacy Policy/);
	await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
		"href",
		"https://dreamy.tours/privacy-policy/",
	);
	await expect(page.locator("main")).toHaveCSS("view-transition-name", "none");
	await page.goBack();
	await expect(page).toHaveTitle(homeTitle);
	await page.goto("/es/politicas-privacidad/");
	await expect(page.locator("html")).toHaveAttribute("lang", "es");
	await expect(page).toHaveTitle(/Políticas de Privacidad/);
	await page.goto("/es/checkout/");
	await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
		"content",
		/noindex/,
	);
	expect(
		await page
			.locator("style")
			.evaluateAll((styles) =>
				styles.some((style) => style.textContent?.includes("@view-transition")),
			),
	).toBe(false);
	await expect(
		page.locator('meta[name="astro-view-transitions-enabled"]'),
	).toHaveCount(0);
});
