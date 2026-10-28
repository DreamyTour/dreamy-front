import { Miniflare, createFetchMock } from "miniflare";
import { readFile, readdir } from "node:fs/promises";
import { resolve, join } from "node:path";

if (Number(process.versions.node.split(".")[0]) !== 22) {
  throw new Error("Run E2E with Node 22, as required by .node-version.");
}

// Exercise the compiled release in workerd, without Astro CLI daemon detection,
// its Node-only JSON logger, or development HMR. Never pass real mail secrets.
const directory = resolve("dist/server");
const config = JSON.parse(await readFile(join(directory, "wrangler.json"), "utf8"));
const files = (await readdir(directory, { recursive: true })).filter(path => /\.(mjs|js)$/.test(path) && !path.startsWith(".prerender"));
const fetchMock = createFetchMock();
fetchMock.disableNetConnect();
// SSR booking pages read published tour metadata. Mail hosts remain blocked.
fetchMock.enableNetConnect("cms.dreamy.tours");
fetchMock.get("https://challenges.cloudflare.com")
  .intercept({ path: "/turnstile/v0/siteverify", method: "POST" })
  .reply(200, JSON.stringify({ success: true, hostname: "127.0.0.1" }), { headers: { "content-type": "application/json" } }).persist();
const server = new Miniflare({
  host: "127.0.0.1", port: 4322,
  modules: ["entry.mjs", ...files.filter(path => path !== "entry.mjs")].map(path => ({ type: "ESModule", path: join(directory, path) })),
  modulesRootPath: directory,
  compatibilityDate: config.compatibility_date,
  compatibilityFlags: config.compatibility_flags,
  assets: { directory: resolve("dist/client"), binding: "ASSETS", routerConfig: { has_user_worker: true, static_routing: { user_worker: config.assets.run_worker_first } } },
  kvNamespaces: ["SESSION"],
  durableObjects: { FORM_RATE_LIMITER: { className: "FormRateLimiter", useSQLite: true } },
  fetchMock,
  bindings: { DRY_RUN: "true", TURNSTILE_SECRET_KEY: "local-e2e-fixture-only" },
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, async () => { await server.dispose(); process.exit(0); });
}
console.log(`E2E local workerd: Node ${process.versions.node}, mail DRY_RUN=true, ${(await server.ready).origin}`);
