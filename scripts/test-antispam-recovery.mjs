import assert from "node:assert/strict";
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { Miniflare, createFetchMock } from "miniflare";

if (!process.versions.node.startsWith("22.")) throw new Error("Use Node 22");
const root = process.cwd();
const location = JSON.parse(await readFile(".codex-trust-preview/recovery/latest.json", "utf8"));
const state = join(location.destination, "persistent-state");
await mkdir(state, { recursive: true });
const hash = async path => createHash("sha256").update(await readFile(path)).digest("hex");
assert.equal(await hash("src/lib/formRateLimiter.ts"), await hash(join(location.source, "src/lib/formRateLimiter.ts")));
let mailAttempts = 0;
let verifications = 0;
let requests = 0;
const checks = [];
const configs = [];
async function instance(project) {
  const server = join(project, "dist/server");
  const config = JSON.parse(await readFile(join(server, "wrangler.json"), "utf8"));
  configs.push(config);
  assert.equal(config.name, "dreamy-front");
  assert.equal(config.keep_vars, true);
  assert.equal(config.workers_dev, false);
  assert.deepEqual(config.durable_objects.bindings, [{ name: "FORM_RATE_LIMITER", class_name: "FormRateLimiter" }]);
  assert.deepEqual(config.migrations, [{ tag: "form-antispam-v1", new_sqlite_classes: ["FormRateLimiter"] }]);
  assert.equal(config.assets.binding, "ASSETS");
  assert.equal(config.images.binding, "IMAGES");
  assert(config.kv_namespaces.some(item => item.binding === "SESSION"));
  const entry = await readFile(join(server, "entry.mjs"), "utf8");
  assert.match(entry, /export\s*\{[^}]*FormRateLimiter/);
  const files = (await readdir(server, { recursive: true })).filter(path => /\.(mjs|js)$/.test(path) && !path.startsWith(".prerender"));
  const mock = createFetchMock();
  mock.disableNetConnect();
  mock.get("https://challenges.cloudflare.com")
    .intercept({ path: "/turnstile/v0/siteverify", method: "POST" })
    .reply(() => { verifications++; return { statusCode: 200, data: JSON.stringify({ success: true, hostname: "dreamy.tours" }), responseOptions: { headers: { "content-type": "application/json" } } }; }).persist();
  mock.get("https://api.resend.com")
    .intercept({ path: /.*/, method: "POST" })
    .reply(() => { mailAttempts++; return { statusCode: 500, data: "mail must never be called" }; }).persist();
  return new Miniflare({
    name: "dreamy-front", modulesRootPath: server,
    modules: ["entry.mjs", ...files.filter(path => path !== "entry.mjs")].map(path => ({ type: "ESModule", path: join(server, path) })),
    compatibilityDate: config.compatibility_date,
    compatibilityFlags: config.compatibility_flags,
    durableObjects: { FORM_RATE_LIMITER: { className: "FormRateLimiter", useSQLite: true } },
    durableObjectsPersist: state,
    kvNamespaces: ["SESSION"],
    assets: { directory: join(project, "dist/client"), binding: "ASSETS", routerConfig: { has_user_worker: true, static_routing: { user_worker: config.assets.run_worker_first } } },
    bindings: { DRY_RUN: "true", TURNSTILE_SECRET_KEY: "recovery-local-fixture-only" },
    fetchMock: mock,
  });
}
async function post(mf, endpoint, body = {}, ip = "192.0.2.200") {
  requests++;
  const response = await mf.dispatchFetch(`https://dreamy.tours/api/${endpoint}`, {
    method: "POST", headers: { "content-type": "application/json", "cf-connecting-ip": ip }, body: JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, body: JSON.parse(text) };
}
let mf;
try {
  mf = await instance(root);
  for (let index = 0; index < 3; index++) assert.equal((await post(mf, "planea-tu-viaje")).status, 403);
  checks.push("Antispam release wrote three persistent attempts");
  await mf.dispose();
  mf = await instance(location.source);
  for (let index = 0; index < 2; index++) assert.equal((await post(mf, "planea-tu-viaje")).status, 403);
  assert.equal((await post(mf, "planea-tu-viaje")).status, 429);
  assert.equal((await post(mf, "libro-reclamaciones")).status, 403);
  assert.equal((await post(mf, "planea-tu-viaje", {}, "192.0.2.201")).status, 403);
  checks.push("Recovery candidate retained prior attempts; sixth blocked; endpoint/IP isolation preserved");
  for (const [index, endpoint] of ["planea-tu-viaje", "libro-reclamaciones", "checkout", "machu-picchu-prebooking"].entries()) {
    assert.equal((await post(mf, endpoint, {}, `192.0.10.${index}`)).status, 403);
    assert.equal((await post(mf, endpoint, { website: "bot.example" }, `192.0.11.${index}`)).status, 200);
    assert.equal((await post(mf, endpoint, { "cf-turnstile-response": "fixture", formRenderedAt: Date.now() }, `192.0.12.${index}`)).status, 200);
  }
  checks.push("All four compiled mail endpoints preserve fail-closed Turnstile, honeypot and time trap");
  const valid = { nombres: "María García", pais: "Perú", email: "maria@example.com", telefono: "+51987654321", ciudad: "Lima", documento: "AB123456", tipo: "reclamo", detalle: "Solicito revisar la atención recibida durante mi visita.", mensaje: "", website: "", formRenderedAt: Date.now() - 10000, "cf-turnstile-response": "recovery-fixture-token" };
  for (const [index, endpoint] of ["planea-tu-viaje", "libro-reclamaciones"].entries()) {
    const response = await post(mf, endpoint, valid, `192.0.13.${index}`);
    assert.equal(response.status, 200);
    assert.equal(response.body.id, "dry-run");
    assert.equal((await post(mf, endpoint, { ...valid, nombres: "Test" }, `192.0.14.${index}`)).status, 400);
  }
  assert.equal(mailAttempts, 0);
  assert.equal(verifications, 4);
  checks.push("Valid and invalid payloads exercise verification/validation; optional trip message retained; zero provider calls");
  for (const path of ["/", "/es/", "/pt/"]) {
    requests++;
    const response = await mf.dispatchFetch(`https://dreamy.tours${path}`);
    await response.arrayBuffer();
    assert.equal(response.status, 200);
  }
  checks.push("English, Spanish and Portuguese home assets remain accessible");
  assert.equal(configs[1].vars.DRY_RUN, "true");
  const result = { status: "LOCAL_CANDIDATE_TESTS_PASSED_ACTIVE_SOURCE_UNPROVEN", node: process.version, testedAt: new Date().toISOString(), requests, mailAttempts, verifications, activeSourceEquivalenceProven: false, checks, limitations: ["Miniflare persistence is not a production control-plane migration test.", "The source of Cloudflare version 997944ac is still unavailable.", "This candidate is not authorized for deployment."] };
  await writeFile(join(location.destination, "runtime-tests.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally { await mf?.dispose(); }
