/** Real MapLibre secondary-stop interaction; optional read-only public snapshot and basemaps.
 * Standalone: node tests/secondary-stops.integration.mjs
 * Real basemaps: add --real-basemaps; optional read-only tour input: --snapshot=/path/to/snapshot.json
 * No GPX, screenshot or CMS snapshot is required by the standalone test.
 */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { build } from "esbuild";

const root = process.cwd(),
	real = process.argv.includes("--real-basemaps"),
	topo = process.argv.includes("--topo");
const evidence = path.join(
	root,
	"artifacts/secondary-stops-2026-11-17",
	`after-${real ? (topo ? "real-topo" : "real") : "isolated"}`,
);
await mkdir(evidence, { recursive: true });
// Standalone synthetic fixtures by default. Real tour data is an optional read-only input.
const snapshotPath = process.argv
	.find((arg) => arg.startsWith("--snapshot="))
	?.slice("--snapshot=".length);
const snapshot = snapshotPath
	? JSON.parse(await readFile(path.resolve(snapshotPath), "utf8"))
	: null;
const fixtures = {};
for (const count of [2, 4, 7, 15]) {
	fixtures["days" + count] = Array.from({ length: count }, (_, i) => {
		const x = -72.4 + (i % 5) * 0.03,
			y = -13.4 + Math.floor(i / 5) * 0.03;
		const place = (label, coordinates) => ({ label, coordinates });
		return {
			id: i + 1,
			order: i + 1,
			title: `Jornada ${i + 1}`,
			description: "FULL_DAY_DESCRIPTION_MUST_NOT_OPEN",
			routePlan: {
				version: 1,
				start: place("Inicio", [x, y]),
				legs: [
					{
						id: "bus-" + i,
						mode: "bus",
						destination: place(`Parada compartida ${i + 1}`, [
							x + 0.004,
							y + 0.003,
						]),
					},
					{
						id: "walk-" + i,
						mode: "walking",
						destination: place(`Parada compartida ${i + 1}`, [
							x + 0.004,
							y + 0.003,
						]),
					},
					{
						id: "train-" + i,
						mode: "train",
						destination: place(`Visita ${i + 1}`, [x + 0.012, y + 0.008]),
					},
					{
						id: "end-" + i,
						mode: "bus",
						kind: "end",
						destination: place(`Destino ${i + 1}`, [x + 0.02, y - 0.005]),
					},
				],
			},
		};
	});
}
fixtures.real = snapshot
	? snapshot.mapStops.map((s) => ({ ...s, imagen: null }))
	: fixtures.days2;
