/** Real MapLibre + public MapTab in Chromium. Local fixture, no external requests. */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium, expect } from "@playwright/test";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { build } from "esbuild";

const root = process.cwd();
const evidence = path.join(root, "artifacts/railway-design/integration");
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
const fixtures=${JSON.stringify({ train: makeStops(), horizontal: horizontalStops, bus: makeStops("bus"), boat: makeStops("boat"), variant: makeStops("train", true), ...(realStops ? { real: realStops } : {}) })};
// Capture the MapLibre constructor through the public ref exposed by the fixture-only module adapter.
window.fixtureOriginal=JSON.stringify(fixtures);window.fixtureChanges=[];window.addEventListener('message',e=>{if(e.data?.type==='dreamy-route-change')window.fixtureChanges.push(e.data)});
function App(){const [name,setName]=useState('train');window.chooseFixture=setName;window.fixtureData=fixtures;return name==='editor'?<Editor cmsOrigin={location.origin}/>:<MapTab key={name} lang="es" mapStops={fixtures[name]}/>};createRoot(document.getElementById('root')).render(<App/>);`,
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

	const routes = () =>
		page.evaluate(() => {
			const railway = Object.entries(
				window.fixtureMap?.getStyle()?.sources || {},
			).find(([id]) => id.startsWith("railway-"))?.[1];
			const source =
				railway ??
				Object.entries(window.fixtureMap?.getStyle()?.sources || {}).find(
					([id]) => id.startsWith("round-trip-"),
				)?.[1];
			return (
				source?.data?.features?.filter(
					(f) => f.geometry.type === "LineString",
				) || []
			);
		});
	const count = (n) => expect.poll(async () => (await routes()).length).toBe(n);
	const choose = async (name) => {
		await page.evaluate((name) => {
			window.previousFixtureMap = window.fixtureMap;
			window.chooseFixture(name);
		}, name);
		try {
			await page.waitForFunction(
				() =>
					window.fixtureMap !== window.previousFixtureMap &&
					window.fixtureMap?.getCanvas().isConnected &&
					window.fixtureMap.isStyleLoaded(),
			);
		} catch (error) {
			console.log(
				"fixture failure",
				name,
				errors,
				await page.evaluate(() => ({
					connected: window.fixtureMap?.getCanvas().isConnected,
					changed: window.fixtureMap !== window.previousFixtureMap,
					style: !!window.fixtureMap?.getStyle(),
				})),
			);
			throw error;
		}
	};
	await count(1);
	await page.evaluate(() => window.fixtureMap.jumpTo({ zoom: 10.5 }));
	const cases = [];
	const checkArrows = async () => {
		await page.waitForTimeout(500);
		return page.evaluate(() => {
			const m = window.fixtureMap,
				style = m.getStyle();
			const railway = style.layers.filter((l) => l.id.startsWith("railway-"));
			if (railway.length) {
				if (railway.length !== 3 || railway.some((l) => l.type !== "line"))
					throw Error("Railway must use only three native lines");
				const rails = railway.find((l) => l.id.endsWith("-rails"));
				const sleepers = railway.find((l) => l.id.endsWith("-sleepers"));
				if (
					rails.paint["line-color"] !== "#343434" ||
					!rails.paint["line-gap-width"] ||
					!sleepers.paint["line-dasharray"] ||
					sleepers.layout["line-cap"] !== "butt"
				)
					throw Error("Traditional railway style missing");
				if (
					style.layers.some(
						(l) =>
							l.id.startsWith("route-layer-") && /sleepers|rail-gap/.test(l.id),
					)
				)
					throw Error("Duplicate legacy train layers");
				return true;
			}
			const layers = style.layers.filter((l) => l.id.startsWith("round-trip-"));
			const line = layers.find((l) => l.id.endsWith("-line"));
			const arrow = layers.find((l) => l.id.endsWith("-arrows"));
			if (!line || !arrow) throw Error("Missing native renderer");
			const layout = arrow.layout;
			if (
				layout["symbol-placement"] !== "line" ||
				layout["icon-rotation-alignment"] !== "map" ||
				layout["icon-keep-upright"] !== false
			)
				throw Error("Arrow orientation must follow coordinate order");
			if (
				JSON.stringify(line.paint["line-offset"]) !==
					JSON.stringify(["get", "offset"]) ||
				JSON.stringify(layout["icon-offset"]) !==
					JSON.stringify(["get", "arrowOffset"])
			)
				throw Error("Offsets not linked to presentation");
			for (const f of style.sources[line.source].data.features.filter(
				(f) => f.geometry.type === "LineString",
			)) {
				if (f.properties.arrowOffset[1] !== f.properties.offset)
					throw Error("Arrow and line offset differ");
			}
			return true;
		});
	};
	// Compare actual WebGL pixels with and without icons, not DOM substitutes.
	const checkArrowPixels = async (directionProof = false) => {
		const railway = await page.evaluate(() =>
			window.fixtureMap
				.getStyle()
				.layers.some((l) => l.id.startsWith("railway-")),
		);
		if (railway) {
			const screenshot = (
				await page.locator(".maplibregl-canvas").screenshot()
			).toString("base64");
			const result = await page.evaluate(
				async ({ screenshot, directionProof }) => {
					const img = new Image();
					img.src = `data:image/png;base64,${screenshot}`;
					await img.decode();
					const c = document.createElement("canvas");
					c.width = img.width;
					c.height = img.height;
					const ctx = c.getContext("2d");
					ctx.drawImage(img, 0, 0);
					const p = ctx.getImageData(0, 0, c.width, c.height).data;
					let dark = 0,
						colored = 0;
					for (let i = 0; i < p.length; i += 4) {
						if (
							[0, 1, 2].every(
								(j) =>
									p[i + j] < 175 &&
									Math.max(p[i], p[i + 1], p[i + 2]) -
										Math.min(p[i], p[i + 1], p[i + 2]) <
										12,
							)
						)
							dark++;
						if (
							[
								[231, 122, 40],
								[219, 82, 96],
							].some((color) =>
								color.every((v, j) => Math.abs(v - p[i + j]) < 12),
							)
						)
							colored++;
					}
					let split = 0,
						ties = 0;
					if (directionProof) {
						const y = Math.round(
							window.fixtureMap.project(
								window.fixtureData.horizontal[0].routePlan.start.coordinates,
							).y,
						);
						for (let x = 80; x < c.width - 80; x++) {
							const cells = [];
							for (let dy = -7; dy <= 7; dy++) {
								const i = ((y + dy) * c.width + x) * 4;
								cells.push(
									[0, 1, 2].every(
										(j) =>
											p[i + j] < 150 &&
											Math.max(p[i], p[i + 1], p[i + 2]) -
												Math.min(p[i], p[i + 1], p[i + 2]) <
												12,
									),
								);
							}
							let runs = 0,
								inside = false;
							for (const value of cells) {
								if (value && !inside) runs++;
								inside = value;
							}
							if (runs === 2) split++;
							if (runs === 1 && cells.filter(Boolean).length >= 4) ties++;
						}
					}
					return { dark, colored, split, ties };
				},
				{ screenshot, directionProof },
			);
			assert.ok(result.dark > 10, JSON.stringify(result));
			assert.equal(result.colored, 0);
			if (directionProof) {
				assert.ok(
					result.split > 5 && result.ties > 0,
					`Two rails and cross ties in real pixels: ${JSON.stringify(result)}`,
				);
			}
			return;
		}
		await page.waitForTimeout(500);
		const shown = (
			await page.locator(".maplibregl-canvas").screenshot()
		).toString("base64");
		await page.evaluate(() => {
			const m = window.fixtureMap;
			const l = m
				.getStyle()
				.layers.find(
					(l) => l.id.startsWith("round-trip-") && l.id.endsWith("-arrows"),
				);
			m.setLayoutProperty(l.id, "visibility", "none");
		});
		await page.waitForTimeout(150);
		const hidden = (
			await page.locator(".maplibregl-canvas").screenshot()
		).toString("base64");
		await page.evaluate(() => {
			const m = window.fixtureMap;
			const l = m
				.getStyle()
				.layers.find(
					(l) => l.id.startsWith("round-trip-") && l.id.endsWith("-arrows"),
				);
			m.setLayoutProperty(l.id, "visibility", "visible");
		});
		const result = await page.evaluate(
			async ({ shown, hidden }) => {
				async function decode(b64) {
					const img = new Image();
					img.src = `data:image/png;base64,${b64}`;
					await img.decode();
					const c = document.createElement("canvas");
					c.width = img.width;
					c.height = img.height;
					const ctx = c.getContext("2d");
					ctx.drawImage(img, 0, 0);
					return {
						pixels: ctx.getImageData(0, 0, c.width, c.height).data,
						width: c.width,
						height: c.height,
					};
				}
				const a = await decode(shown),
					b = await decode(hidden);
				let changed = 0,
					onLine = 0;
				const points = [];
				const color = (i) =>
					[
						[231, 122, 40],
						[219, 82, 96],
					].some((c) => c.every((v, j) => Math.abs(v - b.pixels[i + j]) < 18));
				for (let y = 5; y < a.height - 5; y++)
					for (let x = 5; x < a.width - 5; x++) {
						const i = (y * a.width + x) * 4;
						if (
							Math.abs(a.pixels[i] - b.pixels[i]) +
								Math.abs(a.pixels[i + 1] - b.pixels[i + 1]) +
								Math.abs(a.pixels[i + 2] - b.pixels[i + 2]) <
							45
						)
							continue;
						changed++;
						points.push({ x, y });
						let near = false;
						for (let dy = -3; dy <= 3; dy++)
							for (let dx = -3; dx <= 3; dx++)
								if (color(((y + dy) * a.width + x + dx) * 4)) near = true;
						if (near) onLine++;
					}
				const groups = [];
				for (const p of points) {
					let g = groups.find((g) =>
						g.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 5),
					);
					if (!g) {
						g = [];
						groups.push(g);
					}
					g.push(p);
				}
				const arrows = groups
					.filter((g) => g.length > 5)
					.map((g) => {
						const x = g.reduce((s, p) => s + p.x, 0) / g.length,
							y = g.reduce((s, p) => s + p.y, 0) / g.length;
						const spread = g.reduce(
							(s, p) => s + (p.x - x) * Math.abs(p.y - y),
							0,
						);
						const i = (Math.round(y) * b.width + Math.round(x)) * 4;
						return {
							x,
							y,
							spread,
							color: b.pixels[i + 1] > 100 ? "orange" : "coral",
						};
					});
				return { changed, onLine, fraction: onLine / (changed || 1), arrows };
			},
			{ shown, hidden },
		);
		assert.ok(result.changed > 5, JSON.stringify(result));
		assert.ok(
			result.fraction > 0.95,
			`Arrow pixels must lie over colored lines: ${JSON.stringify(result)}`,
		);
		if (directionProof) {
			assert.ok(
				result.arrows.some((a) => a.color === "orange") &&
					result.arrows.some((a) => a.color === "coral"),
				JSON.stringify(result),
			);
			for (const arrow of result.arrows)
				assert.ok(
					arrow.color === "orange" ? arrow.spread < 0 : arrow.spread > 0,
					`Opposite travel directions in actual pixels: ${JSON.stringify(arrow)}`,
				);
		}
		// Let native symbol opacity settle before the evidence screenshot.
		await page.waitForTimeout(500);
	};
	await checkArrows();
	const full = await routes();
	assert.equal(full.length, 1);
	assert.deepEqual(full[0].geometry.coordinates, forward);
	assert.equal(full[0].properties.segmentIds.length, 2);

	await checkArrowPixels();

	await page.screenshot({ path: path.join(evidence, "complete-desktop.png") });
	cases.push(
		"real MapLibre full view: one charcoal railway for exact inverse GPX, no orange/coral or permanent arrows",
	);
	for (const [zoom, bearing] of [
		[9.2, 0],
		[11, 65],
		[12, 170],
	]) {
		await page.evaluate(
			({ zoom, bearing }) => window.fixtureMap.jumpTo({ zoom, bearing }),
			{ zoom, bearing },
		);
		await page.waitForTimeout(150);
		await checkArrows();
		await checkArrowPixels();
		await page.screenshot({
			path: path.join(evidence, `zoom-${zoom}-bearing-${bearing}.png`),
		});
	}
	cases.push(
		"zoom 9.2/11/12 and bearing 0/65/170: railway rails and sleepers remain visible",
	);

	for (const [day] of [
		[1, "outbound"],
		[2, "return"],
	]) {
		await page
			.locator("button[aria-pressed]")
			.filter({ hasText: new RegExp(`0${day}`) })
			.focus();
		await page
			.locator("button[aria-pressed]")
			.filter({ hasText: new RegExp(`0${day}`) })
			.press("Enter");
		await count(1);
		await expect
			.poll(async () =>
				(await routes())[0]?.properties.segmentIds[0]?.includes(
					day === 1 ? "out" : "back",
				),
			)
			.toBe(true);
		const [route] = await routes();
		assert.equal(route.properties.segmentIds.length, 1);
		await expect(
			page.getByRole("list", { name: "Sentido del viaje en tren" }),
		).toHaveCount(0);

		assert.deepEqual(
			route.geometry.coordinates,
			day === 1 ? forward : [...forward].reverse(),
		);
		await checkArrows();
		await page.screenshot({ path: path.join(evidence, `day${day}.png`) });
	}

	cases.push(
		"day selection hides other days, shows only its own direction without paired offset",
	);
	await page
		.getByRole("button", { name: "Ver recorrido completo", exact: true })
		.click();
	await count(1);
	await page.setViewportSize({ width: 390, height: 1000 });
	await page.getByRole("button", { name: "Satélite", exact: true }).click();
	await page.waitForTimeout(200);
	await checkArrows();
	await page.screenshot({
		path: path.join(evidence, "mobile-satellite-fixture.png"),
	});
	await page.evaluate(() =>
		window.fixtureMap.jumpTo({ zoom: 11, bearing: 35 }),
	);
	await checkArrowPixels();
	await checkArrows();
	await page.screenshot({
		path: path.join(evidence, "mobile-satellite-detail.png"),
	});
	cases.push(
		"390px mobile and satellite toggle with local dark style (external satellite tiles deliberately blocked)",
	);
	for (const mode of ["bus", "boat"]) {
		await choose(mode);
		await count(2);
		assert.ok((await routes()).every((f) => f.properties.mode === mode));
		await checkArrows();
	}
	cases.push("verified inverse bus and boat GPX share the rendering behavior");
	await choose("horizontal");
	await count(1);
	await page.setViewportSize({ width: 1100, height: 1100 });
	await page.evaluate(() => window.fixtureMap.jumpTo({ zoom: 11, bearing: 0 }));
	await checkArrows();
	await checkArrowPixels(true);
	await page.screenshot({
		path: path.join(evidence, "opposite-arrow-directions.png"),
	});
	cases.push(
		"actual WebGL pixels show two thin rails, rectangular cross ties and no route colors",
	);
	await choose("variant");
	await page.waitForTimeout(500);
	await count(2);
	assert.deepEqual(
		(await routes()).map((f) => f.geometry.coordinates),
		await page.evaluate(() =>
			window.fixtureData.variant.map((s) => s.routePlan.legs[0].geometry),
		),
	);

	cases.push("different railway return remains a separate complete geometry");
	if (realStops) {
		await choose("real");
		await count(1);
		assert.deepEqual(
			(await routes())[0].geometry.coordinates,
			realStops[0].routePlan.legs[0].geometry,
		);
		await page.evaluate(() => window.fixtureMap.jumpTo({ zoom: 10 }));
		await page.waitForTimeout(200);
		await checkArrows();
		await page.screenshot({
			path: path.join(evidence, "actual-1431-point-gpx.png"),
		});
		cases.push(
			"actual 1431-point GPX files: automatic reverse detection and unmodified geometry",
		);
	}
	assert.equal(
		await page.evaluate(
			() => JSON.stringify(window.fixtureData) === window.fixtureOriginal,
		),
		true,
	);
	assert.deepEqual(await page.evaluate(() => window.fixtureChanges), []);
	await choose("editor");
	await page
		.getByRole("button", { name: "Cambiar ubicación", exact: true })
		.waitFor();
	await page.evaluate(() => {
		const a = window.fixtureData.train[0].routePlan;
		const b = window.fixtureData.train[1].routePlan;
		const value = { ...a, legs: [a.legs[0], b.legs[0]] };
		window.postMessage(
			{
				type: "dreamy-route-init",
				protocol: 2,
				identity: {
					documentId: "fixture",
					locale: "es",
					dayKey: "1",
					sessionId: "fixture",
				},
				sequence: 0,
				ackSequence: 0,
				value,
			},
			location.origin,
		);
	});
	await count(1);
	await checkArrows();
	await page.screenshot({
		path: path.join(evidence, "editor-same-day-pair.png"),
	});
	assert.deepEqual(await page.evaluate(() => window.fixtureChanges), []);
	cases.push(
		"editor deduplicates an intraday railway inverse pair without publishing route changes",
	);
	assert.deepEqual(await page.evaluate(() => window.fixtureMapErrors), []);
	assert.deepEqual(errors, []);
	assert.deepEqual(external, []);
	const report = {
		result: "PASS",
		cases,
		realMapLibre: true,
		webgl: true,
		productionAccess: false,
		pending: [
			"Satellite imagery on real external basemaps is not accessed; tested local dark background only.",
		],
	};
	await writeFile(
		path.join(evidence, "results.json"),
		JSON.stringify(report, null, 2),
	);
	console.log(JSON.stringify(report, null, 2));
} finally {
	await browser?.close();
	await new Promise((resolve) => server.close(resolve));
}
