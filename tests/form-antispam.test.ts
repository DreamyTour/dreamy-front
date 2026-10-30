import { afterAll, beforeEach, expect, mock, test } from "bun:test";
import type { APIContext } from "astro";

// Tests use the actual endpoint and Resend wrapper. No email network call is allowed.
const counts = new Map<string, number>();
const bindings = {
	DRY_RUN: "true",
	TURNSTILE_SECRET_KEY: "test-secret",
	RESEND_API_KEY: undefined as string | undefined,
	FORM_RATE_LIMITER: {
		idFromName: (key: string) => key,
		get: (key: string) => ({
			consume: async () => {
				const count = (counts.get(key) ?? 0) + 1;
				counts.set(key, count);
				return count <= 5;
			},
		}),
	},
};
mock.module("cloudflare:workers", () => ({ env: bindings }));
const { POST: trip } = await import("../src/pages/api/planea-tu-viaje");
const { POST: complaint } =
	await import("../src/pages/api/libro-reclamaciones");
const { POST: checkout } = await import("../src/pages/api/checkout");
const { POST: machu } =
	await import("../src/pages/api/machu-picchu-prebooking");
const realFetch = globalThis.fetch;
let verification: "pass" | "fail" | "timeout" | "wrong-host" = "pass";
let mailCalls = 0;
let verificationCalls = 0;
let liveVerification = false;
let liveMail = false;
globalThis.fetch = (async (input, init) => {
	const url = String(input);
	if (url === "https://challenges.cloudflare.com/turnstile/v0/siteverify") {
		verificationCalls++;
		if (liveVerification) return realFetch(input, init);
		expect(init?.method).toBe("POST");
		if (verification === "timeout") throw new Error("timeout");
		return Response.json({
			success: verification !== "fail",
			hostname: verification === "wrong-host" ? "evil.example" : "dreamy.tours",
		});
	}
	if (url.includes("resend")) {
		mailCalls++;
		if (liveMail) return Response.json({ id: "resend-live-fixture" });
	}
	throw new Error(`Unexpected outbound request: ${url}`);
}) as typeof fetch;
afterAll(() => {
	globalThis.fetch = realFetch;
});
beforeEach(() => {
	counts.clear();
	verification = "pass";
	mailCalls = 0;
	verificationCalls = 0;
	liveMail = false;
});

