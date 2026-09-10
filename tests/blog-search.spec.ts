import { expect, test } from "@playwright/test";

test("paginates search results in groups of nine and resets for a new search", async ({
	page,
}) => {
	await page.goto("/es/blog/");
	const input = page.getByRole("searchbox", { name: "Buscar en el blog" });
	await input.fill("a");
	await input.press("Enter");
	const results = page.locator("#blog-index-search-results");
	const cards = results.locator("article");
	const nav = results.getByRole("navigation", { name: "Paginación del blog" });
	await expect(cards).toHaveCount(9);
	const firstTitle = await cards.first().locator("h3").innerText();
	const firstLinks = await cards
		.locator("h3 a")
		.evaluateAll((links) => links.map((link) => link.getAttribute("href")));
	const url = page.url();
	await nav.getByRole("button", { name: "Página 2", exact: true }).click();
	await expect(nav.locator('[aria-current="page"]')).toHaveText("2");
	await expect(cards).toHaveCount(9);
	const secondLinks = await cards
		.locator("h3 a")
		.evaluateAll((links) => links.map((link) => link.getAttribute("href")));
	expect(secondLinks.some((link) => firstLinks.includes(link))).toBe(false);
	expect(page.url()).toBe(url);
	await input.fill(firstTitle);
	await input.press("Enter");
	await expect(nav).toHaveCount(0);
	await expect(cards.first().locator("h3")).toHaveText(firstTitle);
	await input.fill("zzzz-no-results-987654321");
	await input.press("Enter");
	await expect(cards).toHaveCount(0);
	await expect(nav).toHaveCount(0);
	await page.getByRole("button", { name: "Limpiar búsqueda" }).click();
	await expect(page.locator("#blog-index-default-posts")).toBeVisible();
});

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
