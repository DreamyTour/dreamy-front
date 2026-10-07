import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Miniflare } from "miniflare";

const server = resolve("dist/server");
const config = JSON.parse(await readFile(join(server, "wrangler.json"), "utf8"));
assert.equal(config.assets.run_worker_first, undefined, "assets-first must remain enabled");
assert.equal(config.assets.not_found_handling, undefined);
const files = (await readdir(server, { recursive: true })).filter((path) => /\.(mjs|js)$/.test(path) && !path.startsWith(".prerender"));
const map = JSON.parse(await readFile("dist/localized-route-map.json", "utf8"));
const modules = ["entry.mjs", ...files.filter((path) => path !== "entry.mjs")].map((path) => ({ type: "ESModule", path: join(server, path) }));
const mf = new Miniflare({
	modules, modulesRootPath: server, compatibilityDate: config.compatibility_date,
	assets: { directory: resolve("dist/client"), binding: "ASSETS", routerConfig: { has_user_worker: true } },
	kvNamespaces: ["SESSION"],
});
let requests = 0;
const origin = "https://dreamy.tours";
async function request(path, method = "GET") {
	requests++;
	const response = await mf.dispatchFetch(`${origin}${path}`, { method, redirect: "manual" });
	return new Response(await response.arrayBuffer(), response);
}
function pathFor(kind, locale, slug, page = 1) {
	return `${locale === "en" ? "" : `/${locale}`}${["post", "category"].includes(kind) ? "/blog" : ""}/${slug}/${page > 1 ? `${page}/` : ""}`;
}
async function redirect(source, destination, status = 301) {
	const response = await request(source);
	assert.equal(response.status, status, source);
	assert.equal(response.headers.get("location"), `${origin}${destination}`, source);
	const final = await request(destination);
	assert.equal(final.status, 200, `final destination: ${destination}`);
	assert.equal(final.headers.get("location"), null, "must take exactly one jump");
}
try {
	// All map destinations must return 200 directly, including every category page.
	for (const [id, translations] of Object.entries(map.documents)) {
		const kind = id.split(":")[0];
		for (const [locale, entry] of Object.entries(translations)) {
			for (let page = 1; page <= entry.pages; page++) {
				const path = pathFor(kind, locale, entry.slug, page);
				const response = await request(path);
				assert.equal(response.status, 200, path);
				assert.equal(response.headers.get("location"), null, path);
			}
		}
	}
	const real = { en: "dead-womans-pass-inca-trail", es: "warmiwanusca-camino-inca", pt: "warmiwanusca-trilha-inca" };
	for (const [locale, slug] of Object.entries(real)) {
		assert.equal((await request(pathFor("post", locale, slug))).status, 200);
		for (const [sourceLocale, sourceSlug] of Object.entries(real)) {
			if (locale === sourceLocale) continue;
			const source = pathFor("post", locale, sourceSlug);
			await redirect(source, pathFor("post", locale, slug));
			await redirect(source.slice(0, -1), pathFor("post", locale, slug));
		}
	}
	const query = "?utm_source=a%2Fb&utm_medium=cpc&utm_campaign=summer&gclid=123&fbclid=456&x=1&x=2&empty=";
	await redirect(`/blog/${real.es}/${query}`, `/blog/${real.en}/${query}`);
	const head = await request(`/pt/blog/${real.en}/`, "HEAD");
	assert.equal(head.status, 301);
	assert.equal(await head.text(), "");
	for (const path of ["/blog/slug-totalmente-inexistente/", "/blog/slug-totalmente-inexistente", "/blog/999/", "/es/blog/no-existe/99/"]) assert.equal((await request(path)).status, 404, path);
	for (const kind of ["category", "tour", "page"]) {
		const entry = Object.entries(map.documents).find(([id, translations]) => id.startsWith(`${kind}:`) && translations.en && translations.es && translations.en.slug !== translations.es.slug);
		assert.ok(entry, `real ${kind} fixture must exist`);
		await redirect(pathFor(kind, "en", entry[1].es.slug), pathFor(kind, "en", entry[1].en.slug));
		await redirect(pathFor(kind, "es", entry[1].en.slug), pathFor(kind, "es", entry[1].es.slug));
	}
	const paginated = Object.entries(map.documents).find(([id, translations]) => id.startsWith("category:") && translations.en?.pages >= 2 && translations.es?.pages >= 2 && translations.en.slug !== translations.es.slug);
	assert.ok(paginated, "real paginated category must exist");
	await redirect(pathFor("category", "en", paginated[1].es.slug, 2), pathFor("category", "en", paginated[1].en.slug, 2));
	assert.equal((await request(pathFor("category", "en", paginated[1].es.slug, paginated[1].en.pages + 1))).status, 404);
	// Existing static content outside Strapi remains directly available.
	assert.equal((await request("/")).status, 200);
	const historical = (await readFile("public/_redirects", "utf8")).split(/\r?\n/).find((line) => line && !line.startsWith("#"));
	const [old, target, status] = historical.trim().split(/\s+/);
	assert.equal((await request(old)).status, Number(status));
	assert.equal((await request(target)).status, 200);
	console.log(`Production Worker integration: ${requests} HTTP requests passed; real posts, category, pagination, tour, commercial page, queries, HEAD, 404 and historical redirect.`);
} finally {
	await mf.dispose();
}