const files = {};
const server = createServer((req, res) => {
	const url = new URL(req.url, "http://fixture");
	if (url.pathname === "/api/tour-route") {
		res.writeHead(503, { "Content-Type": "application/json" });
		return res.end('{"error":"fixture-unavailable"}');
	}
	if (files[url.pathname]) {
		res.setHeader(
			"Content-Type",
			url.pathname.endsWith(".css") ? "text/css" : "text/javascript",
		);
		return res.end(files[url.pathname]);
	}
	res.setHeader("Content-Type", "text/html; charset=utf-8");
	res.end(
		'<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Paradas secundarias: prueba local</title><link rel="stylesheet" href="/app.css"><style>body{margin:0}.tour-map-tab{max-width:1100px}</style><div id="root"></div><script type="module" src="/app.js"></script></html>',
	);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
	const built = await build({
		bundle: true,
		loader: { ".woff2": "dataurl" },
		write: false,
		outdir: "fixture",
		format: "esm",
		platform: "browser",
		jsx: "automatic",
		alias: { "@": path.join(root, "src") },
		define: {
			"process.env.NODE_ENV": '"test"',
			"import.meta.env": JSON.stringify({ DEV: true, PUBLIC_MAPTILER_KEY: "" }),
		},
		stdin: {
			resolveDir: root,
			loader: "tsx",
			contents: `import React,{useState}from'react';import{createRoot}from'react-dom/client';import MapTab from'./src/components/tours/MapTab';window.data=${JSON.stringify(fixtures)};window.original=JSON.stringify(window.data);function App(){const[selection,setSelection]=useState({name:'real',revision:0});const name=selection.name;window.choose=name=>setSelection(previous=>({name,revision:previous.revision+1}));return <MapTab key={name+'-'+selection.revision} lang="es" mapStops={window.data[name]}/>};createRoot(document.getElementById('root')).render(<App/>);`,
		},
		plugins: [
			{
				name: "secondary-evidence",
				setup(b) {
					b.onLoad(
						{ filter: /components[\\/]ui[\\/]map\.tsx$/ },
						async (args) => ({
							contents: (await readFile(args.path, "utf8")).replace(
								"setMapInstance(map);",
								"window.map=map;window.mapErrors=[];map.on('error',e=>window.mapErrors.push(e.error?.message));setMapInstance(map);",
							),
							loader: "tsx",
							resolveDir: path.dirname(args.path),
						}),
					);
					if (!real || topo) {
						b.onResolve({ filter: /^@\/lib\/tour-map-styles$/ }, () => ({
							path: "styles",
							namespace: "fixture",
						}));
						b.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
							loader: "js",
							contents: topo
								? `import{tourMapStyles as base}from ${JSON.stringify(path.join(root, "src/lib/tour-map-styles.ts").replaceAll("\\", "/"))};export const tourMapStyles={...base,map:{version:8,sources:{topo:{type:'raster',tiles:['https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'],tileSize:256,attribution:'Tiles © Esri World Topographic Map'}},layers:[{id:'topo',type:'raster',source:'topo'}]}};`
								: `export const tourMapStyles={map:{version:8,sources:{},layers:[{id:'bg',type:'background',paint:{'background-color':'#eef1e8'}}]},satellite:{version:8,sources:{},layers:[{id:'bg',type:'background',paint:{'background-color':'#233e39'}}]}};`,
						}));
					}
				},
			},
		],
	});
	for (const f of built.outputFiles)
		files[f.path.endsWith(".css") ? "/app.css" : "/app.js"] = f.text;
	const css = await compile(
		await readFile(path.join(root, "src/styles/global.css"), "utf8"),
		{ base: path.join(root, "src/styles"), onDependency: () => {} },
	);
	files["/app.css"] =
		(files["/app.css"] ?? "") +
		css.build(
			new Scanner({
				sources: [
					{ base: root, pattern: "src/**/*.{ts,tsx,astro}", negated: false },
				],
			}).scan(),
		);
	browser = await chromium.launch({
		headless: true,
		args: [
			"--use-gl=angle",
			"--use-angle=swiftshader",
			"--enable-unsafe-swiftshader",
		],
	});
	const page = await browser.newPage({
		viewport: { width: 1100, height: 900 },
		hasTouch: true,
		reducedMotion: "reduce",
	});
	const errors = [],
		blocked = [],
		tiles = { map: 0, satellite: 0 },
		networkFailures = [];
	page.on("pageerror", (e) => errors.push(e.message));
	page.on("response", (r) => {
		if (r.status() !== 200) return;
		if (r.url().includes("/World_Imagery/") && r.url().includes("/tile/"))
			tiles.satellite++;
		else if (
			r.url().includes("/World_Topo_Map/") ||
			(/basemaps\.cartocdn\.com/.test(r.url()) && !r.url().endsWith(".json"))
		)
			tiles.map++;
	});
	page.on("requestfailed", (r) =>
		networkFailures.push({ url: r.url(), error: r.failure()?.errorText }),
	);
	await page.route("**/*", (r) => {
		const u = new URL(r.request().url());
		if (
			r.request().method() === "GET" &&
			(u.origin === origin ||
				(real &&
					/^(services\.arcgisonline\.com|basemaps\.cartocdn\.com|[a-d]\.basemaps\.cartocdn\.com|tiles\.basemaps\.cartocdn\.com)$/.test(
						u.hostname,
					)))
		)
			return r.continue();
		blocked.push(u.origin);
		return r.abort();
	});
	await page.goto(origin);
	await page.waitForFunction(() => window.map?.isStyleLoaded());
	const cases = [],
		camera = () =>
			page.evaluate(() => ({
				zoom: window.map.getZoom(),
				bearing: window.map.getBearing(),
				center: window.map.getCenter().toArray(),
			}));
	const choose = async (name) => {
		await page.evaluate((n) => {
			window.oldMap = window.map;
			window.choose(n);
		}, name);
		await page.waitForFunction(
			() => window.map !== window.oldMap && window.map?.isStyleLoaded(),
		);
		await page.waitForTimeout(150);
	};
	const ready = async () => {
		await page.waitForFunction(() => window.map?.isStyleLoaded());
		await page.waitForTimeout(real ? 1400 : 100);
	};
	const shot = async (name) =>
		page
			.locator("[data-map-viewport]")
			.screenshot({ path: path.join(evidence, name + ".png") });
	const visibleDot = async () => {
		const id = await page.locator("[data-secondary-marker]").evaluateAll(
			(elements) =>
				elements.find((el) => {
					const r = el.getBoundingClientRect();
					return (
						r.x >= 0 &&
						r.y >= 0 &&
						r.right <= innerWidth &&
						r.bottom <= innerHeight &&
						el.contains(
							document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2),
						)
					);
				})?.dataset.secondaryMarker,
		);
		assert.ok(id, "At least one secondary group must be directly tappable");
		return page.locator(`[data-secondary-marker="${id}"]`);
	};
	const geometries = () =>
		page.evaluate(() =>
			JSON.stringify(
				Object.entries(window.map.getStyle().sources)
					.filter(([, s]) => s.data)
					.sort(([a], [b]) => a.localeCompare(b))
					.map(([id, s]) => ({ id, data: s.data })),
			),
		);
	const closePanel = async () =>
		page.getByRole("button", { name: "Cerrar parada", exact: true }).click();
	for (const width of [1100, 320, 375, 390]) {
		await page.setViewportSize({ width, height: 900 });
		for (const count of real ? [2] : [2, 4, 7, 15]) {
			for (const mode of ["map", "satellite"]) {
				await choose(real ? "real" : "days" + count);
				await ready();
				if (mode === "satellite") {
					await page
						.getByRole("button", { name: "Satélite", exact: true })
						.click();
					await ready();
				}
				await page.waitForTimeout(250);
				const dots = page.locator("[data-secondary-marker]");
				await expect.poll(() => dots.count()).toBeGreaterThan(0);
				const total = await dots.evaluateAll((es) =>
					es.reduce((n, e) => n + Number(e.dataset.secondaryCount), 0),
				);
				assert.equal(
					total,
					real ? 6 : count * 3,
					"All repeated visits remain represented",
				);
				for (const dot of await dots.all()) {
					assert.equal(
						(await dot.innerText()).trim(),
						"",
						"No permanent secondary numbers",
					);
					const box = await dot.boundingBox();
					assert.ok(box.width >= 44 && box.height >= 44);
				}
				await shot(`${width}-${count}-${mode}-overview`);
				const dot = await visibleDot(),
					prior = await camera(),
					geometry = await geometries();
				const tooltip = page.locator("[data-tour-marker-tooltip]");
				await dot.hover();
				await expect(tooltip).toBeVisible();
				await expect(tooltip).toHaveCSS("background-color", "rgb(0, 122, 50)");
				// A fast jump must not leave the pointer grace area open indefinitely.
				await page.mouse.move(width - 1, 899);
				await expect(tooltip).toHaveCount(0);
				assert.deepEqual(await camera(), prior);
				await dot.tap();
				await page.waitForTimeout(150);
				const panel = page.locator("[data-secondary-details]");
				await expect(panel).toBeVisible();
				assert.deepEqual(
					await camera(),
					prior,
					"Secondary selection preserves camera",
				);
				const afterGeometry = await geometries();
				if (afterGeometry !== geometry) {
					await writeFile(
						path.join(evidence, "geometry-before.json"),
						geometry,
					);
					await writeFile(
						path.join(evidence, "geometry-after.json"),
						afterGeometry,
					);
				}
				assert.ok(
					afterGeometry === geometry,
					"Transport geometry remains unchanged (see geometry snapshots)",
				);
				assert.equal(
					await page
						.locator(
							"[data-day-details-mobile]:visible,.tour-map-popup-desktop:visible",
						)
						.count(),
					0,
					"No full day description opens",
				);
				assert.equal(await panel.locator("img").count(), 0);
				assert.match(await panel.innerText(), /DÍA:/);
				assert.match(await panel.innerText(), /Llegada en/);
				const pb = await panel.boundingBox(),
					mb = await page.locator("[data-map-viewport]").boundingBox();
				assert.ok(
					pb.x >= mb.x &&
						pb.y >= mb.y &&
						pb.x + pb.width <= mb.x + mb.width + 1 &&
						pb.y + pb.height <= mb.y + mb.height,
					"Stop sheet stays inside map",
				);
				const choices = panel.locator("[data-secondary-choice]");
				const choiceCount = await choices.count();
				if (choiceCount > 1) {
					const last = choices.last();
					await last.click();
					await page.waitForTimeout(80);
					await expect(last).toHaveAttribute("aria-pressed", "true");
					assert.deepEqual(await camera(), prior);
					assert.equal(await geometries(), geometry);
				}
				await shot(`${width}-${count}-${mode}-selected`);
				await closePanel();
				await expect(panel).toHaveCount(0);
				assert.deepEqual(await camera(), prior);
				await dot.focus();
				await dot.press("Enter");
				await expect(
					page.getByRole("button", { name: "Cerrar parada", exact: true }),
				).toBeFocused();
				await page.keyboard.press("Escape");
				await expect(panel).toHaveCount(0);
				await expect(dot).toBeFocused();
				assert.deepEqual(await camera(), prior);
				// Opening a day still works; opening a stop from it must not alter the route/day selection.
				const main = page.locator("[data-day-marker]").first();
				await main.tap();
				if (await page.locator("[data-map-day]").count())
					await page.locator("[data-map-day]").first().click();
				await page.waitForTimeout(500);
				const dayBefore = await camera(),
					dayGeometry = await geometries();
				const dayDot = await visibleDot();
				await dayDot.tap();
				await page.waitForTimeout(150);
				await expect(panel).toBeVisible();
				assert.deepEqual(await camera(), dayBefore);
				assert.equal(await geometries(), dayGeometry);
				assert.equal(
					await page
						.locator(
							"[data-day-details-mobile]:visible,.tour-map-popup-desktop:visible",
						)
						.count(),
					0,
				);
				await closePanel();
				assert.equal(
					await page
						.locator(
							"[data-day-details-mobile]:visible,.tour-map-popup-desktop:visible",
						)
						.count(),
					0,
					"Closing a stop does not reopen the day sheet",
				);
				assert.ok(
					await page.evaluate(
						() => document.documentElement.scrollWidth <= innerWidth,
					),
				);
				cases.push({
					width,
					days: count,
					mode,
					totalVisits: total,
					groupChoiceCount: choiceCount,
					touch: true,
					keyboard: true,
					cameraUnchanged: true,
					geometryUnchanged: true,
				});
			}
		}
	}
	if (real) {
		for (const mode of ["map", "satellite"]) {
			await choose("real");
			await page.setViewportSize({ width: 390, height: 900 });
			await ready();
			await page.waitForTimeout(500);
			if (mode === "satellite") {
				await page
					.getByRole("button", { name: "Satélite", exact: true })
					.click();
				await ready();
			}
			await page.evaluate(() =>
				window.map.jumpTo({
					center: [-72.5432784, -13.165771],
					zoom: 14,
					bearing: 0,
				}),
			);
			await page.waitForTimeout(250);
			const control = page.getByRole("button", {
				name: /^Paradas cercanas: Machu Picchu Control/,
			});
			await expect(control).toHaveAttribute("data-secondary-count", "2");
			const prior = await camera();
			await control.tap();
			const panel = page.locator("[data-secondary-details]");
			await expect(panel).toBeVisible();
			await expect(panel.locator("[data-secondary-choice]")).toHaveCount(2);
			assert.deepEqual(await camera(), prior);
			await shot(`390-control-${mode}`);
			if (mode === "map") {
				await page
					.getByRole("button", { name: "Pantalla completa", exact: true })
					.click();
				await page.waitForFunction(() => document.fullscreenElement);
				await page.waitForTimeout(600);
				await expect(
					page.getByRole("button", { name: "Cerrar parada", exact: true }),
				).toBeVisible();
				await shot("390-stop-fullscreen");
				await page
					.getByRole("button", {
						name: "Salir de pantalla completa",
						exact: true,
					})
					.click();
				await page.waitForFunction(() => !document.fullscreenElement);
			}
			await closePanel();
		}
		cases.push({
			controlRepeatedVisits: 2,
			actualBusAndWalking: true,
			fullscreenControls: true,
		});
	}
	await choose("days15");
	await page.setViewportSize({ width: 390, height: 900 });
	await ready();
	await page.waitForTimeout(500);
	const regional = await page.locator("[data-secondary-marker]").count();
	await page.evaluate(() =>
		window.map.jumpTo({ center: [-72.396, -13.397], zoom: 14, bearing: 25 }),
	);
	// Wait for the debounced grouping after MapLibre settles, not a fixed frame budget.
	await expect
		.poll(async () =>
			page
				.locator("[data-secondary-marker]")
				.evaluateAll((es) => es.map((e) => Number(e.dataset.secondaryCount))),
		)
		.toContain(2);
	const closeGroups = await page
		.locator("[data-secondary-marker]")
		.evaluateAll((es) => es.map((e) => Number(e.dataset.secondaryCount)));
	assert.ok(
		closeGroups.includes(2),
		"Coincident visits stay independently selectable at close zoom",
	);
	await shot("390-close-zoom");
	cases.push({
		regionalGroups: regional,
		closeZoom: 14,
		coincidentVisitsPreserved: true,
	});

	assert.equal(
		await page.evaluate(() => JSON.stringify(window.data) === window.original),
		true,
		"Fixture data changed",
	);
	assert.deepEqual(errors, []);
	assert.deepEqual(blocked, []);
	const report = {
		result: "PASS",
		realBasemaps: real,
		fixtureSource: snapshotPath ?? "standalone synthetic fixtures",
		topographicFallback: topo,
		tiles,
		cases,
		errors,
		networkFailures,
		readOnly: true,
		fixturesUnchanged: true,
		limitations: real
			? Object.entries(tiles)
					.filter(([, n]) => n === 0)
					.map(([mode]) => "No successful real tiles: " + mode)
			: [
					"Offline matrix uses local light/dark styles; not real satellite imagery.",
				],
	};
	await writeFile(
		path.join(evidence, "results.json"),
		JSON.stringify(report, null, 2),
	);
	console.log(JSON.stringify(report, null, 2));
} finally {
	await browser?.close();
	await new Promise((r) => server.close(r));
}
