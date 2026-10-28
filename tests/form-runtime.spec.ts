import { expect, test } from "@playwright/test";

// The E2E server supplies isolated runtime bindings and a mocked Siteverify.
// It blocks external Worker fetches except the published CMS, including mail.
for (const [index, endpoint] of [
	"planea-tu-viaje",
	"libro-reclamaciones",
	"checkout",
	"machu-picchu-prebooking",
].entries()) {
	test(`compiled runtime security contract: ${endpoint}`, async ({
		request,
	}) => {
		const post = (data: unknown, attempt: number) =>
			request.post(`/api/${endpoint}`, {
				data,
				headers: { "cf-connecting-ip": `192.0.${index + 10}.${attempt}` },
			});
		expect((await post({}, 1)).status()).toBe(403);
		expect((await post({ website: "bot.example" }, 2)).status()).toBe(200);
		expect(
			(
				await post(
					{
						"cf-turnstile-response": "e2e-fixture-young",
						formRenderedAt: Date.now(),
					},
					3,
				)
			).status(),
		).toBe(200);
		if (endpoint === "planea-tu-viaje" || endpoint === "libro-reclamaciones") {
			const response = await post(
				{
					nombres: "María García",
					pais: "Perú",
					email: "maria@example.com",
					telefono: "+51987654321",
					ciudad: "Lima",
					documento: "AB123456",
					tipo: "reclamo",
					detalle: "Solicito revisar la atención recibida durante mi visita.",
					mensaje: "",
					website: "",
					formRenderedAt: Date.now() - 10000,
					"cf-turnstile-response": "e2e-fixture-valid",
				},
				4,
			);
			expect(response.status()).toBe(200);
			expect((await response.json()).id).toBe("dry-run");
		}
	});
}
