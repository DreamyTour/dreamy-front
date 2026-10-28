import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

test("uses a category popup and hides social links on mobile", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	const map = JSON.parse(readFileSync("dist/localized-route-map.json", "utf8"));
	const post = Object.entries(map.documents).find(
		([id, translations]) =>
			id.startsWith("post:") && (translations as { es?: { slug: string } }).es,
	);
	expect(
		post,
		"The build must contain a published Spanish article",
	).toBeTruthy();
	const slug = (post![1] as { es: { slug: string } }).es.slug;
	await page.goto(`/es/blog/${slug}/`);

	const mobileCategoryTrigger = page.locator(
		"section[aria-labelledby='blog-aside-mobile-title'] button",
	);
	await expect(mobileCategoryTrigger).toBeVisible();
	await expect(page.locator("#blog-aside-title")).toBeHidden();
	await expect(page.locator("#blog-social-title")).toBeHidden();

	await mobileCategoryTrigger.click();
	await expect(
		page.locator('[data-slot="dropdown-menu-content"][role="menu"]'),
	).toBeVisible();
	await expect(
		page
			.locator('[data-slot="dropdown-menu-content"] [role="menuitem"]')
			.first(),
	).toBeVisible();
	await page.keyboard.press("Escape");

	await page.setViewportSize({ width: 1280, height: 900 });
	await expect(page.locator("#blog-aside-title")).toBeVisible();
	await expect(page.locator("#blog-social-title")).toBeVisible();
});
