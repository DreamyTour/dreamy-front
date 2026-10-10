import { expect, test } from "@playwright/test";

for (const { path, slug } of [
	{ path: "/es/disponibilidad-camino-inca", slug: "camino-inca-corto-2-dias" },
	{ path: "/inca-trail-availability", slug: "short-inca-trail-2-days" },
	{ path: "/pt/disponibilidade-trilha-inca", slug: "trilha-inca-2-dias" },
]) {
	test(`booking URLs are noindex while the general calendar remains indexable: ${path}`, async ({
		page,
	}) => {
		const general = await page.goto(path);
		expect(general?.headers()["x-robots-tag"]).toBeUndefined();
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
			"content",
			"index, follow",
		);
		const canonical = await page
			.locator('link[rel="canonical"]')
			.getAttribute("href");
		expect(canonical).toBeTruthy();
		const response = await page.goto(
			`${path}?tour=${slug}#availability-calendar`,
		);
		expect(response?.headers()["x-robots-tag"]).toBe("noindex, follow");
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
			"content",
			"noindex, follow",
		);
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
			"href",
			canonical ?? "",
		);
		expect(new URL(canonical ?? "").search).toBe("");
		expect(new URL(canonical ?? "").hash).toBe("");
		await page.goto(`${path}?tour=unknown-tour`);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
			"content",
			"noindex, follow",
		);
		await page.goto(path);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
			"content",
			"index, follow",
		);
	});
}

test("guide explains pre-booking before related tours and questions work with a keyboard", async ({
	page,
}) => {
	await page.goto("/es/disponibilidad-camino-inca");
	const guide = page.locator("#booking-guide");
	await expect(guide.locator(".steps > li")).toHaveCount(3);
	await expect(guide.locator("details")).toHaveCount(6);
	await expect(
		guide.getByText("Sin cobro al enviar la solicitud", { exact: true }),
	).toBeVisible();
	const details = guide.locator("details").last();
	await details.locator("summary").focus();
	await page.keyboard.press("Enter");
	await expect(details).toHaveAttribute("open", "");
	await expect(details.locator(".answer")).toBeVisible();
	await page.keyboard.press("Enter");
	await expect(details.locator(".answer")).not.toBeVisible();
	const tours = page.getByRole("heading", {
		name: "Tours de Camino Inca",
		exact: true,
	});
	expect(
		await tours.evaluate((element) =>
			Boolean(
				(document
					.querySelector("#booking-guide")
					?.compareDocumentPosition(element) ?? 0) &
					Node.DOCUMENT_POSITION_FOLLOWING,
			),
		),
	).toBe(true);
});
