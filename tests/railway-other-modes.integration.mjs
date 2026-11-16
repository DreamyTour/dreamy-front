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
const evidence = path.join(
	process.cwd(),
	"artifacts/railway-review-2026-11-14",
	process.argv[3] || "modes-current",
);
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
			readFile(path.join(root, "artifacts", name, `${name}.gpx`), "utf8"),
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
const fixtures=${JSON.stringify({ walking: makeStops("walking"), flight: makeStops("flight"), boatArc: makeStops("boat").map((s) => ({ ...s, routePlan: { ...s.routePlan, legs: s.routePlan.legs.map((l) => ({ ...l, geometry: undefined, geometryMeta: undefined })) } })), flightArc: makeStops("flight").map((s) => ({ ...s, routePlan: { ...s.routePlan, legs: s.routePlan.legs.map((l) => ({ ...l, geometry: undefined, geometryMeta: undefined })) } })), train: makeStops(), horizontal: horizontalStops, bus: makeStops("bus"), boat: makeStops("boat"), variant: makeStops("train", true), ...(realStops ? { real: realStops } : {}) })};
// Capture the MapLibre constructor through the public ref exposed by the fixture-only module adapter.
window.fixtureOriginal=JSON.stringify(fixtures);window.fixtureChanges=[];window.addEventListener('message',e=>{if(e.data?.type==='dreamy-route-change')window.fixtureChanges.push(e.data)});
function App(){const [name,setName]=useState('bus');window.chooseFixture=setName;window.fixtureData=fixtures;return name==='editor'?<Editor cmsOrigin={location.origin}/>:<MapTab key={name} lang="es" mapStops={fixtures[name]}/>};createRoot(document.getElementById('root')).render(<App/>);`,
		},
		plugins: [
			{
				name: "local-map-fixture",
				setup(b) {
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
	page.setDefaultTimeout(10000);
	const errors = [],
		external = [];
	page.on("pageerror", (error) => errors.push(error.message));
	await page.route("**/*", (route) => {
		if (new URL(route.request().url()).origin === origin)
			return route.continue();
		external.push(route.request().url());
		return route.abort();
	});
	await page.goto(origin);

	await page.waitForFunction(() => window.fixtureMap?.isStyleLoaded());
	const modes = [];
	for (const mode of [
		"bus",
		"walking",
		"boat",
		"boatArc",
		"flight",
		"flightArc",
	]) {
		if (mode !== "bus") {
			await page.evaluate((mode) => {
				window.oldMap = window.fixtureMap;
				window.chooseFixture(mode);
			}, mode);
			await page.waitForFunction(
				() =>
					window.fixtureMap !== window.oldMap &&
					window.fixtureMap?.isStyleLoaded(),
			);
		}
		await page.waitForTimeout(800);
		const data = await page.evaluate(() => {
			const style = window.fixtureMap.getStyle();
			const nonempty = new Set(
				Object.entries(style.sources)
					.filter(
						([, s]) =>
							s.type === "geojson" &&
							s.data &&
							(s.data.type === "FeatureCollection"
								? s.data.features.length
								: s.data.geometry?.coordinates?.length),
					)
					.map(([id]) => id),
			);
			const layers = style.layers
				.filter((l) => nonempty.has(l.source))
				.map(({ type, paint, layout, filter }) => ({
					type,
					paint,
					layout,
					filter,
				}));
			const geometries = Object.entries(style.sources)
				.filter(([id]) => nonempty.has(id))
				.flatMap(([, s]) =>
					(s.data.type === "FeatureCollection"
						? s.data.features
						: [s.data]
					).map((f) => f.geometry),
				);
			return {
				layers,
				geometries,
				railwayLayers: style.layers.filter((l) => l.id.startsWith("railway-"))
					.length,
			};
		});
		assert.ok(data.layers.length > 0, `${mode} must render`);
		assert.equal(data.railwayLayers, 0);
		modes.push({
			mode,
			...JSON.parse(
				JSON.stringify(data).replace(
					/round-trip-[^-]+-(arrow|station)/g,
					"round-trip-ID-$1",
				),
			),
		});
	}
	assert.equal(
		await page.evaluate(
			() => JSON.stringify(window.fixtureData) === window.fixtureOriginal,
		),
		true,
	);
	assert.deepEqual(await page.evaluate(() => window.fixtureMapErrors), []);
	assert.deepEqual(errors, []);
	assert.deepEqual(external, []);
	await writeFile(
		path.join(evidence, "modes.json"),
		JSON.stringify({ root, modes }, null, 2),
	);
	console.log(
		JSON.stringify(
			{
				result: "PASS",
				modes: modes.map((m) => ({
					mode: m.mode,
					layers: m.layers.length,
					geometries: m.geometries.length,
				})),
				unchangedData: true,
			},
			null,
			2,
		),
	);
} finally {
	await browser?.close();
	await new Promise((resolve) => server.close(resolve));
}
