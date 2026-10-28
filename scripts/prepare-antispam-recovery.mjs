import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, writeFile, copyFile } from "node:fs/promises";
import { resolve, join, dirname, relative } from "node:path";
import ts from "typescript";

// Local export only: never commits, pushes, deploys, copies .env or calls APIs.
const root = process.cwd();
const base = "7774dc44e33d0b3de4e1b4f2862f66389faee907";
const parent = resolve(root, ".codex-trust-preview/recovery");
await mkdir(parent, { recursive: true });
const destination = await mkdtemp(join(parent, "candidate-"));
const source = join(destination, "source");
await mkdir(source);
const archive = join(destination, "base.tar");
execFileSync("git", ["archive", "--format=tar", `--output=${archive}`, base]);
execFileSync("tar", ["-xf", archive, "-C", source]);

// Safety compatibility bridge over the verified Git base. This is intentionally
// not a claim that the base equals the active Cloudflare version 997944ac.
const overlay = [
  ".gitignore", ".env.example", "package.json", "playwright.config.ts",
  "src/worker.ts", "wrangler.jsonc", "src/env.d.ts", "src/cloudflare-runtime.d.ts",
  "src/worker-configuration.d.ts", "src/lib/resend.ts", "src/lib/formRateLimiter.ts",
  "src/lib/formSecurity.ts", "src/lib/formSecurityClient.ts", "src/lib/formValidation.ts",
  "src/components/ui/FormSecurity.tsx",
  "src/components/content/PlaneaTuViaje.tsx", "src/components/content/LibroReclamaciones.tsx",
  "src/components/content/InclusiveEnquiryForm.astro", "src/components/tours/ContactForm.astro",
  "src/components/checkout/CheckoutSummary.tsx", "src/components/checkout/MachuPicchuPrebooking.tsx",
  "src/pages/api/planea-tu-viaje.ts", "src/pages/api/libro-reclamaciones.ts",
  "src/pages/api/checkout.ts", "src/pages/api/machu-picchu-prebooking.ts",
  "tests/form-antispam.test.ts", "tests/form-rate-limiter.integration.mjs",
  "tests/form-runtime.spec.ts", "tests/e2e-server.mjs", "tests/form-security.browser.mjs",
  "tests/build-localized-worker-fixture.ts",
];
const hashes = {};
for (const file of overlay) {
  await mkdir(dirname(join(source, file)), { recursive: true });
  await copyFile(join(root, file), join(source, file));
  hashes[file] = createHash("sha256").update(await readFile(join(source, file))).digest("hex");
}
const parsed = ts.parseConfigFileTextToJson("wrangler.jsonc", await readFile(join(source, "wrangler.jsonc"), "utf8"));
if (parsed.error) throw new Error("Invalid Wrangler JSONC");
const config = parsed.config;
config.vars = { ...config.vars, DRY_RUN: "true" };
await writeFile(join(source, "wrangler.jsonc"), JSON.stringify(config, null, 2) + "\n");
hashes["wrangler.jsonc"] = createHash("sha256").update(await readFile(join(source, "wrangler.jsonc"))).digest("hex");
const evidence = JSON.parse(await readFile(join(root, ".codex-trust-preview/antispam-predeploy/recovery-source-evidence.json"), "utf8"));
const provenance = {
  status: "CONTINGENCY_CANDIDATE_NOT_AUTHORIZED_FOR_DEPLOYMENT",
  generatedAt: new Date().toISOString(),
  verifiedGitBase: base,
  activeCloudflareVersionPrefixReported: "997944ac",
  activeSourceEquivalenceProven: false,
  sourceEvidence: evidence,
  overlay: hashes,
  localDryRunForced: true,
  knownLimitations: [
    "The exact source of active version 997944ac has not been retrieved.",
    "This candidate restores the verified Git base plus the required safety bridge, not unknown manual Cloudflare changes.",
    "The base restores its old sitemap filter and Portuguese booking aliases; later release fixes are not included.",
    "Build reads published CMS data; generated HTML is not a byte-for-byte copy of the former deployment.",
    "Do not deploy until provenance is resolved and the candidate is explicitly reviewed and authorized.",
  ],
};
await writeFile(join(source, "RECOVERY_PROVENANCE.json"), JSON.stringify(provenance, null, 2) + "\n");
await writeFile(join(source, "RECOVERY_README.md"), `# Local contingency candidate — DO NOT DEPLOY\n\nVerified Git base: ${base}. Active version prefix reported: 997944ac. Equivalence is NOT proven.\n\nThe compatibility bridge preserves FormRateLimiter, its export, FORM_RATE_LIMITER, form-antispam-v1, SESSION/IMAGES/ASSETS, Turnstile, validation, traps and DRY_RUN. The candidate forces DRY_RUN=true locally. No private environment files are included.\n\nThis is a forward-deployment candidate, not a version rollback across the Durable Object creation. Restore source selectively and retain the bridge. Do not revert the entire antispam commit or remove the migration/namespace.\n\nKnown differences: the Git base has the old sitemap filter and Portuguese aliases. Newly generated content depends on CMS state and is not an archived copy of production. Inspect RECOVERY_PROVENANCE.json and validation-results.json before any authorization.\n`);
await writeFile(join(destination, "package-location.json"), JSON.stringify({ root, destination, source, base }, null, 2));
await writeFile(join(parent, "latest.json"), JSON.stringify({ root, destination, source, base }, null, 2));
console.log(JSON.stringify({ package: relative(root, destination), base, overlayFiles: overlay.length, activeSourceEquivalenceProven: false }));
