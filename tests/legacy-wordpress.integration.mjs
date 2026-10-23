import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Miniflare } from "miniflare";

const server = resolve("dist/server");
const config = JSON.parse(await readFile(join(server, "wrangler.json"), "utf8"));
const workerFirst = ["/en", "/en/*", "/", "/es", "/es/", "/pt", "/pt/"];
assert.deepEqual(config.assets.run_worker_first, workerFirst);
assert.notEqual(config.assets.run_worker_first, true, "Worker-first must stay selective");

const files = (await readdir(server, { recursive: true })).filter(
	(path) => /\.(mjs|js)$/.test(path) && !path.startsWith(".prerender"),
);
const modules = ["entry.mjs", ...files.filter((path) => path !== "entry.mjs")].map(
	(path) => ({ type: "ESModule", path: join(server, path) }),
);
const mf = new Miniflare({
	modules,
	modulesRootPath: server,
	compatibilityDate: config.compatibility_date,
	assets: {
		directory: resolve("dist/client"),
		binding: "ASSETS",
		routerConfig: {
			has_user_worker: true,
			static_routing: { user_worker: config.assets.run_worker_first },
		},
	},
	kvNamespaces: ["SESSION"],
});

const origin = "https://dreamy.tours";
async function request(path, method = "GET") {
	const response = await mf.dispatchFetch(`${origin}${path}`, {
		method,
		redirect: "manual",
	});
	return new Response(await response.arrayBuffer(), response);
}

try {
	for (const home of ["/", "/es/", "/pt/"]) {
		for (const query of [
			"?p=5167794547",
			"?p=12345",
			"?s=casino",
			"?s=inca",
			"?p=x&p=12345&utm_source=test",
		]) {
			for (const method of ["GET", "HEAD"]) {
				const response = await request(home + query, method);
				assert.equal(response.status, 410, `${method} ${home}${query}`);
				assert.equal(response.headers.get("location"), null);
				assert.equal(response.headers.get("cache-control"), "no-store");
				if (method === "HEAD") assert.equal(await response.text(), "");
			}
		}
		assert.equal((await request(home)).status, 200, home);
		assert.equal(
			(await request(`${home}?utm_source=google&gclid=123&x=1&x=2`)).status,
			200,
			`legitimate campaign parameters on ${home}`,
		);
		assert.equal((await request(`${home}?p=offer`)).status, 200);
	}
	assert.equal(
		(await request("/inca-trail-4-days/?p=7457&s=inca")).status,
		200,
		"WordPress query rules are limited to homepages",
	);

	const redirects = (await readFile("public/_redirects", "utf8"))
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.startsWith("/en/"));
	assert.equal(redirects.length, 8);
	for (const rule of redirects) {
		const [source, destination, status] = rule.split(/\s+/);
		for (const method of ["GET", "HEAD"]) {
			for (const query of ["", "?utm_source=backlink&x=1&x=2"]) {
				const response = await request(source + query, method);
				assert.equal(response.status, Number(status), source);
				assert.equal(
					new URL(response.headers.get("location"), origin).toString(),
					new URL(`${destination}${query}`, origin).toString(),
					source,
				);
			}
		}
	}
	for (const path of ["/en", "/en/", "/en/inca-trail-4-days/", "/en/unknown/"]) {
		for (const method of ["GET", "HEAD"]) {
			const response = await request(path, method);
			assert.equal(response.status, 410, `${method} ${path}`);
			assert.equal(response.headers.get("location"), null);
		}
	}
	console.log(
		"Legacy WordPress Worker integration passed: targeted 410, normal homepages and query parameters, 8 protected redirects, and retired /en/ routes.",
	);
} finally {
	await mf.dispose();
}
