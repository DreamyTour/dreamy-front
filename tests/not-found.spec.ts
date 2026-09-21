import { expect, test } from "@playwright/test";

const cases = [
	{
		path: "/es/blog/ruta-clasica-del-camino-inca/",
		lang: "es",
		title: "Esta ruta no está en el mapa.",
		home: "/es/",
		blog: "/es/blog/",
	},
	{
		path: "/blog/salkantay-mountain/",
		lang: "en",
		title: "This route is off the map.",
		home: "/",
		blog: "/blog/",
	},
	{
		path: "/blog/sacred-valley-of-the-incas/",
		lang: "en",
		title: "This route is off the map.",
		home: "/",
		blog: "/blog/",
	},
	{
		path: "/pt/blog/artigo-inexistente/",
		lang: "pt",
		title: "Esta rota não está no mapa.",
		home: "/pt/",
		blog: "/pt/blog/",
	},
	{
		path: "/wp-content/uploads/2019/01/imagen-antigua.jpg",
		lang: "en",
		title: "This route is off the map.",
		home: "/",
		blog: "/blog/",
	},
];

for (const notFound of cases) {
	test(`serves a lightweight ${notFound.lang} 404 for ${notFound.path}`, async ({
		page,
	}) => {
		const requests: string[] = [];
		page.on("request", (request) => requests.push(request.url()));

		const response = await page.goto(notFound.path);

		expect(response?.status()).toBe(404);
		await expect(page.locator("html")).toHaveAttribute("lang", notFound.lang);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
			"content",
			"noindex",
		);
		await expect(page.locator("h1")).toHaveText(notFound.title);
		await expect(page.locator(`a[href="${notFound.home}"]`)).toBeVisible();
		await expect(page.locator(`a[href="${notFound.blog}"]`)).toBeVisible();

		await expect(page.locator("header, footer, nav")).toHaveCount(0);
		await expect(page.locator('[data-slot="navigation-menu"]')).toHaveCount(0);
		await expect(page.locator("script[src]")).toHaveCount(0);
		expect(requests.some((url) => /strapi|localhost:1337/i.test(url))).toBe(
			false,
		);
		expect(requests.some((url) => /react(?:-dom)?(?:\.|\/)/i.test(url))).toBe(
			false,
		);
	});
}
