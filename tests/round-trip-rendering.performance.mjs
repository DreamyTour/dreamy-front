/** Camera benchmark: node tests/round-trip-rendering.performance.mjs <checkout> <report.json>.
 * Requires the local original 1431-point railway GPX in artifacts; never writes it.
 * Run checkouts sequentially without other workloads. Three warmed passes per case.
 */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { build } from "esbuild";

const root = path.resolve(process.argv[2] || process.cwd());
const publishedItinerary = process.argv.includes("--published-itinerary");
const publishedStops = publishedItinerary
	? JSON.parse(
			await readFile(
				path.join(
					process.cwd(),
					"artifacts/railway-review-2026-11-14/public-map-stops.json",
				),
				"utf8",
			),
		).mapStops
	: null;
const initialZoom = publishedItinerary ? 9 : 10.5;
const initialCenter = publishedItinerary
	? [-72.25, -13.34]
	: [-72.3975, -13.2095];
const views = process.argv[4]
	? process.argv[4].split(",")
	: ["full", "day1", "day2", "multi"];
const motions = process.argv[5]
	? process.argv[5].split(",")
	: ["rotate", "zoom", "pan"];
assert.ok(
	views.length &&
		views.every((view) => ["full", "day1", "day2", "multi"].includes(view)),
);
assert.ok(
	motions.length &&
		motions.every((motion) => ["rotate", "zoom", "pan"].includes(motion)),
);
const evidence = path.join(
	process.cwd(),
	"artifacts/round-trip-rendering/final-review",
);
await mkdir(evidence, { recursive: true });
const xml = await readFile(
	path.join(
		process.cwd(),
		"artifacts/ollantaytambo-aguas-calientes-tren/ollantaytambo-aguas-calientes-tren.gpx",
	),
	"utf8",
);
const forward = [...xml.matchAll(/<trkpt lat="([^"]+)" lon="([^"]+)"/g)].map(
	(m) => [+m[2], +m[1]],
);
assert.equal(forward.length, 1431);
const place = (label, coordinates) => ({ label, coordinates });
const start = place("Ollantaytambo", forward[0]);
const end = place("Aguas Calientes", forward.at(-1));
const makeStops = (mode = "train", variant = false) => [
	{
		id: 1,
		order: 1,
		title: "DÃ­a 1 Â· ida",
		routePlan: {
			version: 1,
			start,
			legs: [
				{
					id: "out",
					mode,
					destination: end,
					geometry: forward,
					geometryMeta: { source: "gpx", status: "valid" },
				},
			],
		},
	},
	{
		id: 2,
		order: 2,
		title: "DÃ­a 2 Â· regreso",
		routePlan: {
			version: 1,
			start: end,
			legs: [
				{
					id: "back",
					mode,
					destination: start,
					geometry: [...forward]
						.reverse()
						.map((p, i) => (variant && i === 30 ? [p[0] + 0.001, p[1]] : p)),
					geometryMeta: { source: "gpx", status: "valid" },
				},
			],
		},
	},
];
const bundles = {};
const server = createServer((request, response) => {
	const url = new URL(request.url, "http://fixture");
	if (url.pathname === "/api/tour-route") {
		response.statusCode = 503;
		response.setHeader("Content-Type", "application/json");
		return response.end(
			JSON.stringify({
				error: "Saved geometry unavailable in read-only fixture",
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
		'<!doctype html><html lang="es"><meta charset="utf-8"><link rel="stylesheet" href="/app.css"><style>body{margin:0;font:16px sans-serif}.tour-map-tab{max-width:1100px}.tour-map-tab>.isolate{height:560px!important}@media(max-width:600px){.tour-map-tab>.isolate{height:430px!important}}</style><div id="root"></div><script type="module" src="/app.js"></script></html>',
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
import React,{useState}from'react';import{createRoot}from'react-dom/client';import MapTab from'./src/components/tours/MapTab';import Editor from './src/components/tours/RoutePlanEditor';
const fixtures=${JSON.stringify({
				train: publishedStops ?? makeStops(),
				bus: makeStops("bus"),
				boat: makeStops("boat"),
				variant: makeStops("train", true),
				multi: Array.from({ length: 4 }, (_, n) =>
					makeStops().map((stop, i) => {
						const s = structuredClone(stop);
						s.id = n * 2 + i + 1;
						s.order = s.id;
						const shift = (p) => [p[0], p[1] + n * 0.025];
						s.routePlan.start.coordinates = shift(
							s.routePlan.start.coordinates,
						);
						s.routePlan.legs[0].destination.coordinates = shift(
							s.routePlan.legs[0].destination.coordinates,
						);
						s.routePlan.legs[0].geometry =
							s.routePlan.legs[0].geometry.map(shift);
						s.routePlan.legs[0].id += n;
						return s;
					}),
				).flat(),
			})};
// Capture the MapLibre constructor through the public ref exposed by the fixture-only module adapter.
window.fixtureOriginal=JSON.stringify(fixtures);window.fixtureChanges=[];window.addEventListener('message',e=>{if(e.data?.type==='dreamy-route-change')window.fixtureChanges.push(e.data)});
function App(){const [name,setName]=useState('train');window.chooseFixture=setName;window.fixtureData=fixtures;return name==='editor'?<Editor cmsOrigin={location.origin}/>:<MapTab key={name} lang="es" mapStops={fixtures[name]}/>};createRoot(document.getElementById('root')).render(<App/>);`,
		},
		plugins: [
			{
				name: "local-map-fixture",
				setup(b) {
					b.onLoad(
						{ filter: /(?:RoundTripRoutes|RailwayRoutes)\.tsx$/ },
						async (args) => {
							let contents = await readFile(args.path, "utf8");
							contents = contents.replace(
								"const { map, isLoaded } = useMap();",
								"window.rtStats ??= {renders:0,pairs:0,features:0}; window.rtStats.renders++; const { map, isLoaded } = useMap();",
							);
							return {
								contents,
								loader: "tsx",
								resolveDir: path.dirname(args.path),
							};
						},
					);
					b.onLoad({ filter: /tour-railway\.ts$/ }, async (args) => {
						let contents = await readFile(args.path, "utf8");
						contents = contents.replace(
							'const features: FeatureCollection<LineString>["features"] = [];',
							'if(window.rtStats)window.rtStats.features++; const features: FeatureCollection<LineString>["features"] = [];',
						);
						return {
							contents,
							loader: "ts",
							resolveDir: path.dirname(args.path),
						};
					});
					b.onLoad({ filter: /tour-round-trip\.ts$/ }, async (args) => {
						let contents = await readFile(args.path, "utf8");
						contents = contents
							.replace(
								"const pairs: Record<string, RoundTripDirection> = {};",
								"if(window.rtStats)window.rtStats.pairs++; const pairs: Record<string, RoundTripDirection> = {};",
							)
							.replace(
								"if (!segments.length) return",
								"if(window.rtStats)window.rtStats.features++; if (!segments.length) return",
							);
						return {
							contents,
							loader: "ts",
							resolveDir: path.dirname(args.path),
						};
					});
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
								"window.fixtureMap = map; window.fixtureMapErrors ??= []; map.on('error', event => window.fixtureMapErrors.push(event.error?.message)); setMapInstance(map);",
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
		viewport: process.argv.includes("--mobile")
			? { width: 390, height: 844 }
			: { width: 1100, height: 1100 },
		hasTouch: process.argv.includes("--mobile"),
	});
	page.setDefaultTimeout(10000);
	const errors = [],
		external = [];
	page.on("pageerror", (error) => errors.push(error.message));
	await page.route("**/*", (route) => {
		if (
			publishedItinerary &&
			new URL(route.request().url()).hostname === "cdn.dreamy.tours"
		) {
			return route.fulfill({
				status: 200,
				contentType: "image/png",
				body: Buffer.from(
					"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jGDkAAAAASUVORK5CYII=",
					"base64",
				),
			});
		}
		if (new URL(route.request().url()).origin === origin)
			return route.continue();
		external.push(route.request().url());
		return route.abort();
	});
	await page.goto(origin);

	await page.waitForFunction(() => window.fixtureMap?.isStyleLoaded());
	const measurements = [];
	for (const view of views) {
		await page.evaluate(
			(v) => window.chooseFixture(v === "multi" ? "multi" : "train"),
			view,
		);
		await page.waitForTimeout(100);
		await page.waitForFunction(
			() =>
				window.fixtureMap?.getCanvas().isConnected &&
				window.fixtureMap.isStyleLoaded(),
		);
		await page.waitForTimeout(650);
		if (view.startsWith("day")) {
			const marker = page.getByRole("button", {
				name: new RegExp(`^Ver detalles de D.A: 0${view.at(-1)}$`),
			});
			if (await marker.count()) await marker.press("Enter");
			else
				await page
					.getByRole("button", { name: new RegExp(`^D.A: 0${view.at(-1)}`) })
					.click();
			await page.waitForTimeout(650);
		}
		if (process.argv.includes("--expanded") && view.startsWith("day")) {
			const details = page.getByRole("button", {
				name: "Ver detalles",
				exact: true,
			});
			if (await details.count()) await details.click();
			await page.waitForTimeout(400);
		}

		for (const motion of motions) {
			const passes = [];
			for (let pass = 0; pass < 3; pass++) {
				const stats = await page.evaluate(
					async ({ motion, initialZoom, initialCenter }) => {
						const m = window.fixtureMap;
						m.stop();
						m.jumpTo({ zoom: initialZoom, bearing: 0, center: initialCenter });
						await new Promise((r) => setTimeout(r, 400));
						window.rtStats = { renders: 0, pairs: 0, features: 0 };
						const calls = {};
						const originals = [];
						for (const name of [
							"project",
							"addLayer",
							"removeLayer",
							"addSource",
							"removeSource",
							"setPaintProperty",
							"setLayoutProperty",
						]) {
							const original = m[name];
							originals.push(() => (m[name] = original));
							m[name] = function (...args) {
								calls[name] = (calls[name] || 0) + 1;
								return original.apply(this, args);
							};
						}
						for (const id of Object.keys(m.getStyle().sources)) {
							const obj = m.getSource(id);
							if (!obj.setData) continue;
							const original = obj.setData;
							originals.push(() => (obj.setData = original));
							obj.setData = function (...args) {
								calls.setData = (calls.setData || 0) + 1;
								return original.apply(this, args);
							};
						}
						const intervals = [];
						let last = performance.now();
						for (let i = 0; i < 80; i++) {
							if (motion === "rotate") m.jumpTo({ bearing: i * 2 });
							if (motion === "zoom")
								m.jumpTo({ zoom: initialZoom + 0.4 * Math.sin(i / 15) });
							if (motion === "pan")
								m.jumpTo({
									center: [
										initialCenter[0] + 0.025 * Math.sin(i / 15),
										initialCenter[1] + 0.015 * Math.cos(i / 15),
									],
								});
							await new Promise(requestAnimationFrame);
							const now = performance.now();
							if (i >= 20) intervals.push(now - last);
							last = now;
						}
						for (const restore of originals) restore();
						const sorted = [...intervals].sort((a, b) => a - b);
						return {
							median: sorted[30],
							p95: sorted[57],
							max: sorted.at(-1),
							samples: sorted.length,
							intervals,
							calls,
							derived: window.rtStats,
						};
					},
					{ motion, initialZoom, initialCenter },
				);
				passes.push(stats);
			}
			const sorted = passes.flatMap((p) => p.intervals).sort((a, b) => a - b);
			const entry = {
				view,
				motion,
				median: sorted[90],
				p95: sorted[171],
				passes,
			};
			measurements.push(entry);
			console.log(
				JSON.stringify({
					root,
					view,
					motion,
					median: entry.median,
					p95: entry.p95,
					passes: passes.map((p) => [p.median, p.p95]),
				}),
			);
			await writeFile(
				path.join(evidence, process.argv[3] || "performance-comparable.json"),
				JSON.stringify(
					{
						root,
						browser: browser.version(),
						viewport: process.argv.includes("--mobile")
							? { width: 390, height: 844 }
							: { width: 1100, height: 1100 },
						hasTouch: process.argv.includes("--mobile"),
						zoom: initialZoom,
						publishedItinerary,
						pointsPerRoute: 1431,
						multiRoutes: 8,
						warmupFrames: 20,
						samplesPerPass: 60,
						measurements,
					},
					null,
					2,
				),
			);
		}
	}
	assert.deepEqual(await page.evaluate(() => window.fixtureMapErrors), []);
	assert.deepEqual(errors, []);
	assert.deepEqual(external, []);
	for (const result of measurements)
		for (const pass of result.passes) {
			assert.deepEqual(
				pass.derived,
				{ renders: 0, pairs: 0, features: 0 },
				`No application geometry work during ${result.view}/${result.motion}`,
			);
			assert.ok(
				Object.entries(pass.calls).every(
					([name, count]) => name === "project" || count === 0,
				),
				`No source/layer/property updates during camera movement: ${JSON.stringify(pass.calls)}`,
			);
		}
	await writeFile(
		path.join(evidence, process.argv[3] || "performance-comparable.json"),
		JSON.stringify(
			{
				root,
				browser: browser.version(),
				viewport: process.argv.includes("--mobile")
					? { width: 390, height: 844 }
					: { width: 1100, height: 1100 },
				hasTouch: process.argv.includes("--mobile"),
				zoom: initialZoom,
				publishedItinerary,
				pointsPerRoute: 1431,
				multiRoutes: 8,
				warmupFrames: 20,
				samplesPerPass: 60,
				measurements,
			},
			null,
			2,
		),
	);
} finally {
	await browser?.close();
	await new Promise((resolve) => server.close(resolve));
}
