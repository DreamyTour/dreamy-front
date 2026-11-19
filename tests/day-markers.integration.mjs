/** Real MapLibre marker presentation; isolated fixtures and optional public basemap GETs.
 * Standalone: node tests/day-markers.integration.mjs
 * Real basemaps: add --real-basemaps; optional read-only tour input: --snapshot=/path/to/snapshot.json
 * Optional before/after comparison: --before-source=/path/to/MapTab.tsx
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
	beforeSource = process.argv
		.find((arg) => arg.startsWith("--before-source="))
		?.slice("--before-source=".length),
	before = Boolean(beforeSource),
	real = process.argv.includes("--real-basemaps"),
	topo = process.argv.includes("--topo");
const evidence = path.join(
	root,
	"artifacts/day-markers-2026-11-17",
	`${before ? "before" : "after"}-${real ? (topo ? "real-topo" : "real") : "isolated"}`,
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
		const point = [-72.65 + (i % 5) * 0.2, -13.65 + Math.floor(i / 5) * 0.2];
		return {
			id: i + 1,
			order: i + 1,
			title: `Destino ${String(i + 1).padStart(2, "0")}`,
			description:
				"Descripción breve del día para comprobar la ficha existente.",
			routePlan: {
				version: 1,
				start: { label: "Destino " + (i + 1), coordinates: point },
				legs: [],
			},
		};
	});
	fixtures["group" + count] = fixtures["days" + count].map((s) => ({
		...s,
		routePlan: {
			...s.routePlan,
			start: { label: s.routePlan.start.label, coordinates: [-72.3, -13.4] },
		},
	}));
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
		'<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Marcadores: prueba local</title><link rel="stylesheet" href="/app.css"><style>body{margin:0}.tour-map-tab{max-width:1100px}</style><div id="root"></div><script type="module" src="/app.js"></script></html>',
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
			contents: `import React,{useState}from'react';import{createRoot}from'react-dom/client';import MapTab from'./src/components/tours/MapTab';window.data=${JSON.stringify(fixtures)};window.original=JSON.stringify(window.data);function App(){const[name,setName]=useState('real');window.choose=setName;return <MapTab key={name} lang="es" mapStops={window.data[name]}/>};createRoot(document.getElementById('root')).render(<App/>);`,
		},
		plugins: [
			{
				name: "marker-evidence",
				setup(b) {
					if (before)
						b.onLoad({ filter: /tours[\\/]MapTab\.tsx$/ }, async (args) => ({
							contents: await readFile(path.resolve(beforeSource), "utf8"),
							loader: "tsx",
							resolveDir: path.dirname(args.path),
						}));
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
					...(beforeSource
						? [
								{
									base: path.dirname(path.resolve(beforeSource)),
									pattern: path.basename(beforeSource),
									negated: false,
								},
							]
						: []),
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
	if (process.argv.includes("--drag-only")) {
		await choose("days7");
		const row = page.locator(".tour-map-stops-scroll");
		await row.scrollIntoViewIfNeeded();
		const scroll = () => row.evaluate((element) => element.scrollLeft);
		const cards = row.locator("[data-map-day-card]");
		const box = await row.boundingBox();
		const prior = await camera();
		await page.mouse.move(box.x + 220, box.y + 60);
		await page.mouse.down();
		await page.mouse.move(box.x + 80, box.y + 60, { steps: 8 });
		await expect(row).toHaveAttribute("data-mouse-dragging", "true");
		await expect(cards.first()).toHaveCSS("cursor", "grabbing");
		await page.mouse.move(box.x - 25, box.y + 60, { steps: 4 });
		await page.mouse.up();
		assert.ok((await scroll()) >= 230, "Mouse drag continues outside the row");
		await expect(row).not.toHaveAttribute("data-mouse-dragging", "true");
		await expect(row.locator('[aria-pressed="true"]')).toHaveCount(0);
		await expect(page.locator(".tour-map-popup-desktop:visible")).toHaveCount(
			0,
		);
		assert.deepEqual(
			await camera(),
			prior,
			"Dragging cards must not move the map",
		);
		// Drag back in the opposite direction, then verify normal card activation.
		const left = await scroll();
		await page.mouse.move(box.x + 80, box.y + 70);
		await page.mouse.down();
		await page.mouse.move(box.x + 200, box.y + 70, { steps: 8 });
		await page.mouse.up();
		assert.ok((await scroll()) < left - 100, "Dragging right scrolls back");
		await cards.nth(1).click();
		await expect(cards.nth(1)).toHaveAttribute("aria-pressed", "true");
		await page
			.getByRole("button", { name: "Close popup", exact: true })
			.click();
		await cards.nth(5).focus();
		await cards.nth(5).press("Enter");
		await expect(cards.nth(5)).toHaveAttribute("aria-pressed", "true");
		await page
			.getByRole("button", { name: "Close popup", exact: true })
			.click();
		await row.evaluate((element) => {
			element.scrollLeft = 0;
		});
		// Touch gestures remain native; no mouse capture handler handles them.
		await row.dispatchEvent("pointerdown", {
			pointerType: "touch",
			pointerId: 90,
			button: 0,
			clientX: box.x + 200,
			clientY: box.y + 60,
		});
		await row.dispatchEvent("pointermove", {
			pointerType: "touch",
			pointerId: 90,
			buttons: 1,
			clientX: box.x + 40,
			clientY: box.y + 60,
		});
		assert.equal(await scroll(), 0);
		await row.dispatchEvent("pointercancel", {
			pointerType: "touch",
			pointerId: 90,
		});
		await page.mouse.move(box.x + 200, box.y + 60);
		await page.mouse.down();
		await page.mouse.move(box.x + 100, box.y + 60, { steps: 4 });
		await row.dispatchEvent("pointercancel");
		await page.mouse.up();
		await expect(row).not.toHaveAttribute("data-mouse-dragging", "true");
		cases.push({
			mouseDragBothDirections: true,
			pointerCapture: true,
			dragDoesNotSelect: true,
			clickAndKeyboardSelection: true,
			touchUntouched: true,
			pointerCancel: true,
		});
	}
	for (const width of process.argv.includes("--drag-only")
		? []
		: [1100, 320, 375, 390]) {
		await page.setViewportSize({ width, height: 900 });
		for (const count of real || before ? [2] : [2, 4, 7, 15]) {
			await choose("days" + count);
			// Keep marker geometry in a known, readable frame; no itinerary coordinates are changed.
			await page.evaluate(() =>
				window.map.fitBounds(
					[
						[-72.69, -13.72],
						[-71.8, -13.18],
					],
					{ padding: 20, duration: 0 },
				),
			);
			await ready();
			const pins = page.locator("[data-day-marker]");
			await expect.poll(() => pins.count()).toBe(count);
			if (!before) {
				assert.deepEqual(
					await pins.evaluateAll((es) =>
						es.map((e) => e.dataset.dayNumber).sort(),
					),
					Array.from({ length: count }, (_, i) =>
						String(i + 1).padStart(2, "0"),
					),
				);
				for (const pin of await pins.all()) {
					const box = await pin.boundingBox();
					assert.ok(box.width >= 48 && box.height >= 48);
					assert.ok(!/D[IÍ]A/.test(await pin.innerText()));
				}
			}
			await shot(`${width}-${count}-normal`);
			const pin = pins.first();
			await pin.focus();
			await expect(pin).toBeFocused();
			const prior = await camera();
			if (!before) {
				const tooltip = page.locator("[data-tour-marker-tooltip]");
				await expect(tooltip).toBeVisible();
				await expect(tooltip).toContainText(
					`Día 01: ${fixtures["days" + count][0].title}`,
				);
				await expect(tooltip).toHaveCSS("background-color", "rgb(0, 122, 50)");
				assert.deepEqual(await camera(), prior);
				await pin.press("Escape");
				await expect(tooltip).toHaveCount(0);
				await expect(pin).toBeFocused();
			}
			await pin.press("Enter");
			await page.waitForTimeout(450);
			if (!before) {
				assert.equal(
					(await camera()).zoom,
					prior.zoom,
					"Marker selection must preserve zoom",
				);
				assert.equal(await pin.getAttribute("aria-pressed"), "true");
				assert.equal(await pin.locator("[data-day-halo]").count(), 1);
			}
			await shot(`${width}-${count}-selected`);
			if (width < 768) {
				await page
					.locator("[data-day-details-mobile]")
					.getByRole("button", { name: "Cerrar detalles", exact: true })
					.click();
			} else
				await page
					.getByRole("button", { name: "Close popup", exact: true })
					.click();
			if (!before) {
				await page
					.getByRole("button", { name: "Satélite", exact: true })
					.click();
				await ready();
				await shot(`${width}-${count}-satellite-normal`);
				await pin.focus();
				await pin.press("Enter");
				await page.waitForTimeout(250);
				assert.equal(await pin.getAttribute("aria-pressed"), "true");
				assert.match(await pin.ariaSnapshot(), /button/);
				await shot(`${width}-${count}-satellite-selected`);
				if (width < 768)
					await page
						.locator("[data-day-details-mobile]")
						.getByRole("button", { name: "Cerrar detalles", exact: true })
						.click();
				else
					await page
						.getByRole("button", { name: "Close popup", exact: true })
						.click();
			}
			cases.push({
				width,
				count,
				normal: true,
				keyboardSelection: true,
				zoomPreserved: !before,
			});
		}
		await choose("group" + (real || before ? 2 : 15));
		await page.evaluate(() =>
			window.map.jumpTo({ center: [-72.3, -13.4], zoom: 9 }),
		);
		await ready();
		const group = page.locator("[data-day-marker]");
		if (!before) {
			assert.equal(await group.count(), 1);
			await group.tap();
			await expect(group).toHaveAttribute("aria-expanded", "true");
			const choices = page.locator("[data-map-day]");
			assert.equal(await choices.count(), real ? 2 : 15);
			await shot(`${width}-group-open`);
			const last = choices.last();
			await last.focus();
			await last.press("Space");
			await page.waitForTimeout(120);
			assert.equal(
				await group.getAttribute("data-day-number"),
				real ? "02" : "15",
			);
			await shot(`${width}-group-selected`);
		}
		await choose("real");
		await ready();
		await shot(`${width}-real-map`);
		await page.getByRole("button", { name: "Satélite", exact: true }).click();
		await ready();
		await shot(`${width}-real-satellite`);
		if (!before)
			assert.ok(
				await page.evaluate(
					() => document.documentElement.scrollWidth <= innerWidth,
				),
				"No horizontal page overflow",
			);
	}
	assert.equal(
		await page.evaluate(() => JSON.stringify(window.data) === window.original),
		true,
		"Fixture data changed",
	);
	assert.deepEqual(errors, []);
	assert.deepEqual(blocked, []);
	const report = {
		result: "PASS",
		before,
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
