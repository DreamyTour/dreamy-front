import { expect, test } from "@playwright/test";

test("searches blog cards without changing the URL", async ({ page }) => {
	await page.goto("/es/blog/");

	const searchInput = page.getByRole("searchbox", {
		name: "Buscar en el blog",
	});
	await expect(searchInput).toBeVisible();

	await page.getByRole("button", { name: "Buscar" }).click();
	await expect(page.getByText("Escribe algo para buscar.")).toBeVisible();

	const title = await page
		.locator("#blog-index-default-posts article h2 a")
		.first()
		.textContent();
	expect(title).toBeTruthy();

	const urlBeforeSearch = page.url();
	await searchInput.fill(title || "Machu Picchu");
	await searchInput.press("Enter");

	await expect(
		page.getByRole("heading", { name: /Resultados para/ }),
	).toBeVisible();
	expect(page.url()).toBe(urlBeforeSearch);
	await expect(
		page.locator("#blog-index-search-results article"),
	).not.toHaveCount(0);
	await expect(page.locator("#blog-index-default-posts")).toHaveJSProperty(
		"hidden",
		true,
	);

	const postHref = await page
		.locator("#blog-index-search-results article a")
		.first()
		.getAttribute("href");
	const categoryHref = await page
		.locator('nav[aria-label="Categorías del blog"] a')
		.nth(1)
		.getAttribute("href");

	await page.getByRole("button", { name: "Limpiar búsqueda" }).click();
	await expect(page.locator("#blog-index-default-posts")).toHaveJSProperty(
		"hidden",
		false,
	);

	expect(categoryHref).toBeTruthy();
	await page.goto(categoryHref || "/es/blog/");
	await expect(
		page.getByRole("searchbox", { name: "Buscar en el blog" }),
	).toBeVisible();

	expect(postHref).toBeTruthy();
	await page.goto(postHref || "/es/blog/");
	await expect(
		page.getByRole("searchbox", { name: "Buscar en el blog" }),
	).toBeVisible();
});
