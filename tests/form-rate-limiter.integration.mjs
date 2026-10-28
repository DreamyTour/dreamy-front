import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import ts from "typescript";
import { Miniflare } from "miniflare";

// Run the real DO in workerd, including concurrent calls and eviction/restart.
const source = await readFile(
  new URL("../src/lib/formRateLimiter.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
});
const persist = await mkdtemp(join(tmpdir(), "dreamy-form-rate-"));
const options = {
  modules: true,
  compatibilityDate: "2026-04-15",
  durableObjects: {
    LIMITER: { className: "FormRateLimiter", useSQLite: true },
  },
  durableObjectsPersist: persist,
  script: `${outputText}\nexport default { async fetch(request, env) { const id = new URL(request.url).pathname; const allowed = await env.LIMITER.get(env.LIMITER.idFromName(id)).consume(); return new Response(null, {status: allowed ? 204 : 429}); } };`,
};
let mf = new Miniflare(options);
try {
  const responses = await Promise.all(
    Array.from({ length: 12 }, () =>
      mf.dispatchFetch("https://test/trip-ip-1"),
    ),
  );
  assert.equal(responses.filter((r) => r.status === 204).length, 5);
  assert.equal(responses.filter((r) => r.status === 429).length, 7);
  assert.equal(
    (await mf.dispatchFetch("https://test/complaint-ip-1")).status,
    204,
  );
  assert.equal((await mf.dispatchFetch("https://test/trip-ip-2")).status, 204);
  await mf.dispose();
  mf = new Miniflare(options);
  assert.equal((await mf.dispatchFetch("https://test/trip-ip-1")).status, 429);
  console.log(
    "PASS: concurrent attempts accept exactly five; independent endpoint/IP counters; persistence after restart.",
  );
} finally {
  await mf.dispose();
  assert(
    resolve(persist).startsWith(resolve(tmpdir()) + sep) &&
      persist.includes("dreamy-form-rate-"),
  );
  await rm(persist, { recursive: true, force: true });
}
