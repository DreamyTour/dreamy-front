/** Real TourTabs/MapLibre touch regression. Local data; optional public basemap GETs only. */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { build } from "esbuild";

const root = path.resolve(process.argv[2] || process.cwd());
const phase = process.argv[3] || "current";
const realBasemaps = process.argv.includes("--real-basemaps");
const evidence = path.join(
	process.cwd(),
	"artifacts/mobile-map-2026-11-16",
	phase,
);
await mkdir(evidence, { recursive: true });
const snapshot = JSON.parse(
	await readFile(
		path.join(
			process.cwd(),
			"artifacts/railway-review-2026-11-14/public-map-stops.json",
		),
		"utf8",
	),
);
const realStops = snapshot.mapStops;
const geometries = realStops.map(
	(stop) => stop.routePlan.legs.find((leg) => leg.mode === "train").geometry,
);
assert.equal(geometries[0].length, 1431);
assert.equal(geometries[1].length, 1431);
assert.deepEqual(geometries[0], [...geometries[1]].reverse());
const fixtureOriginal = JSON.stringify(realStops);
const topo = process.argv.includes("--topo");
const bundles = {};
const server = createServer((request, response) => {
	const url = new URL(request.url, "http://fixture");
	if (url.pathname === "/api/tour-route") {
		response.statusCode = 503;
		response.setHeader("Content-Type", "application/json");
		return response.end(
			JSON.stringify({
				error:
					"No saved geometry; automatic routing deliberately unavailable in this read-only fixture",
			}),
		);
	}
	if (bundles[url.pathname]) {
		response.setHeader(
			"Content-Type",
			url.pathname.endsWith(".css") ? "text/css" : "text/javascript",
		);
		return response.end(bundles[url.pathname]);
	}
	response.setHeader("Content-Type", "text/html; charset=utf-8");
	response.end(
		'<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"><style>body{margin:0;font:16px sans-serif}.tour-map-tab{max-width:1100px}</style><div id="root"></div><script type="module" src="/app.js"></script></html>',
	);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
	const result = await build({
		bundle: true,
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
			contents: `
import React,{useState}from'react';import{createRoot}from'react-dom/client';import MapTab from'./src/components/tours/MapTab';import TourTabs from './src/components/tours/TourTabs';import Editor from './src/components/tours/RoutePlanEditor';
const fixtures={real:${JSON.stringify(realStops)}};
// Capture the MapLibre constructor through the public ref exposed by the fixture-only module adapter.
window.fixtureOriginal=JSON.stringify(fixtures.real);window.fixtureChanges=[];window.addEventListener('message',e=>{if(e.data?.type==='dreamy-route-change')window.fixtureChanges.push(e.data)});
window.fixtureData=fixtures;function App(){return <><div style={{height:150}}>Local product fixture</div><TourTabs tour={{tab:{maps:{mapstops:fixtures.real}}}} lang="es"><form aria-label="Booking fixture"><label>Name<input name="name" defaultValue="unchanged"/></label><button type="button">Reserve fixture</button></form></TourTabs><div style={{height:1000}}>Page end</div></>};createRoot(document.getElementById('root')).render(<App/>);`,
		},
		plugins: [
			{
				name: "local-map-fixture",
				setup(b) {
					if (topo) {
						b.onResolve({ filter: /^@\/lib\/tour-map-styles$/ }, () => ({
							path: "topo",
							namespace: "topo",
						}));
						b.onLoad({ filter: /.*/, namespace: "topo" }, () => ({
							contents: `import {tourMapStyles as base} from ${JSON.stringify(path.join(root, "src/lib/tour-map-styles.ts").replaceAll("\\", "/"))};export const tourMapStyles={...base,map:{version:8,sources:{topo:{type:"raster",tiles:["https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"],tileSize:256,attribution:"Tiles &copy; Esri World Topographic Map"}},layers:[{id:"topography",type:"raster",source:"topo"}]}};`,
							loader: "js",
							resolveDir: root,
						}));
					}
					if (!realBasemaps && !topo)
						b.onResolve({ filter: /^@\/lib\/tour-map-styles$/ }, () => ({
							path: "styles",
							namespace: "fixture",
						}));
					b.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
						contents: `export const tourMapStyles={map:{version:8,sources:{},layers:[{id:'bg',type:'background',paint:{'background-color':'#eef1e8'}}]},satellite:{version:8,sources:{},layers:[{id:'bg',type:'background',paint:{'background-color':'#233e39'}}]}};`,
						loader: "js",
					}));
					// Only inject a reference for assertions, keep the real renderer and MapLibre.
					b.onLoad(
						{ filter: /components[\\/]ui[\\/]map\.tsx$/ },
						async (args) => {
							const fs = await import("node:fs/promises");
							let contents = await fs.readFile(args.path, "utf8");
							contents = contents.replace(
								"setMapInstance(map);",
								"window.fixtureMaps ??= []; window.fixtureMaps.push(map); Object.defineProperty(window, 'fixtureMap', {configurable:true,get:()=>window.fixtureMaps.findLast(m=>m.getCanvas().isConnected && m.getContainer().getBoundingClientRect().width>0)??map}); window.fixtureMapErrors ??= []; map.on('error', event => window.fixtureMapErrors.push(event.error?.message)); setMapInstance(map);",
							);
							if (!contents.includes("window.fixtureMap"))
								throw Error("Map capture boundary changed");
							return {
								contents,
								loader: "tsx",
								resolveDir: path.dirname(args.path),
							};
						},
					);
				},
			},
		],
		logLevel: "silent",
	});
	for (const file of result.outputFiles)
		bundles[file.path.endsWith(".css") ? "/app.css" : "/app.js"] = file.text;
	const css = await compile(
		await readFile(path.join(root, "src/styles/global.css"), "utf8"),
		{
			base: path.join(root, "src/styles"),
			onDependency() {},
		},
	);
	const candidates = new Scanner({
		sources: [
			{ base: root, pattern: "src/**/*.{tsx,ts,astro}", negated: false },
		],
	}).scan();
	bundles["/app.css"] += css.build(candidates);
	browser = await chromium.launch({
		headless: true,
		args: [
			"--use-gl=angle",
			"--use-angle=swiftshader",
			"--enable-unsafe-swiftshader",
		],
	});
	const page = await browser.newPage({
		viewport: { width: 390, height: 844 },
		hasTouch: true,
		isMobile: true,
	});
	page.setDefaultTimeout(30000);
	const basemapResponses = { map: 0, satellite: 0, topo: 0, images: 0 };
	page.on("response", (response) => {
		if (response.status() !== 200) return;
		const url = response.url();
		if (url.includes("/World_Imagery/") && url.includes("/tile/"))
			basemapResponses.satellite++;
		if (url.includes("/World_Topo_Map/") && url.includes("/tile/"))
			basemapResponses.topo++;
		if (url.includes("cdn.dreamy.tours/")) basemapResponses.images++;
		if (url.includes("basemaps.cartocdn.com/") && !url.endsWith(".json"))
			basemapResponses.map++;
	});
	const errors = [],
		external = [];
	page.on("pageerror", (error) => errors.push(error.message));
	await page.route("**/*", (route) => {
		if (route.request().method() !== "GET") {
			external.push(`Blocked ${route.request().method()}`);
			return route.abort();
		}
		if (
			new URL(route.request().url()).origin === origin ||
			(realBasemaps &&
				/^(basemaps.cartocdn.com|[a-d]\.basemaps.cartocdn.com|tiles.basemaps.cartocdn.com|services.arcgisonline.com|cdn.dreamy.tours)$/.test(
					new URL(route.request().url()).hostname,
				))
		)
			return route.continue();
		external.push(route.request().url());
		return route.abort();
	});
	await page.goto(origin);
	const results = [];
	const accordion = page.locator("[data-tour-mobile-map]");
	await accordion.locator("summary").tap();
	await page.waitForFunction(() => window.fixtureMap?.isStyleLoaded());
	await page.waitForTimeout(1200);
	const cdp = await page.context().newCDPSession(page);
	async function gesture(points, moves) {
		await cdp.send("Input.dispatchTouchEvent", {
			type: "touchStart",
			touchPoints: points,
		});
		for (let i = 1; i <= 12; i++) {
			await cdp.send("Input.dispatchTouchEvent", {
				type: "touchMove",
				touchPoints: points.map((p, j) => ({
					...p,
					x: p.x + (moves[j][0] * i) / 12,
					y: p.y + (moves[j][1] * i) / 12,
				})),
			});
			await page.waitForTimeout(20);
		}
		await cdp.send("Input.dispatchTouchEvent", {
			type: "touchEnd",
			touchPoints: [],
		});
		await page.waitForTimeout(500);
	}
	for (const width of process.argv.includes("--presentation")
		? [390]
		: process.argv.includes("--desktop-only")
			? [768, 1280]
			: [320, 375, 390, 768, 1280]) {
		await page.setViewportSize({ width, height: 900 });
		if (width >= 1024) {
			await page.getByRole("tab", { name: "Mapa", exact: true }).click();
			await page.waitForFunction(() => window.fixtureMap?.isStyleLoaded());
		}
		await page.locator("[data-map-viewport]:visible").scrollIntoViewIfNeeded();
		await page.waitForTimeout(1000);
		const mobile = width < 768;
		assert.ok(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= innerWidth,
			),
			"No horizontal overflow",
		);
		if (mobile) {
			assert.equal(
				await page.locator(".tour-map-stops-scroll:visible").count(),
				0,
			);
			assert.equal(
				await page
					.getByRole("button", { name: "Explora el recorrido", exact: true })
					.filter({ visible: true })
					.count(),
				0,
			);
		}
		for (const day of [1, 2]) {
			const pin = page
				.locator("[data-map-viewport]:visible [data-day-marker]")
				.filter({
					has: page.locator("span", { hasText: String(day).padStart(2, "0") }),
				});
			await pin.first().tap();
			await page.waitForTimeout(900);
			if (mobile) {
				const sheet = page.locator("[data-day-details-mobile]:visible");
				await sheet.waitFor();
				await page
					.locator("[data-map-viewport]:visible")
					.scrollIntoViewIfNeeded();
				await page.screenshot({
					path: path.join(evidence, `${width}-${day}-pin-check.png`),
				});
				assert.ok(
					await pin.first().evaluate((el) => {
						const r = el.getBoundingClientRect();
						return el.contains(
							document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2),
						);
					}),
					"Selected pin remains tappable",
				);
				assert.equal(await sheet.locator("img").count(), 0, "No compact image");
				const b = await sheet.boundingBox(),
					m = await page.locator("[data-map-viewport]:visible").boundingBox();
				assert.ok(
					b.x >= m.x &&
						b.y >= m.y &&
						b.x + b.width <= m.x + m.width + 1 &&
						b.y + b.height <= m.y + m.height,
					"Sheet inside map",
				);
				await sheet
					.getByRole("button", { name: "Ver detalles", exact: true })
					.tap();
				assert.equal(
					await sheet
						.getByRole("button", { name: "Ocultar detalles", exact: true })
						.getAttribute("aria-expanded"),
					"true",
				);
				await page.waitForTimeout(400);
				const expandedBox = await sheet.boundingBox(),
					mapBox = await page
						.locator("[data-map-viewport]:visible")
						.boundingBox();
				assert.ok(
					expandedBox.height <= mapBox.height * 0.65 + 1,
					"Expanded sheet capped at 65%",
				);
				await sheet.locator("[data-day-sheet-scroll]").evaluate((el) => {
					el.scrollTop = el.scrollHeight;
				});
				const close = sheet.getByRole("button", {
					name: "Cerrar detalles",
					exact: true,
				});
				assert.ok(
					await close.evaluate((el) => {
						const r = el.getBoundingClientRect();
						return el.contains(
							document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2),
						);
					}),
					"Close accessible after inner scroll",
				);
				assert.ok(
					await pin.first().evaluate((el) => {
						const r = el.getBoundingClientRect();
						return el.contains(
							document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2),
						);
					}),
					"Expanded sheet does not cover selected pin",
				);
				await page.locator("[data-map-viewport]:visible").screenshot({
					path: path.join(evidence, `${width}-day-${day}-expanded-map.png`),
				});
				await page
					.getByRole("button", { name: "Pantalla completa", exact: true })
					.tap();
				await page.waitForTimeout(800);
				await page.locator("[data-map-viewport]:visible").screenshot({
					path: path.join(
						evidence,
						`${width}-day-${day}-expanded-fullscreen.png`,
					),
				});
				assert.ok(await close.isVisible());
				await page
					.getByRole("button", {
						name: "Salir de pantalla completa",
						exact: true,
					})
					.tap();
				await page.waitForTimeout(500);

				if (process.argv.includes("--presentation")) {
					const photo = sheet.locator("img");
					if (await photo.count()) {
						await photo.scrollIntoViewIfNeeded();
						await photo.evaluate((img) => {
							img.loading = "eager";
						});
						await page.waitForFunction(() =>
							[
								...document.querySelectorAll("[data-day-details-mobile] img"),
							].every((img) => img.naturalWidth > 0),
						);
					}
				}
				await page.screenshot({
					path: path.join(evidence, `${width}-day-${day}-details.png`),
					fullPage: true,
				});
				await sheet
					.getByRole("button", { name: "Ocultar detalles", exact: true })
					.tap();
				await page.screenshot({
					path: path.join(evidence, `${width}-day-${day}-compact.png`),
					fullPage: true,
				});
				await page.evaluate(() => window.fixtureMap.stop());
				const beforeClose = await page.evaluate(() => ({
					center: window.fixtureMap.getCenter().toArray(),
					zoom: window.fixtureMap.getZoom(),
					bearing: window.fixtureMap.getBearing(),
				}));
				await sheet
					.getByRole("button", { name: "Cerrar detalles", exact: true })
					.tap();
				await page.waitForTimeout(250);
				assert.deepEqual(
					await page.evaluate(() => ({
						center: window.fixtureMap.getCenter().toArray(),
						zoom: window.fixtureMap.getZoom(),
						bearing: window.fixtureMap.getBearing(),
					})),
					beforeClose,
					"Closing preserves camera",
				);
			} else {
				await page.screenshot({
					path: path.join(evidence, `${width}-day-${day}-desktop.png`),
					fullPage: true,
				});
				await page
					.locator("[data-map-viewport]:visible")
					.click({ position: { x: 30, y: 300 } });
			}
		}
		if (mobile) {
			await page
				.locator("[data-map-viewport]:visible")
				.scrollIntoViewIfNeeded();
			const b = await page
				.locator("[data-map-viewport]:visible canvas")
				.boundingBox();
			const x = b.x + b.width / 2,
				y = b.y + 150;
			const beforeScroll = await page.evaluate(() => scrollY);
			await gesture([{ x, y, id: 1 }], [[0, -100]]);
			assert.ok(
				(await page.evaluate(() => scrollY)) > beforeScroll,
				"Page scroll works with cooperative gestures",
			);
			await page
				.locator("[data-map-viewport]:visible")
				.scrollIntoViewIfNeeded();
			// Let the preceding native page-scroll inertia settle before a toolbar tap.
			await page.waitForTimeout(1000);
			await page
				.getByRole("button", { name: "Explorar mapa", exact: true })
				.tap();
			await page.waitForFunction(
				() => !window.fixtureMap.cooperativeGestures.isEnabled(),
			);
			await page.waitForTimeout(250);
			await page.evaluate(() => window.fixtureMap.stop());
			const center = await page.evaluate(() =>
				window.fixtureMap.getCenter().toArray(),
			);
			const c = await page
				.locator("[data-map-viewport]:visible canvas")
				.boundingBox();
			await gesture([{ x: c.x + c.width / 2, y: c.y + 150, id: 1 }], [[65, 0]]);
			assert.notDeepEqual(
				await page.evaluate(() => window.fixtureMap.getCenter().toArray()),
				center,
				"One-finger map pan when active",
			);
			const zoom = await page.evaluate(() => window.fixtureMap.getZoom());
			await gesture(
				[
					{ x: c.x + 100, y: c.y + 180, id: 1 },
					{ x: c.x + 200, y: c.y + 180, id: 2 },
				],
				[
					[-30, 0],
					[30, 0],
				],
			);
			assert.ok(
				Math.abs(
					(await page.evaluate(() => window.fixtureMap.getZoom())) - zoom,
				) > 0.05,
				"Native touch pinch zoom",
			);
			await page
				.getByRole("button", { name: "Volver al scroll", exact: true })
				.tap();
			await page
				.getByRole("button", { name: "Pantalla completa", exact: true })
				.tap();
			await page.waitForTimeout(400);
			assert.ok(await page.evaluate(() => !!document.fullscreenElement));
			await page.screenshot({
				path: path.join(evidence, `${width}-fullscreen.png`),
			});
			await page
				.getByRole("button", {
					name: "Salir de pantalla completa",
					exact: true,
				})
				.tap();
			await page.getByRole("button", { name: "Satélite", exact: true }).tap();
			await page.waitForTimeout(1800);
			await page.screenshot({
				path: path.join(evidence, `${width}-satellite.png`),
				fullPage: true,
			});
			await page.getByRole("button", { name: "Mapa", exact: true }).tap();
			await page.waitForFunction(() => window.fixtureMap.isStyleLoaded());
			const tree = await accordion.ariaSnapshot();
			assert.ok(tree.includes("Mapa"), "Accessible accordion name");
			await page
				.locator("[data-map-viewport]:visible [data-day-marker]")
				.first()
				.focus();
			await page.keyboard.press("Enter");
			await page.locator("[data-day-details-mobile]:visible").waitFor();
			await page
				.getByRole("button", { name: "Ver detalles", exact: true })
				.focus();
			await page.keyboard.press("Enter");
			await page.keyboard.press("Escape");
		}
		await page.waitForFunction(() => window.fixtureMap?.isStyleLoaded());
		await page.screenshot({
			path: path.join(evidence, `${width}-end.png`),
			fullPage: true,
		});
		assert.ok(
			(await page.locator(".maplibregl-ctrl-attrib:visible").count()) > 0,
			"Legal attribution accessible",
		);
		results.push({
			width,
			gestures: mobile
				? "native CDP touch pan/pinch/scroll/fullscreen PASS"
				: "desktop controls PASS",
		});
	}
	assert.equal(
		await page.locator('input[name="name"]:visible').inputValue(),
		"unchanged",
	);
	assert.equal(
		await page.evaluate(() => JSON.stringify(window.fixtureData.real)),
		fixtureOriginal,
	);
	assert.deepEqual(errors, []);
	assert.deepEqual(await page.evaluate(() => window.fixtureChanges), []);
	await writeFile(
		path.join(evidence, "results.json"),
		JSON.stringify(
			{
				result: "PASS",
				results,
				basemapResponses,
				screenReader: "ARIA tree checked; manual screen reader pending",
			},
			null,
			2,
		),
	);
	console.log(
		JSON.stringify({ result: "PASS", results, basemapResponses }, null, 2),
	);
} finally {
	await browser?.close();
	await new Promise((resolve) => server.close(resolve));
}
