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
		const challenge = async () => {
			const response = await request.get(
				`/api/form-challenge?path=${encodeURIComponent(`/api/${endpoint}`)}`,
			);
			expect(response.status()).toBe(200);
			expect(response.headers()["cache-control"]).toContain("no-store");
			return (await response.json()).challenge as string;
		};
		const post = (data: unknown, attempt: number) =>
			request.post(`/api/${endpoint}`, {
				data,
				headers: { "cf-connecting-ip": `192.0.${index + 10}.${attempt}` },
			});
		expect((await post({}, 1)).status()).toBe(403);
		expect((await post({ website: "bot.example" }, 2)).status()).toBe(400);
		expect(
			(
				await post(
					{
						"cf-turnstile-response": "e2e-fixture-young",
						formChallenge: await challenge(),
					},
					3,
				)
			).status(),
		).toBe(409);
		if (endpoint === "planea-tu-viaje" || endpoint === "libro-reclamaciones") {
			const formChallenge = await challenge();
			await new Promise((resolve) => setTimeout(resolve, 3_000));
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
					formChallenge,
					"cf-turnstile-response": "e2e-fixture-valid",
				},
				4,
			);
			expect(response.status()).toBe(503);
			expect((await response.json()).simulation).toBe(true);
		}
	});
}
