import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Miniflare } from "miniflare";

const original = await readFile("public/_redirects");
const rules = original.toString("utf8").split(/\r?\n/).map(line => line.trim()).filter(line => /^\/en(?:\/|\s)/.test(line)).map(line => line.split(/\s+/));
assert(rules.length > 0, "the backlink exceptions must be inventoried before testing retirement");
const prefix = join(resolve(tmpdir()), "dreamy-en-retirement-");
const temp = await mkdtemp(prefix);
const assets = join(temp, "assets");
const pages = ["", "inca-trail-4-days", "es", "pt", "es/consulta", "pt/consulta", "enquiry", "en", "en/cusco", "en/lima", "en/inca-trail-4-days", ...rules.map(([, target]) => target.replace(/^\/|\/$/g, ""))];
for (const path of pages) {
	await mkdir(join(assets, path), { recursive: true });
	await writeFile(join(assets, path, "index.html"), "<html>Existing asset</html>");
}
await writeFile(join(assets, "_redirects"), original);
execFileSync("bun", ["run", "tests/build-localized-worker-fixture.ts", join(temp, "worker.mjs")], { cwd: resolve("."), stdio: "pipe" });
const mf = new Miniflare({
	modules: true, scriptPath: join(temp, "worker.mjs"), compatibilityDate: "2026-04-15",
	assets: { directory: assets, binding: "ASSETS", routerConfig: { has_user_worker: true, static_routing: { user_worker: ["/en", "/en/*", "/", "/es", "/es/", "/pt", "/pt/"] } } },
});
let requests = 0;
async function request(path, method = "GET") {
	requests++;
	const response = await mf.dispatchFetch(`https://dreamy.tours${path}`, { method, redirect: "manual" });
	return new Response(await response.arrayBuffer(), response);
}
try {
	for (const [source, target, status = "302"] of rules) {
		for (const method of ["GET", "HEAD"]) for (const query of ["", "?utm_source=backlink&x=1&x=2"]) {
			const response = await request(source + query, method);
			assert.equal(response.status, Number(status), source);
			assert.equal(response.headers.get("location"), target + query, source);
			assert.equal((await request(target + query)).status, 200, `backlink destination ${target}`);
		}
	}
	for (const path of ["/en", "/en/", "/en/inca-trail-4-days", "/en/inca-trail-4-days/", "/en/cusco/", "/en/lima/", "/en/unknown/", "/en/blog/a/blog/a", "/en/file.pdf", `${rules[0][0]}/extra`]) {
		for (const method of ["GET", "HEAD", "POST", "DELETE", "OPTIONS"]) {
			const response = await request(`${path}?utm_source=test&x=1&x=2`, method);
			assert.equal(response.status, 410, `${method} ${path}`);
			assert.equal(response.headers.get("location"), null, "no redirect chain for retired URLs");
			if (method === "HEAD") assert.equal(await response.text(), "");
		}
	}
	for (const path of ["/", "/inca-trail-4-days/", "/es/", "/pt/", "/es/consulta/", "/pt/consulta/", "/enquiry/"]) {
		const response = await request(path);
		assert.equal(response.status, 200, path);
		assert.equal(response.headers.get("X-Test-Worker-Invoked"), ["/", "/es/", "/pt/"].includes(path) ? "yes" : null, "only homepage assets require query inspection");
	}
	assert.deepEqual(await readFile("public/_redirects"), original);
	console.log(`Legacy /en/ fixture: ${requests} HTTP checks passed; all ${rules.length} historical rules unchanged, GET/HEAD/query preservation, 410 before stale assets, valid EN/ES/PT assets unchanged.`);
} finally {
	await mf.dispose();
	assert(resolve(temp).startsWith(prefix), "cleanup must stay within the named test directory");
	await rm(temp, { recursive: true, force: true });
}