const valid = () => ({
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
	formRenderedAt: Date.now() - 10_000,
	"cf-turnstile-response": "valid-fixture-token",
});
async function post(
	endpoint: typeof trip,
	path: string,
	data: unknown,
	html = false,
) {
	const request = new Request(`https://dreamy.tours/api/${path}`, {
		method: "POST",
		headers: {
			"content-type": html
				? "application/x-www-form-urlencoded"
				: "application/json",
			accept: html ? "text/html" : "application/json",
			"cf-connecting-ip": "192.0.2.10",
		},
		body: html
			? new URLSearchParams(data as Record<string, string>)
			: JSON.stringify(data),
	});
	return endpoint({ request } as APIContext) as Promise<Response>;
}
test.skipIf(process.env.RUN_LIVE_TURNSTILE !== "true")(
	"live Cloudflare test token passes both endpoints in DRY_RUN",
	async () => {
		// Official public test key, never a production secret. Test responses use example.com.
		const original = bindings.TURNSTILE_SECRET_KEY;
		bindings.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";
		liveVerification = true;
		try {
			for (const [path, endpoint] of [
				["planea-tu-viaje", trip],
				["libro-reclamaciones", complaint],
			] as const) {
				const request = new Request(`https://example.com/api/${path}`, {
					method: "POST",
					headers: {
						"content-type": "application/json",
						"cf-connecting-ip": "192.0.2.123",
					},
					body: JSON.stringify({
						...valid(),
						"cf-turnstile-response": "XXXX.DUMMY.TOKEN.XXXX",
					}),
				});
				const response = (await endpoint({
					request,
				} as APIContext)) as Response;
				expect(response.status).toBe(503);
				expect((await response.json()).simulation).toBe(true);
			}
			expect(mailCalls).toBe(0);
		} finally {
			liveVerification = false;
			bindings.TURNSTILE_SECRET_KEY = original;
		}
	},
);
for (const [path, endpoint] of [
	["planea-tu-viaje", trip],
	["libro-reclamaciones", complaint],
] as const) {
	test(`${path}: missing runtime mail secret returns 503, never simulated success`, async () => {
		const originalDryRun = bindings.DRY_RUN;
		bindings.DRY_RUN = "false";
		try {
			const response = await post(endpoint, path, valid());
			expect(response.status).toBe(503);
			expect((await response.json()).success).toBeUndefined();
			expect(mailCalls).toBe(0);
		} finally {
			bindings.DRY_RUN = originalDryRun;
		}
	});
	test(`${path}: a) exact garbage rejected, zero emails`, async () => {
		const response = await post(endpoint, path, {
			nombres: "Test",
			pais: "Select your country",
			documento: "Test",
			detalle: "Test",
			telefono: "+79990000000",
		});
		expect(response.status).toBe(403);
		expect(mailCalls).toBe(0);
	});
	test(`${path}: strict validation returns 400 even with valid Turnstile`, async () => {
		for (const change of [
			{ nombres: "Test" },
			{ nombres: "María" },
			{ nombres: "Li A" },
			{ pais: "Select your country" },
			{ pais: "Selecciona tu país" },
			{ pais: "Selecione seu país" },
			{ pais: "Atlantis" },
			{ email: "invalid" },
			{ telefono: "999999999" },
			...(path === "libro-reclamaciones"
				? [{ documento: "Test" }, { detalle: "Test" }]
				: []),
		]) {
			counts.clear();
			expect(
				(await post(endpoint, path, { ...valid(), ...change })).status,
			).toBe(400);
		}
		expect(mailCalls).toBe(0);
	});
	if (path === "libro-reclamaciones") {
		test("libro-reclamaciones: valid Turnstile exposes only a safe invalid field", async () => {
			const response = await post(endpoint, path, {
				...valid(),
				telefono: "999999999",
			});
			expect(response.status).toBe(400);
			expect(await response.json()).toEqual({
				error: "Validation failed",
				code: "VALIDATION_ERROR",
				field: "telefono",
			});
			expect(mailCalls).toBe(0);
		});
	}
	test(`${path}: b) missing token => 403, zero emails`, async () => {
		const data = valid();
		delete (data as Record<string, unknown>)["cf-turnstile-response"];
		expect((await post(endpoint, path, data)).status).toBe(403);
		expect(mailCalls).toBe(0);
	});
	test(`${path}: c) honeypot => no confirmation, zero verification/emails`, async () => {
		const response = await post(endpoint, path, { website: "spam.example" });
		expect(response.status).toBe(400);
		expect((await response.json()).code).toBe("FORM_NOT_CONFIRMED");
		expect(verificationCalls).toBe(0);
		expect(mailCalls).toBe(0);
	});
	test(`${path}: time trap => controlled retry, zero emails`, async () => {
		const response = await post(endpoint, path, {
			...valid(),
			formRenderedAt: Date.now(),
		});
		expect(response.status).toBe(409);
		expect((await response.json()).code).toBe("FORM_RETRY");
		expect(verificationCalls).toBe(0);
		expect(mailCalls).toBe(0);
	});
	test(`${path}: the same rendered timestamp passes after the controlled three-second retry`, async () => {
		const realNow = Date.now;
		const renderedAt = 1_000_000;
		try {
			Date.now = () => renderedAt + 2_999;
			expect(
				(await post(endpoint, path, { ...valid(), formRenderedAt: renderedAt }))
					.status,
			).toBe(409);
			expect(verificationCalls).toBe(0);

			Date.now = () => renderedAt + 3_000;
			const response = await post(endpoint, path, {
				...valid(),
				formRenderedAt: renderedAt,
			});
			expect(response.status).toBe(503);
			expect((await response.json()).simulation).toBe(true);
			expect(verificationCalls).toBe(1);
		} finally {
			Date.now = realNow;
		}
	});
	test(`${path}: d) DRY_RUN never claims a confirmed submission`, async () => {
		const response = await post(endpoint, path, valid());
		expect(response.status).toBe(503);
		expect((await response.json()).simulation).toBe(true);
		expect(verificationCalls).toBe(1);
		expect(mailCalls).toBe(0);
	});
	test(`${path}: confirmed live provider acceptance is the only success`, async () => {
		const originalDryRun = bindings.DRY_RUN;
		const originalApiKey = bindings.RESEND_API_KEY;
		bindings.DRY_RUN = "false";
		bindings.RESEND_API_KEY = "re_test_fixture";
		liveMail = true;
		try {
			const response = await post(endpoint, path, valid());
			expect(response.status).toBe(200);
			expect((await response.json()).success).toBe(true);
			expect(mailCalls).toBe(1);
		} finally {
			bindings.DRY_RUN = originalDryRun;
			bindings.RESEND_API_KEY = originalApiKey;
		}
	});
	test(`${path}: invalid/expired token, timeout, wrong hostname fail closed`, async () => {
		for (const mode of ["fail", "timeout", "wrong-host"] as const) {
			verification = mode;
			expect((await post(endpoint, path, valid())).status).toBe(403);
		}
		expect(mailCalls).toBe(0);
	});
	test(`${path}: sixth attempt => 429`, async () => {
		for (let i = 0; i < 5; i++)
			expect((await post(endpoint, path, valid())).status).toBe(503);
		expect((await post(endpoint, path, valid())).status).toBe(429);
		expect(mailCalls).toBe(0);
	});
}
test("native tour form does not claim success in DRY_RUN", async () => {
	const response = await post(trip, "planea-tu-viaje", valid(), true);
	expect(response.status).toBe(503);
	expect(await response.text()).toContain("No se pudo confirmar el envío");
	expect(mailCalls).toBe(0);
});
for (const [path, endpoint] of [
	["checkout", checkout],
	["machu-picchu-prebooking", machu],
] as const) {
	test(`${path}: additional email endpoints require Turnstile`, async () => {
		expect((await post(endpoint, path, {})).status).toBe(403);
		expect(
			(await post(endpoint, path, { website: "spam.example" })).status,
		).toBe(400);
		expect(mailCalls).toBe(0);
	});
}
