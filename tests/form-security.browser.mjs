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
      `<!doctype html><div id="root"></div><script type="module">import React from 'react'; import {createRoot} from 'react-dom/client'; import Form from '/src/components/content/${complaint ? "LibroReclamaciones" : "PlaneaTuViaje"}.tsx'; createRoot(document.getElementById('root')).render(React.createElement(Form,{lang:'${lang}'}));</script>`,
    ),
  );
});
await server.listen();
const browser = await chromium.launch({ headless: true });
try {
  for (const path of [
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
          body: `window.turnstile = {render(node, options) { const input = document.createElement('input'); input.type='hidden'; input.name='cf-turnstile-response'; input.value='browser-test-token'; node.append(input); return 'widget'; }, reset() { document.querySelectorAll('[name="cf-turnstile-response"]').forEach(input => input.value='browser-test-token'); }, remove() {} };`,
        }),
    );
    let sent;
    await page.route("**/api/**", (route) => {
      if (route.request().method() !== "POST") return route.continue();
      sent = route.request().postDataJSON();
      return route.fulfill({ json: { success: true } });
    });
    await page.goto(`http://127.0.0.1:4331${path}`);
    const form = page.locator('form[action^="/api/"]').first();
    await form.scrollIntoViewIfNeeded();
    await form
      .locator('[name="cf-turnstile-response"]')
      .waitFor({ state: "attached" });
    assert.equal(
      await form.locator('[name="website"]').getAttribute("tabindex"),
      "-1",
    );
    assert.equal(await form.locator('[name="website"]').isVisible(), false);
    assert(
      Number(await form.locator('[name="formRenderedAt"]').inputValue()) > 0,
    );
    await form.locator('[name="nombres"]').fill("María García");
    await form
      .locator('[name="pais"]')
      .selectOption(path === "/complaints-book/" ? "Peru" : "Perú");
    await form.locator('[name="email"]').fill("maria@example.com");
    await form
      .locator('[name="telefono"]')
      .fill(
        path.includes("reclam") || path.includes("complaints")
          ? "+51 987 654 321"
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
    assert(Number(sent.formRenderedAt) > 0);
    console.log(
      `PASS browser: ${path} — widget, traps, token, phone and JSON submission`,
    );
    await page.close();
  }
} finally {
  await browser.close();
  await server.close();
}
