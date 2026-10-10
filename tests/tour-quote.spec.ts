import { expect, test } from "@playwright/test";

for (const { path, heading, submit } of [
	{
		path: "/es/camino-inca-4-dias",
		heading: "Solicita una cotización",
		submit: "Continuar por WhatsApp",
	},
	{
		path: "/inca-trail-4-days",
		heading: "Request a quote",
		submit: "Continue on WhatsApp",
	},
	{
		path: "/pt/trilha-inca-4-dias",
		heading: "Solicite uma cotação",
		submit: "Continuar pelo WhatsApp",
	},
]) {
	test(`quotation validates fields and prepares WhatsApp inquiry: ${path}`, async ({
		page,
	}) => {
		await page.addInitScript(() => {
			window.open = (url) => {
				(window as Window & { quoteUrl?: string }).quoteUrl = String(url);
				return null;
			};
		});
		await page.goto(path);
		const trigger = page.locator("[data-open-tour-quote]");
		await trigger.click();
		const dialog = page.getByRole("dialog", { name: heading });
		await expect(dialog).toBeVisible();
		await dialog.getByRole("button", { name: submit }).click();
		await expect
			.poll(() =>
				page.evaluate(
					() => (window as Window & { quoteUrl?: string }).quoteUrl,
				),
			)
			.toBeUndefined();
		await dialog.locator('[name="name"]').fill("Ana Torres");
		await dialog.locator('[name="phone"]').fill("+51 999 888 777");
		await dialog.locator('[name="email"]').fill("ana@example.com");
		await dialog.locator('[name="date"]').fill("2000-01-01");
		await dialog.getByRole("button", { name: submit }).click();
		expect(
			await dialog
				.locator('[name="date"]')
				.evaluate((el: HTMLInputElement) => el.validity.rangeUnderflow),
		).toBe(true);
		expect(
			await page.evaluate(
				() => (window as Window & { quoteUrl?: string }).quoteUrl,
			),
		).toBeUndefined();
		const future = new Date();
		future.setDate(future.getDate() + 30);
		const date = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}`;
		await dialog.locator('[name="date"]').fill(date);
		await dialog.locator('[name="travelers"]').fill("3");
		await dialog
			.locator('[name="notes"]')
			.fill("Vegetariano & habitación privada");
		await dialog.getByRole("button", { name: submit }).click();
		const quoteUrl = await page.evaluate(
			() => (window as Window & { quoteUrl?: string }).quoteUrl,
		);
		if (!quoteUrl) throw new Error("WhatsApp inquiry was not prepared");
		const url = new URL(quoteUrl);
		expect(url.origin + url.pathname).toBe("https://wa.me/51969787221");
		const message = url.searchParams.get("text") ?? "";
		expect(message).toContain(await dialog.locator(".tour-title").innerText());
		expect(message).toContain("Ana Torres");
		expect(message).toContain("ana@example.com");
		expect(message).toContain("+51 999 888 777");
		expect(message).toContain(date.split("-").reverse().join("/"));
		expect(message).toContain(": 3");
		expect(message).toContain("Vegetariano & habitación privada");
		await page.keyboard.press("Escape");
		await expect(dialog).not.toBeVisible();
		await expect(trigger).toBeFocused();
		await trigger.click();
		await dialog.locator("[data-close-tour-quote]").click();
		await expect(dialog).not.toBeVisible();
	});
}

test("quotation fits a mobile viewport", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/es/camino-inca-4-dias");
	await page.locator("[data-open-tour-quote]").click();
	const dialog = page.getByRole("dialog");
	await expect(dialog).toBeVisible();
	const bounds = await dialog.boundingBox();
	if (!bounds) throw new Error("Quotation dialog is not visible");
	expect(bounds.x).toBeGreaterThanOrEqual(0);
	expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
	expect(bounds.height).toBeLessThanOrEqual(844);
	await dialog
		.getByRole("button", { name: "Continuar por WhatsApp" })
		.scrollIntoViewIfNeeded();
	await expect(
		dialog.getByRole("button", { name: "Continuar por WhatsApp" }),
	).toBeInViewport();
});
