import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "@playwright/test";

// A fake Strapi verifies the complete browser cookie/CORS/iframe flow without
// using a real admin credential or writing any CMS content.
const frontend = "http://127.0.0.1:4326";
const cms = createServer((request, response) => {
	const reply = (body: unknown, status = 200, html = false) => {
		response.writeHead(status, {
			"Content-Type": html ? "text/html; charset=utf-8" : "application/json",
		});
		response.end(html ? String(body) : JSON.stringify(body));
	};
	if (request.url?.startsWith("/api/")) {
		return reply({
			data: [],
			meta: { pagination: { pageCount: 1 } },
		});
	}
	if (request.url === "/admin/users/me") {
		return request.headers.authorization === "Bearer fixture-admin"
			? reply({ data: { id: 1, isActive: true } })
			: reply({ error: "unauthorized" }, 401);
	}
	return reply(
		`<!doctype html><title>CMS fixture</title><script>
		let frame;
		window.addEventListener('message',event=>{
		 if(event.origin==='${frontend}'&&event.source===frame?.contentWindow&&event.data?.type==='dreamy-route-ready')
		  frame.contentWindow.postMessage({type:'dreamy-route-init',value:{version:1,start:{label:'Origen de prueba',coordinates:[-71.978,-13.518]},legs:[]}},'${frontend}');
		});
		fetch('${frontend}/api/cms/session', {method:'POST',credentials:'include',headers:{Authorization:'Bearer fixture-admin','Content-Type':'application/json'}})
		.then(response=>{if(!response.ok)throw Error(response.status);frame=document.createElement('iframe');frame.src='${frontend}/cms/map-editor/';document.body.append(frame);})
		.catch(()=>document.body.textContent='Authorization failed');
		</script>`,
		200,
		true,
	);
});
await new Promise<void>((resolve) => cms.listen(0, "127.0.0.1", resolve));
const address = cms.address();
assert(address && typeof address !== "string");
const origin = `http://127.0.0.1:${address.port}`;
const server = spawn(
	"node",
	[
		"--input-type=module",
		"-e",
		"import { dev } from 'astro'; await dev({ server: { host: '127.0.0.1', port: 4326 }, cacheDir: './node_modules/.astro-cms-test', vite: { cacheDir: './node_modules/.vite-cms-test', server: { strictPort: true } }, logLevel: 'error' });",
	],
	{
		env: { ...process.env, VITE_STRAPI_URL: origin },
		stdio: "inherit",
	},
);
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
	let ready = false;
	for (let i = 0; i < 120; i++) {
		assert(
			server.exitCode == null,
			`Astro exited before starting (${server.exitCode})`,
		);
		try {
			const response = await fetch(`${frontend}/cms/map-editor/`, {
				signal: AbortSignal.timeout(1500),
			});
			if (response.status === 500)
				throw new Error(`Astro startup failed: ${await response.text()}`);
			ready = response.status === 401;
			if (ready) break;
		} catch (error) {
			if (
				error instanceof Error &&
				error.message.startsWith("Astro startup failed:")
			)
				throw error;
			/* server starting */
		}
		await delay(500);
	}
	assert(ready, "Astro did not start with the CMS access guard");
	console.log("CMS fixture: server ready");
	assert.equal(
		(await fetch(`${frontend}/api/tour-places?q=Cusco`)).status,
		401,
	);
	assert.equal((await fetch(`${frontend}/api/tour-route`)).status, 400);
	assert.equal(
		(
			await fetch(`${frontend}/api/cms/session`, {
				method: "POST",
				headers: {
					Origin: "https://attacker.example",
					Authorization: "Bearer fixture-admin",
					"Content-Type": "application/json",
				},
			})
		).status,
		403,
	);
	assert.equal(
		(
			await fetch(`${frontend}/api/cms/session`, {
				method: "POST",
				headers: {
					Origin: origin,
					Authorization: "Bearer invalid",
					"Content-Type": "application/json",
				},
			})
		).status,
		401,
	);
	const preflight = await fetch(`${frontend}/api/cms/session`, {
		method: "OPTIONS",
		headers: {
			Origin: origin,
			"Access-Control-Request-Method": "POST",
			"Access-Control-Request-Headers": "authorization, content-type",
		},
	});
	assert.equal(preflight.status, 204);
	assert.equal(preflight.headers.get("Access-Control-Allow-Origin"), origin);
	assert.equal(
		preflight.headers.get("Access-Control-Allow-Credentials"),
		"true",
	);
	browser = await chromium.launch({ timeout: 15000 });
	console.log("CMS fixture: anonymous access and CORS checks passed");
	const context = await browser.newContext();
	const page = await context.newPage();
	await page.route("**/*", (route) => {
		const url = new URL(route.request().url());
		if (url.hostname === "127.0.0.1") return route.continue();
		if (url.pathname.endsWith("style.json"))
			return route.fulfill({ json: { version: 8, sources: {}, layers: [] } });
		return route.abort();
	});
	await page.goto(origin);
	await page
		.frameLocator("iframe")
		.getByRole("heading", { name: "¿Qué conocerán este día?" })
		.waitFor({ timeout: 30000 });
	console.log("CMS fixture: authenticated iframe loaded");
	await page
		.frameLocator("iframe")
		.getByRole("button", { name: /Origen de prueba/ })
		.first()
		.waitFor();
	const cookies = await context.cookies(frontend);
	const cookie = cookies.find((cookie) => cookie.name === "dreamy-cms-session");
	assert(cookie?.httpOnly);
	assert.equal(cookie.sameSite, "Lax");
	const editor = await context.request.get(`${frontend}/cms/map-editor/`);
	assert.equal(editor.status(), 200);
	assert.equal(editor.headers()["cache-control"], "no-store");
	assert(editor.headers()["content-security-policy"].includes(origin));
	assert.equal(editor.headers()["x-frame-options"], undefined);
	assert.equal(
		(await context.request.get(`${frontend}/api/tour-places?q=x`)).status(),
		400,
	);
	assert.equal(
		(
			await context.request.delete(`${frontend}/api/cms/session`, {
				headers: { Origin: origin, "Content-Type": "application/json" },
			})
		).status(),
		204,
	);
	assert.equal(
		(await context.request.get(`${frontend}/cms/map-editor/`)).status(),
		401,
	);
	console.log(
		"CMS integration passed: anonymous access denied, invalid token denied, authenticated iframe loaded, HttpOnly session, private search, public routing, revocation.",
	);
} finally {
	await browser?.close();
	server.kill();
	cms.closeAllConnections();
	await new Promise<void>((resolve) => cms.close(() => resolve()));
}
