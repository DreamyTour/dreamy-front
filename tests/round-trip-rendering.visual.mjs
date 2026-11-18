/** Real MapLibre + public MapTab in Chromium. Local fixture, no external requests. */
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
const evidence = path.join(process.cwd(), "artifacts/railway-design", phase);
await mkdir(evidence, { recursive: true });
const forward = Array.from({ length: 81 }, (_, i) => {
	const t = i / 80;
	return [
		-72.27 - 0.255 * t,
		-13.263 + 0.107 * t + 0.018 * Math.sin(t * Math.PI * 4),
	];
});
const place = (label, coordinates) => ({ label, coordinates });
const start = place("Ollantaytambo", forward[0]);
const end = place("Aguas Calientes", forward.at(-1));
const makeStops = (mode = "train", variant = false) => [
	{
		id: 1,
		order: 1,
		title: "Día 1 · ida",
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
		title: "Día 2 · regreso",
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
const horizontalStops = makeStops();
const horizontal = forward.map((_, i) => [
	forward[0][0] - 0.255 + (i * 0.255) / 80,
	forward[0][1],
]);
horizontalStops.forEach((stop, i) => {
	const coordinates = i ? [...horizontal].reverse() : horizontal;
	stop.routePlan.start = {
		...stop.routePlan.start,
		coordinates: coordinates[0],
	};
	stop.routePlan.legs[0].destination = {
		...stop.routePlan.legs[0].destination,
		coordinates: coordinates.at(-1),
	};
	stop.routePlan.legs[0].geometry = coordinates;
});
let realStops;
try {
	const files = [
		"ollantaytambo-aguas-calientes-tren",
		"aguas-calientes-ollantaytambo-tren",
	];
	const paths = await Promise.all(
		files.map((name) =>
			readFile(
				path.join(process.cwd(), "artifacts", name, `${name}.gpx`),
				"utf8",
			),
		),
	);
	const geometries = paths.map((xml) =>
		[...xml.matchAll(/<trkpt lat="([^"]+)" lon="([^"]+)"/g)].map((m) => [
			+m[2],
			+m[1],
		]),
	);
	assert.equal(geometries[0].length, 1431);
	assert.deepEqual(geometries[0], [...geometries[1]].reverse());
	realStops = structuredClone(makeStops());
	for (let i = 0; i < 2; i++) {
		realStops[i].routePlan.start.coordinates = geometries[i][0];
		realStops[i].routePlan.legs[0].destination.coordinates =
			geometries[i].at(-1);
		realStops[i].routePlan.legs[0].geometry = geometries[i];
	}
} catch (error) {
	if (error.code !== "ENOENT") throw error;
}
const bundles = {};
const server = createServer((request, response) => {
	const url = new URL(request.url, "http://fixture");
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
			contents: `
import React,{useState}from'react';import{createRoot}from'react-dom/client';import MapTab from'./src/components/tours/MapTab';import Editor from './src/components/tours/RoutePlanEditor';
const fixtures=${JSON.stringify({ train: makeStops(), horizontal: horizontalStops, bus: makeStops("bus"), boat: makeStops("boat"), variant: makeStops("train", true), ...(realStops ? { real: realStops } : {}) })};
// Capture the MapLibre constructor through the public ref exposed by the fixture-only module adapter.
window.fixtureOriginal=JSON.stringify(fixtures);window.fixtureChanges=[];window.addEventListener('message',e=>{if(e.data?.type==='dreamy-route-change')window.fixtureChanges.push(e.data)});
function App(){const [name,setName]=useState('train');window.chooseFixture=setName;window.fixtureData=fixtures;return name==='editor'?<Editor cmsOrigin={location.origin}/>:<MapTab key={name} lang="es" mapStops={fixtures[name]}/>};createRoot(document.getElementById('root')).render(<App/>);`,
		},
		plugins: [
			{
				name: "local-map-fixture",
				setup(b) {
					if (!realBasemaps)
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
		viewport: { width: 1100, height: 1100 },
	});
	page.setDefaultTimeout(30000);
	const basemapResponses = { map: 0, satellite: 0 };
	page.on("response", (response) => {
		if (response.status() !== 200) return;
		const url = response.url();
		if (url.includes("services.arcgisonline.com/") && url.includes("/tile/"))
			basemapResponses.satellite++;
		if (url.includes("basemaps.cartocdn.com/") && !url.endsWith(".json"))
			basemapResponses.map++;
	});
	const errors = [],
		external = [];
	page.on("pageerror", (error) => errors.push(error.message));
	await page.route("**/*", (route) => {
		if (
			new URL(route.request().url()).origin === origin ||
			(realBasemaps &&
				/^(basemaps.cartocdn.com|[a-d]\.basemaps.cartocdn.com|tiles.basemaps.cartocdn.com|services.arcgisonline.com)$/.test(
					new URL(route.request().url()).hostname,
				))
		)
			return route.continue();
		external.push(route.request().url());
		return route.abort();
	});
	await page.goto(origin);

	assert.ok(realStops, "Both validated local GPX files are required");
	await page.waitForFunction(() => window.fixtureMap?.isStyleLoaded());
	await page.evaluate(() => {
		window.oldMap = window.fixtureMap;
		window.chooseFixture("real");
	});
	await page.waitForFunction(
		() =>
			window.fixtureMap !== window.oldMap && window.fixtureMap?.isStyleLoaded(),
	);
	await page.waitForTimeout(800);
	const geometries = realStops.map((stop) => stop.routePlan.legs[0].geometry);
	const points = geometries[0];
	const center = [
		(Math.min(...points.map((p) => p[0])) +
			Math.max(...points.map((p) => p[0]))) /
			2,
		(Math.min(...points.map((p) => p[1])) +
			Math.max(...points.map((p) => p[1]))) /
			2,
	];
	const captures = [];
	for (const mode of ["map", "satellite"]) {
		if (mode === "satellite")
			await page.getByRole("button", { name: /^Sat/, exact: false }).click();
		for (const [device, width, height] of [
			["desktop", 1100, 1000],
			["mobile", 390, 844],
		]) {
			await page.setViewportSize({ width, height });
			await page.waitForTimeout(800);
			for (const [view, zoom] of [
				["general", 9.2],
				["detail", 11.8],
			]) {
				await page.evaluate(
					({ center, zoom }) => {
						const m = window.fixtureMap;
						m.stop();
						m.resize();
						m.jumpTo({ center, zoom, bearing: 0 });
					},
					{ center: view === "detail" ? points[650] : center, zoom },
				);
				await page.waitForTimeout(realBasemaps ? 2500 : 600);
				const metadata = await page.evaluate(() => {
					const m = window.fixtureMap,
						style = m.getStyle();
					const native = style.layers.filter(
						(l) =>
							l.id.startsWith("round-trip-") || l.id.startsWith("railway-"),
					);
					const source =
						Object.entries(style.sources).find(([id]) =>
							id.startsWith("railway-"),
						)?.[1] ??
						Object.entries(style.sources).find(([id]) =>
							id.startsWith("round-trip-"),
						)?.[1];
					return {
						zoom: m.getZoom(),
						center: m.getCenter().toArray(),
						layers: native,
						legacyRailLayers: style.layers
							.filter(
								(l) =>
									l.id.startsWith("route-layer-") &&
									/rail-gap|sleepers/.test(l.id),
							)
							.map((l) => l.id),
						coordinates: source.data.features
							.filter((f) => f.geometry.type === "LineString")
							.map((f) => f.geometry.coordinates),
					};
				});
				if (metadata.coordinates.length === 1) {
					assert.deepEqual(metadata.coordinates[0], geometries[0]);
				} else {
					assert.deepEqual(metadata.coordinates, geometries);
				}
				assert.deepEqual(
					metadata.legacyRailLayers,
					[],
					"Paired routes must not also draw railway sleepers",
				);
				metadata.renderedGeometries = metadata.coordinates.length;
				delete metadata.coordinates;
				const file = `${device}-${view}-${mode}.png`;
				await page.screenshot({ path: path.join(evidence, file) });
				captures.push({ file, device, view, mode, ...metadata });
			}
		}
	}
	assert.equal(
		await page.evaluate(
			() => JSON.stringify(window.fixtureData) === window.fixtureOriginal,
		),
		true,
	);
	assert.deepEqual(await page.evaluate(() => window.fixtureChanges), []);
	assert.deepEqual(await page.evaluate(() => window.fixtureMapErrors), []);
	assert.deepEqual(errors, []);
	assert.deepEqual(external, []);
	if (realBasemaps) {
		assert.ok(
			basemapResponses.map > 0 && basemapResponses.satellite > 0,
			JSON.stringify(basemapResponses),
		);
	}
	await writeFile(
		path.join(evidence, "captures.json"),
		JSON.stringify(
			{ phase, root, points: 1431, realBasemaps, basemapResponses, captures },
			null,
			2,
		),
	);
	console.log(
		JSON.stringify({
			result: "PASS",
			phase,
			root,
			captures: captures.map((c) => c.file),
			realGpxPoints: 1431,
			legacyRailLayers: 0,
			blockedExternalRequests: external.length,
			realBasemaps,
			basemapResponses,
		}),
	);
} finally {
	await browser?.close();
	await new Promise((resolve) => server.close(resolve));
}
