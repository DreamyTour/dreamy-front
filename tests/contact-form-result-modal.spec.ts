import { expect, test } from "@playwright/test";

test("contact form keeps data on retry and only clears it after confirmation", async ({
	page,
}) => {
	let response: { status: number; json: Record<string, unknown> } = {
		status: 409,
		json: { code: "FORM_RETRY", error: "Please wait a few seconds." },
	};
	await page.route("**/api/planea-tu-viaje", (route) =>
		route.fulfill(response),
	);
	await page.goto("/es/city-tour-cusco/");

	const form = page.locator("[data-contact-tour-form]");
	await expect(form).toBeVisible();
	await form.locator('[name="nombres"]').fill("Ana Torres");
	await form.locator('[name="email"]').fill("ana@example.com");
	await form.locator('[name="pais"]').selectOption({ index: 1 });
	await form
		.locator('[name="mensaje"]')
		.fill("Quisiera conocer disponibilidad.");
	await form.getByRole("button", { name: "Enviar solicitud" }).click();

	const retryDialog = page.getByRole("dialog", {
		name: "Espera unos segundos",
	});
	await expect(retryDialog).toBeVisible();
	expect(await form.locator('[name="nombres"]').inputValue()).toBe(
		"Ana Torres",
	);
	await page.keyboard.press("Escape");
	await expect(retryDialog).not.toBeVisible();

	response = { status: 200, json: { success: true, id: "accepted-fixture" } };
	await form.getByRole("button", { name: "Enviar solicitud" }).click();
	const successDialog = page.getByRole("dialog", { name: "Consulta enviada" });
	await expect(successDialog).toBeVisible();
	expect(await form.locator('[name="nombres"]').inputValue()).toBe("");
	await page.keyboard.press("Escape");
	expect(
		await form.getByRole("button", { name: "Enviar solicitud" }).isEnabled(),
	).toBe(true);
});
