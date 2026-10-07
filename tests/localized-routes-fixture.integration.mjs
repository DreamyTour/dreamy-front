import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Miniflare } from "miniflare";

const temp = await mkdtemp(join(tmpdir(), "dreamy-localized-worker-"));
const assets = join(temp, "assets");
for (const path of ["es/blog/solo-es", "es/blog/categoria-es/3", "blog/category-en/2", "blog/ambiguous"]) {
	await mkdir(join(assets, path), { recursive: true });
	await writeFile(join(assets, path, "index.html"), "<html>Static asset</html>");
}
execFileSync("bun", ["run", "tests/build-localized-worker-fixture.ts", join(temp, "worker.mjs")], { cwd: resolve("."), stdio: "pipe" });
const mf = new Miniflare({ modules: true, scriptPath: join(temp, "worker.mjs"), compatibilityDate: "2026-04-15", assets: { directory: assets, binding: "ASSETS", routerConfig: { has_user_worker: true } } });
async function request(path, method = "GET") {
	const response = await mf.dispatchFetch(`https://dreamy.tours${path}`, { method, redirect: "manual" });
	return new Response(await response.arrayBuffer(), response);
}
try {
	const canonical = await request("/es/blog/solo-es/");
	assert.equal(canonical.status, 200);
	assert.equal(canonical.headers.get("X-Test-Worker-Invoked"), null, "canonical asset must bypass the Worker entirely");
	// An existing asset wins over ambiguity elsewhere in the slug catalogue.
	assert.equal((await request("/blog/ambiguous/")).headers.get("X-Test-Worker-Invoked"), null);
	const missing = await request("/pt/blog/solo-es/?utm_source=x&x=1&x=2");
	assert.equal(missing.status, 302);
	assert.equal(missing.headers.get("location"), "https://dreamy.tours/es/blog/solo-es/?utm_source=x&x=1&x=2");
	assert.equal(missing.headers.get("X-Test-Worker-Invoked"), "yes");
	assert.equal((await request("/es/blog/solo-es/?utm_source=x&x=1&x=2")).status, 200);
	for (const path of ["/ambiguous-root/", "/pt/blog/ambiguous/", "/blog/unknown/", "/blog/categoria-es/3/"]) {
		const response = await request(path);
		assert.equal(response.status, 404, "unsafe or unresolved routes must use Astro's 404");
		assert.equal(response.headers.get("location"), null);
		assert.equal(response.headers.get("X-Test-Astro-Handler"), "yes", path);
		assert.equal(response.headers.get("Content-Type"), "text/html; charset=utf-8");
		assert.equal(response.headers.get("Cache-Control"), "no-store");
		assert.equal(await response.text(), "Astro fixture: not found");
	}
	const ambiguousHead = await request("/ambiguous-root/", "HEAD");
	assert.equal(ambiguousHead.status, 404);
	assert.equal(ambiguousHead.headers.get("X-Test-Astro-Handler"), "yes");
	assert.equal(await ambiguousHead.text(), "");
	assert.equal((await request("/pt/blog/categoria-es/3/")).status, 302);
	assert.equal((await request("/es/blog/categoria-es/3/")).status, 200);
	assert.equal((await request("/blog/categoria-es/2")).headers.get("location"), "https://dreamy.tours/blog/category-en/2/");
	assert.equal((await request("/blog/category-en/2/")).status, 200);
	assert.equal((await request("/blog/categoria-es/3/")).status, 404, "cannot downgrade to page one");
	assert.equal((await request("/blog/unknown/")).status, 404);
	assert.equal((await request("/blog/solo-es/", "POST")).status, 404, "do not redirect writes");
	console.log("Fixture Worker integration passed: assets bypass Worker, missing translation 302, ambiguity, unavailable pagination, unknown slug and non-GET.");
} finally {
	await mf.dispose();
	await rm(temp, { recursive: true, force: true });
}
