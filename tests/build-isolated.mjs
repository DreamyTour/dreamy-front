// Astro build/check using a disposable local CMS fixture and allowlisted
// variables; repository and user Wrangler environment files stay unavailable.

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateCmsOrigin } from "../scripts/validate-cms-origin.mjs";

if (!validateCmsOrigin("https://cms.dreamy.tours"))
	throw Error("Origin validation failed");
const projectRoot = process.cwd();
if (
	[".dev.vars", ".dev.vars.production"].some((name) =>
		existsSync(join(projectRoot, name)),
	)
) {
	throw new Error(
		"Isolated build refused: remove project .dev.vars files before running.",
	);
}
const checkOnly = process.argv.includes("--check");
const server = createServer((req, res) => {
	const url = new URL(req.url, "http://fixture");
	res.setHeader("Content-Type", "application/json");
	let data = [];
	const slugs = [...url.searchParams.entries()]
		.filter(([key]) => key.startsWith("filters[slug][$in]"))
		.map(([, value]) => value);
	if (url.pathname === "/api/tours" && slugs.length)
		data = slugs.map((slug, i) => ({
			id: i + 1,
			documentId: `fixture-${i}`,
			slug,
			titulo: "Local build fixture",
			badge: [{ titulo: "Duraci\u00f3n", content: "1 day" }],
			seo: { metaImage: { url: "/favicon.svg", width: 1200, height: 900 } },
			imagen: { url: "/favicon.svg", width: 1200, height: 900 },
			tab: {},
		}));
	if (["/api/global", "/api/home"].includes(url.pathname))
		data = {
			menu: { menuItems: [] },
			headerTop: { headerLink: [], button: [] },
		};
	res.end(
		JSON.stringify({
			data,
			meta: { pagination: { page: 1, pageSize: 100, pageCount: 1, total: 0 } },
		}),
	);
});
const temporaryRoot = await mkdtemp(join(tmpdir(), "dreamy-isolated-build-"));
const envDir = join(temporaryRoot, "env");
const homeDir = join(temporaryRoot, "home");
let serverStarted = false;
try {
	await Promise.all([mkdir(envDir), mkdir(homeDir)]);
	await new Promise((resolve, reject) => {
		const onError = (error) => reject(error);
		server.once("error", onError);
		server.listen(0, "127.0.0.1", () => {
			server.off("error", onError);
			serverStarted = true;
			resolve();
		});
	});
	const origin = `http://127.0.0.1:${server.address().port}`;
	const env = {
		PATH: process.env.PATH ?? "",
		SystemRoot: process.env.SystemRoot ?? "",
		WINDIR: process.env.WINDIR ?? "",
		ComSpec: process.env.ComSpec ?? "",
		PATHEXT: process.env.PATHEXT ?? "",
		TEMP: temporaryRoot,
		TMP: temporaryRoot,
		HOME: homeDir,
		USERPROFILE: homeDir,
		DREAMY_BUILD_ENV_DIR: envDir,
		CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: "false",
		VITE_STRAPI_URL: origin,
	};
	const command = checkOnly
		? [join(projectRoot, "node_modules", "astro", "bin", "astro.mjs"), "check"]
		: [
				"--input-type=module",
				"-e",
				`import{build}from'astro';await build({fonts:[]});`,
			];
	const child = spawn(process.execPath, command, {
		cwd: process.cwd(),
		env,
		stdio: "inherit",
	});
	const code = await new Promise((resolve, reject) => {
		child.on("error", reject);
		child.on("exit", resolve);
	});
	process.exitCode = code ?? 1;
} finally {
	if (serverStarted) await new Promise((resolve) => server.close(resolve));
	await rm(temporaryRoot, { recursive: true, force: true });
}
