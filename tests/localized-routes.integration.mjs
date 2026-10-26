import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Miniflare } from "miniflare";
import { parse } from "parse5";

const server = resolve("dist/server");
const config = JSON.parse(await readFile(join(server, "wrangler.json"), "utf8"));
assert.deepEqual(config.assets.run_worker_first, ["/en", "/en/*", "/", "/es", "/es/", "/pt", "/pt/"], "retired English paths and homepage queries must run before assets");
assert.equal(config.assets.not_found_handling, undefined);
const files = (await readdir(server, { recursive: true })).filter((path) => /\.(mjs|js)$/.test(path) && !path.startsWith(".prerender"));
const map = JSON.parse(await readFile("dist/localized-route-map.json", "utf8"));
const modules = ["entry.mjs", ...files.filter((path) => path !== "entry.mjs")].map((path) => ({ type: "ESModule", path: join(server, path) }));
const mf = new Miniflare({
	modules, modulesRootPath: server, compatibilityDate: config.compatibility_date,
	assets: { directory: resolve("dist/client"), binding: "ASSETS", routerConfig: { has_user_worker: true, static_routing: { user_worker: config.assets.run_worker_first } } },
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
	for (const home of ["/", "/es/", "/pt/"]) {
		for (const query of ["?p=7457", "?p=1336", "?s=inca", "?s=", "?p=x&p=7457&utm_source=test"]) {
			for (const method of ["GET", "HEAD"]) {
				const response = await request(home + query, method);
				assert.equal(response.status, 410, home + query);
				assert.equal(response.headers.get("location"), null);
				assert.equal(response.headers.get("x-robots-tag"), "noindex, follow");
				if (method === "HEAD") assert.equal(await response.text(), "");
			}
		}
		assert.equal((await request(home + "?utm_source=google&gclid=123&x=1&x=2")).status, 200);
	}
	assert.equal((await request("/inca-trail-4-days/?p=7457&s=inca")).status, 200, "query retirement is restricted to homepages");
	const exclusions = JSON.parse(await readFile("src/data/sitemapExclusions.json", "utf8"));
	const hrefs = html => {
		const result = [];
		const visit = node => {
			if (node.tagName === "a") {
				const href = node.attrs?.find(attr => attr.name === "href")?.value;
				if (href) result.push(new URL(href, origin).pathname);
			}
			for (const child of node.childNodes ?? []) visit(child);
		};
		visit(parse(html));
		return result;
	};
	for (const path of exclusions.checkout) {
		const response = await request(path);
		assert.equal(response.status, 200, path);
		const html = await response.text();
		assert.match(html, /<meta\b[^>]*name="robots"[^>]*content="noindex, nofollow"/, `existing noindex: ${path}`);
	}
	for (const path of exclusions.blogPagination) {
		const response = await request(path);
		assert.equal(response.status, 200, path);
		assert.equal(response.headers.get("location"), null, path);
		const page = Number(path.match(/\/(\d+)\/$/)[1]);
		const base = path.replace(/\d+\/$/, "");
		const links = hrefs(await response.text());
		assert(links.includes(page === 2 ? base : `${base}${page - 1}/`), `previous pagination link ${path}`);
		if (page < 8) assert(links.includes(`${base}${page + 1}/`), `next pagination link ${path}`);
	}
	// All map destinations must return 200 directly, including every category page.
	for (const [id, translations] of Object.entries(map.documents)) {
		const kind = id.split(":")[0];
		for (const [locale, entry] of Object.entries(translations)) {
			for (let page = 1; page <= entry.pages; page++) {
				const path = pathFor(kind, locale, entry.slug, page);
				const response = await request(path);
				assert.equal(response.status, 200, path);
				assert.equal(response.headers.get("location"), null, path);
				if (locale === "en") {
					const retired = await request(`/en${path}`);
					assert.equal(retired.status, 410, `retired alias of ${path}`);
					assert.equal(retired.headers.get("location"), null);
				}
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
	const historical = (await readFile("public/_redirects", "utf8")).split(/\r?\n/).map(line => line.trim()).filter(line => line.startsWith("/en/"));
	for (const rule of historical) {
		const [old, target, status] = rule.split(/\s+/);
		for (const method of ["GET", "HEAD"]) for (const query of ["", "?utm_source=backlink&x=1&x=2"]) {
			const response = await request(old + query, method);
			assert.equal(response.status, Number(status), old);
			assert.equal(response.headers.get("location"), target + query, old);
		}
		assert.equal((await request(target)).status, 200);
	}
	for (const path of ["/en", "/en/", "/en/inca-trail-4-days/", "/en/cusco/", "/en/lima/", "/en/blog/x/blog/x", "/en/unknown/"]) {
		for (const method of ["GET", "HEAD", "POST"]) {
			const response = await request(path, method);
			assert.equal(response.status, 410, path);
			assert.equal(response.headers.get("location"), null);
			if (method === "HEAD") assert.equal(await response.text(), "");
		}
	}
	assert.equal((await request("/es/")).status, 200);
	assert.equal((await request("/pt/")).status, 200);
	console.log(`Production Worker integration: ${requests} HTTP requests passed; real posts, category, pagination, tour, commercial page, queries, HEAD, 404 and historical redirect.`);
} finally {
	await mf.dispose();
}
