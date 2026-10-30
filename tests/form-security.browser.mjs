import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

// Mount the actual React components in an isolated Vite browser fixture.
// This replaces the widget script and ALL mail POSTs; no mail can be sent.
const server = await createServer({
  configFile: false,
  appType: "custom",
  define: {
    "import.meta.env.PUBLIC_TURNSTILE_SITE_KEY": JSON.stringify(
      "1x00000000000000000000AA",
    ),
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) },
  },
  server: { host: "127.0.0.1", port: 4331, strictPort: true },
});
server.middlewares.use(async (request, response, next) => {
  if (!request.url?.endsWith("/")) return next();
	const machuPicchu = request.url.startsWith("/machu-prebooking/");
  const complaint = /reclam|complaints/.test(request.url);
  const lang = request.url.startsWith("/es/")
    ? "es"
    : request.url.startsWith("/pt/")
      ? "pt"
      : "en";
  response.setHeader("Content-Type", "text/html");
  response.end(
    await server.transformIndexHtml(
      request.url,
		`<!doctype html><div id="root"></div><script type="module">import React from 'react'; import {createRoot} from 'react-dom/client'; import Form from '/src/components/${machuPicchu ? "checkout/MachuPicchuPrebooking" : `content/${complaint ? "LibroReclamaciones" : "PlaneaTuViaje"}`}.tsx'; createRoot(document.getElementById('root')).render(React.createElement(Form${machuPicchu ? "" : `,{lang:'${lang}'}`}));</script>`,
    ),
  );
});
await server.listen();
const browser = await chromium.launch({ headless: true });
try {
  for (const path of process.env.MACHU_ONLY === "true" ? [] : [
    "/es/planea-tu-viaje/",
    "/plan-your-trip/",
    "/pt/planeje-sua-viagem/",
    "/es/libro-reclamaciones/",
    "/complaints-book/",
    "/pt/livro-de-reclamacoes/",
  ]) {
    const page = await browser.newPage();
    page.on("pageerror", (error) =>
      console.error(`Browser fixture: ${error.message}`),
    );
    await page.route(
      "https://challenges.cloudflare.com/turnstile/v0/api.js**",
      (route) =>
        route.fulfill({
          contentType: "application/javascript",
          body: `window.turnstile = {render(node, options) { window.__turnstileOptions = options; const input = document.createElement('input'); input.type='hidden'; input.name='cf-turnstile-response'; input.value='browser-test-token'; node.append(input); return 'widget'; }, reset() { document.querySelectorAll('[name="cf-turnstile-response"]').forEach(input => input.value='browser-test-token'); }, remove() {} };`,
        }),
    );
    let sent;
    let apiResponse = { status: 200, json: { success: true } };
    await page.route("**/api/form-challenge**", (route) =>
      route.fulfill({ json: { challenge: "browser-challenge", expiresAt: Date.now() + 1_800_000 } }),
    );
    await page.route("**/api/**", (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      sent = route.request().postDataJSON();
      return route.fulfill(apiResponse);
    });
    await page.goto(`http://127.0.0.1:4331${path}`);
    const form = page.locator('form[action^="/api/"]').first();
    await form.scrollIntoViewIfNeeded();
    await form
      .locator('[name="cf-turnstile-response"]')
      .waitFor({ state: "attached" });
		await form.locator('[name="formChallenge"]').waitFor({ state: "attached" });
		await page.waitForFunction(
			() =>
				Boolean(
					document.querySelector('[name="formChallenge"]')?.value,
				),
		);
    assert.equal(
      await page.evaluate(() => window.__turnstileOptions.appearance),
      "interaction-only",
    );
    assert.equal(
      await form.locator('[name="website"]').getAttribute("tabindex"),
      "-1",
    );
    assert.equal(await form.locator('[name="website"]').isVisible(), false);
    assert(
      await form.locator('[name="formChallenge"]').inputValue(),
      "browser-challenge",
    );
    if (await form.locator('[name="detalle"]').count()) {
      await form.evaluate((element) =>
        element.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
      );
      await form.locator("#lr-nombres-error").waitFor({ state: "visible" });
      await form.locator("#lr-telefono-error").waitFor({ state: "visible" });
      assert.equal(
        await form.locator('[name="nombres"]').getAttribute("aria-invalid"),
        "true",
      );
      await page.waitForFunction(
        () => document.activeElement?.id === "lr-nombres",
      );
      assert.equal(sent, undefined);
    }
    await form.locator('[name="nombres"]').fill("María García");
    await form
      .locator('[name="pais"]')
      .selectOption(path === "/complaints-book/" ? "Peru" : "Perú");
    if (await form.locator('[name="codigoPais"]').count()) {
      assert.equal(
        await form.locator('[name="codigoPais"]').inputValue(),
        "51",
      );
    }
    await form.locator('[name="email"]').fill("maria@example.com");
    await form
      .locator('[name="telefono"]')
      .fill(
        path.includes("reclam") || path.includes("complaints")
          ? "987 654 321"
          : "987 654 321",
      );
    if (await form.locator('[name="detalle"]').count()) {
      await form.locator('[name="ciudad"]').fill("Lima");
      await form.locator('[name="documento"]').fill("AB123456");
      await form
        .locator('[name="detalle"]')
        .fill("Solicito revisar la atención recibida durante mi visita.");
    } else {
      assert.equal(
        await form.locator('[name="mensaje"]').getAttribute("required"),
        null,
      );
    }
    // Dispatching submit exercises React's handler without relying on unrelated date controls.
    const submitted = page.waitForResponse(
      (response) =>
        response.url().includes("/api/") &&
        response.request().method() === "POST",
    );
    await form.evaluate((element) =>
      element.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      ),
    );
    await submitted;
    assert.equal(sent["cf-turnstile-response"], "browser-test-token");
    assert.equal(sent.website, "");
    assert.equal(sent.telefono, "+51987654321");
    assert.equal(sent.formChallenge, "browser-challenge");
    const dialog = page.locator("dialog[open]");
    await dialog.waitFor({ state: "visible" });
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });

    // A controlled retry must not clear the fields or make a success claim.
    apiResponse = {
      status: 409,
      json: { code: "FORM_RETRY", error: "Please wait a few seconds." },
    };
    if (await form.locator('[name="detalle"]').count()) {
      await form
        .locator('[name="pais"]')
        .selectOption(path === "/complaints-book/" ? "Peru" : "Perú");
      await form.locator('[name="ciudad"]').fill("Lima");
      await form.locator('[name="documento"]').fill("AB123456");
      await form.locator('[name="email"]').fill("maria@example.com");
      await form.locator('[name="telefono"]').fill("987 654 321");
      await form
        .locator('[name="detalle"]')
        .fill("Solicito revisar la atención recibida durante mi visita.");
    }
    await form.locator('[name="nombres"]').fill("Ana Torres");
    const retrySubmitted = page.waitForResponse(
      (response) =>
        response.url().includes("/api/") &&
        response.request().method() === "POST",
    );
    await form.evaluate((element) =>
      element.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      ),
    );
    await retrySubmitted;
    await dialog.waitFor({ state: "visible" });
    assert.equal(
      await form.locator('[name="nombres"]').inputValue(),
      "Ana Torres",
    );
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    console.log(
      `PASS browser: ${path} — widget, traps, token, phone and JSON submission`,
    );
    await page.close();
  }

  // The Machu Picchu form has a multi-step UI. Its HMAC challenge must be
  // requested for the API endpoint, not for the page that hosts the island.
  const machuPage = await browser.newPage();
  await machuPage.addInitScript(() =>
    sessionStorage.setItem(
      "machuPicchuSelection",
      JSON.stringify({ date: "2027-06-10", route: "2A", time: "09:00" }),
    ),
  );
  await machuPage.route(
    "https://challenges.cloudflare.com/turnstile/v0/api.js**",
    (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: `window.turnstile = {render(node) { const input = document.createElement('input'); input.type = 'hidden'; input.name = 'cf-turnstile-response'; input.value = 'browser-test-token'; node.append(input); return 'widget'; }, reset() {}, remove() {}};`,
      }),
  );
  const machuChallengePaths = [];
  const machuAttempts = [];
  await machuPage.route("**/api/form-challenge**", (route) => {
    machuChallengePaths.push(new URL(route.request().url()).searchParams.get("path"));
    return route.fulfill({ json: { challenge: "machu-browser-challenge" } });
  });
  await machuPage.route("**/api/machu-picchu-prebooking", (route) => {
    machuAttempts.push(route.request().postDataJSON());
    return route.fulfill(
      machuAttempts.length === 1
        ? { status: 409, json: { code: "FORM_RETRY" } }
        : { status: 200, json: { status: "pending_review", reference: "MP-TEST" } },
    );
  });
  await machuPage.goto("http://127.0.0.1:4331/machu-prebooking/");
  await machuPage.getByRole("button", { name: "Continuar a viajeros" }).click();
  const machuForm = machuPage.locator('form[action="/api/machu-picchu-prebooking"]');
  await machuForm.locator('[name="formChallenge"]').waitFor({ state: "attached" });
  await machuPage.waitForFunction(
    () => document.querySelector('[name="formChallenge"]')?.value === "machu-browser-challenge",
  );
  await machuForm.locator('input[autocomplete="section-traveler1 given-name"]').fill("Ana");
  await machuForm.locator('input[autocomplete="section-traveler1 family-name"]').fill("Torres");
  await machuForm.locator('input[autocomplete="section-traveler1 bday"]').fill("1990-05-12");
  await machuForm.locator("fieldset select").first().selectOption("PE");
	const countryCallingCode = machuForm.locator(
		'input[aria-label="Código de país"]',
	);
	assert.equal(await countryCallingCode.isDisabled(), true);
	assert.equal(await countryCallingCode.inputValue(), "+51");
  await machuForm.locator("fieldset input").nth(3).fill("P123456");
  await machuForm.locator('input[autocomplete="email"]').fill("maria@example.com");
	await machuForm.locator('input[autocomplete="tel"]').fill("999 888 777");
  await machuForm.getByRole("button", { name: "Continuar a pre-reserva" }).click();
  await machuForm.locator('input[type="checkbox"]').check();
  await machuForm.getByRole("button", { name: "Enviar pre-reserva" }).click();
  await machuPage.waitForFunction(() => document.querySelector('[role="alert"]'));
  assert.deepEqual(machuChallengePaths, ["/api/machu-picchu-prebooking"]);
  assert.equal(machuAttempts.length, 1);
  assert.equal(machuAttempts[0].formChallenge, "machu-browser-challenge");
  assert.equal(machuAttempts[0]["cf-turnstile-response"], "browser-test-token");
  assert.equal(machuAttempts[0].preference, "advice");
	assert.equal(machuAttempts[0].contact.phone, "+51999888777");
  await machuForm.getByRole("button", { name: "Enviar pre-reserva" }).click();
  await machuPage.getByText("Referencia: MP-TEST").waitFor({ state: "visible" });
  assert.equal(machuAttempts.length, 2);
  assert.equal(machuAttempts[1].formChallenge, "machu-browser-challenge");
  console.log("PASS browser: Machu Picchu uses its API challenge and keeps data on retry");
  await machuPage.close();

  // Reproduce the production sequence with a controlled browser clock. A
  // FORM_RETRY renews Turnstile only; the Worker-issued challenge is preserved.
  const page = await browser.newPage();
  await page.clock.install({ time: new Date("2026-01-01T12:00:00.000Z") });
  await page.route(
    "https://challenges.cloudflare.com/turnstile/v0/api.js**",
    (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: `window.turnstile = {render(node) { const input = document.createElement('input'); input.type='hidden'; input.name='cf-turnstile-response'; input.value='browser-test-token'; node.append(input); return 'widget'; }, reset() {}, remove() {}};`,
      }),
  );
  const attempts = [];
  await page.route("**/api/libro-reclamaciones", (route) => {
    attempts.push(route.request().postDataJSON());
    return route.fulfill(
      attempts.length === 1
        ? { status: 409, json: { code: "FORM_RETRY" } }
        : { status: 200, json: { success: true, id: "accepted-fixture" } },
    );
  });
  await page.route("**/api/form-challenge**", (route) =>
    route.fulfill({ json: { challenge: "retry-challenge", expiresAt: Date.now() + 1_800_000 } }),
  );
  await page.goto("http://127.0.0.1:4331/es/libro-reclamaciones/");
  const form = page.locator('form[action="/api/libro-reclamaciones"]');
  await form
    .locator('[name="cf-turnstile-response"]')
    .waitFor({ state: "attached" });
	await page.waitForFunction(
		() =>
			Boolean(
				document.querySelector('[name="formChallenge"]')?.value,
			),
	);
  const challenge = await form.locator('[name="formChallenge"]').inputValue();
  await form.locator('[name="nombres"]').fill("Maria Garcia");
  await form.locator('[name="pais"]').selectOption({ index: 1 });
  await form.locator('[name="ciudad"]').fill("Lima");
  await form.locator('[name="documento"]').fill("AB123456");
  await form.locator('[name="email"]').fill("maria@example.com");
  await form.locator('[name="telefono"]').fill("+51987654321");
  await form
    .locator('[name="detalle"]')
    .fill("Please review the service received during my visit.");
  await page.clock.fastForward(1);
  await form.evaluate((element) =>
    element.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    ),
  );
  await page.waitForFunction(() => document.querySelector("dialog[open]"));
  assert.equal(
    await form.locator('[name="formChallenge"]').inputValue(),
    challenge,
  );
  await page.keyboard.press("Escape");
  await page.clock.fastForward(3_000);
  await form.evaluate((element) =>
    element.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    ),
  );
  await page.waitForFunction(() => document.querySelector("dialog[open]"));
  assert.equal(attempts.length, 2);
  assert.equal(String(attempts[0].formChallenge), challenge);
  assert.equal(String(attempts[1].formChallenge), challenge);
  console.log("PASS browser: retry keeps its Worker-issued challenge");
  await page.close();
} finally {
  await browser.close();
  await server.close();
}
