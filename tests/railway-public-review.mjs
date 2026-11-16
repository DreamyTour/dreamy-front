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
const assertDayLayout = process.argv.includes("--assert-day-layout");
const evidence = path.join(
	process.cwd(),
	"artifacts/railway-review-2026-11-14",
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
const realStops = snapshot.mapStops.map((stop) => ({ ...stop, imagen: null }));
const groupedStops = realStops.slice(0, 2).map((stop, index) => {
	const routePlan = structuredClone(stop.routePlan);
	if (index === 1) {
		const destination = realStops[0].routePlan.legs.at(-1).destination;
		const finalLeg = routePlan.legs.at(-1);
		finalLeg.destination = {
			...finalLeg.destination,
			coordinates: [...destination.coordinates],
		};
		routePlan.legs.splice(-1, 0, {
			id: "review-waypoint",
			mode: "bus",
			destination: {
				label: "Test waypoint",
				coordinates: [-72.5, -13.14],
			},
			kind: "waypoint",
		});
		routePlan.primaryLegId = undefined;
	}
	return { ...stop, id: `nearby-${stop.id}`, routePlan };
});
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
const fixtures={real:${JSON.stringify(realStops)},grouped:${JSON.stringify(groupedStops)}};
// Capture the MapLibre constructor through the public ref exposed by the fixture-only module adapter.
window.fixtureOriginal=JSON.stringify(fixtures.real);window.fixtureChanges=[];window.addEventListener('message',e=>{if(e.data?.type==='dreamy-route-change')window.fixtureChanges.push(e.data)});
function App(){const [name,setName]=useState('real');window.chooseFixture=setName;window.fixtureData=fixtures;return name==='editor'?<Editor cmsOrigin={location.origin}/>:<MapTab key={name} lang="es" mapStops={fixtures[name]}/>};createRoot(document.getElementById('root')).render(<App/>);`,
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

	await page.waitForFunction(() => window.fixtureMap?.isStyleLoaded());
	await page.waitForTimeout(900);
	const points = geometries[0];
	const allPoints = realStops.flatMap((s) => [
		s.routePlan.start.coordinates,
		...s.routePlan.legs.flatMap((l) => [
			l.destination.coordinates,
			...(l.geometry ?? []),
		]),
	]);
	const bounds = allPoints.reduce(
		(b, p) => [
			[Math.min(b[0][0], p[0]), Math.min(b[0][1], p[1])],
			[Math.max(b[1][0], p[0]), Math.max(b[1][1], p[1])],
		],
		[
			[Infinity, Infinity],
			[-Infinity, -Infinity],
		],
	);
	const captures = [];
	async function capture(file, details) {
		const viewport = page.viewportSize();
		await page.evaluate(() => window.scrollTo(0, 0));
		await page.mouse.move(viewport.width - 2, viewport.height - 2);
		await page.waitForTimeout(1000);
		const metadata = await page.evaluate(() => {
			const m = window.fixtureMap,
				style = m.getStyle();
			const sources = Object.entries(style.sources)
				.filter(
					([id]) => id.startsWith("railway-") || id.startsWith("round-trip-"),
				)
				.map(([id, s]) => ({
					id,
					features: s.data.features.filter(
						(f) =>
							f.geometry.type === "LineString" &&
							(f.properties.mode === "train" || id.startsWith("railway-")),
					),
				}))
				.filter((s) => s.features.length);
			const color = (value) => {
				const c = document.createElement("canvas");
				c.width = c.height = 1;
				const ctx = c.getContext("2d");
				ctx.fillStyle = value;
				ctx.fillRect(0, 0, 1, 1);
				const p = ctx.getImageData(0, 0, 1, 1).data;
				return [...p].slice(0, 3);
			};
			const luminance = (rgb) =>
				rgb
					.map((v) => {
						v /= 255;
						return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
					})
					.reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
			const pins = [
				...document.querySelectorAll(".maplibregl-marker button[aria-label]"),
			].map((el) => {
				const r = el.getBoundingClientRect(),
					css = getComputedStyle(el),
					fg = luminance(color(css.color)),
					bg = luminance(color(css.backgroundColor));
				const at = document.elementFromPoint(
					r.x + r.width / 2,
					r.y + r.height / 2,
				);
				return {
					label: el.getAttribute("aria-label"),
					x: r.x,
					y: r.y,
					width: r.width,
					height: r.height,
					contrast: (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05),
					visibleAtCenter: !!at && el.contains(at),
					active: el.classList.contains("ring-4"),
				};
			});
			const mapBounds = m.getContainer().getBoundingClientRect();
			const visiblePopups = [
				...document.querySelectorAll(".maplibregl-popup"),
			].filter((el) => getComputedStyle(el).display !== "none");
			const markerOverlaps = pins.flatMap((pin) => {
				const button = [
					...document.querySelectorAll(".maplibregl-marker button[aria-label]"),
				].find((el) => el.getAttribute("aria-label") === pin.label);
				const marker = button?.closest(".maplibregl-marker");
				if (!button || !marker) return [];
				const r = button.getBoundingClientRect();
				return [...document.querySelectorAll(".maplibregl-marker")]
					.filter((other) => {
						if (other === marker) return false;
						const bounds = other.getBoundingClientRect();
						return (
							r.left < bounds.right &&
							r.right > bounds.left &&
							r.top < bounds.bottom &&
							r.bottom > bounds.top
						);
					})
					.map((other) => ({
						day: pin.label,
						secondary: other.textContent.trim(),
					}));
			});
			const popupElement =
				visiblePopups.find((el) =>
					el.querySelector(".tour-map-popup-desktop"),
				) ?? null;
			const popup = popupElement?.getBoundingClientRect() ?? null;
			const popupOverlappingPins = visiblePopups.flatMap((overlay) => {
				const r = overlay.getBoundingClientRect();
				return pins
					.filter(
						(pin) =>
							pin.x < r.right &&
							pin.x + pin.width > r.left &&
							pin.y < r.bottom &&
							pin.y + pin.height > r.top,
					)
					.map((pin) => pin.label);
			});
			const mobileDetails = document
				.querySelector("[data-day-details-mobile]")
				?.getBoundingClientRect();
			return {
				zoom: m.getZoom(),
				center: m.getCenter().toArray(),
				sources,
				pins,
				mapBounds: {
					left: mapBounds.left,
					right: mapBounds.right,
					top: mapBounds.top,
					bottom: mapBounds.bottom,
				},
				layers: style.layers.filter((l) => l.id.startsWith("railway-")),
				cards: [...document.querySelectorAll("button[aria-pressed]")].map(
					(el) => el.innerText,
				),
				popupOverlappingPins,
				markerOverlaps,
				activePopupCount: visiblePopups.length,
				mobileDetails:
					mobileDetails &&
					getComputedStyle(document.querySelector("[data-day-details-mobile]"))
						.display !== "none"
						? {
								top: mobileDetails.top,
								bottom: mobileDetails.bottom,
							}
						: null,
				popup: (() => {
					if (!popup) return null;
					return {
						left: popup.left - mapBounds.left,
						right: mapBounds.right - popup.right,
						top: popup.top - mapBounds.top,
						bottom: mapBounds.bottom - popup.bottom,
					};
				})(),
			};
		});
		for (const source of metadata.sources)
			for (const f of source.features)
				assert.ok(
					geometries.some(
						(g) => JSON.stringify(g) === JSON.stringify(f.geometry.coordinates),
					),
				);
		for (const source of metadata.sources)
			source.features = source.features.map((f) => ({
				points: f.geometry.coordinates.length,
				properties: f.properties,
			}));
		if (assertDayLayout) {
			const placement = await page.evaluate(
				(expected) => {
					const m = window.fixtureMap,
						b = m.getContainer().getBoundingClientRect();
					return expected.map((coordinates, i) => {
						const el = document.querySelector(
							`.maplibregl-marker button[aria-label$="${String(i + 1).padStart(2, "0")}"]`,
						);
						if (!el) return null;
						const r = el.getBoundingClientRect(),
							p = m.project(coordinates);
						return Math.hypot(
							r.x + r.width / 2 - b.x - p.x,
							r.y + r.height / 2 - b.y - p.y,
						);
					});
				},
				realStops.map((s) => s.routePlan.legs.at(-1).destination.coordinates),
			);
			assert.ok(
				placement.every((d) => d !== null && d < 1),
				"Day markers must be at actual day destinations",
			);
			if (!details.day)
				assert.ok(
					metadata.pins.every((p) => p.visibleAtCenter),
					"Complete-view day pins must be visible",
				);
			if (details.day) {
				const pin = metadata.pins.find((p) =>
					p.label.endsWith(String(details.day).padStart(2, "0")),
				);
				assert.ok(pin?.active, "Selected day pin must remain highlighted");
				assert.ok(
					pin &&
						pin.x + pin.width / 2 >= metadata.mapBounds.left &&
						pin.x + pin.width / 2 <= metadata.mapBounds.right &&
						pin.y + pin.height / 2 >= metadata.mapBounds.top &&
						pin.y + pin.height / 2 <= metadata.mapBounds.bottom,
					"Selected day pin must remain in the map viewport",
				);
				const visibleDayPins = metadata.pins.filter(
					(candidate) =>
						candidate.x + candidate.width / 2 >= metadata.mapBounds.left &&
						candidate.x + candidate.width / 2 <= metadata.mapBounds.right &&
						candidate.y + candidate.height / 2 >= metadata.mapBounds.top &&
						candidate.y + candidate.height / 2 <= metadata.mapBounds.bottom,
				);
				assert.ok(
					visibleDayPins.length > 0 &&
						visibleDayPins.every((candidate) => candidate.visibleAtCenter),
					"Visible day pins must stay above secondary markers",
				);
				if (details.device === "mobile" || details.device === "mobile-small") {
					assert.equal(
						metadata.activePopupCount,
						0,
						"Mobile must not leave popup overlays on map markers",
					);
					assert.ok(
						metadata.mobileDetails,
						"Mobile details must remain visible",
					);
					assert.ok(
						metadata.mobileDetails.top >= metadata.mapBounds.bottom,
						"Mobile day details must flow below the map",
					);
				} else {
					assert.ok(
						metadata.popup &&
							Object.values(metadata.popup).every((n) => n >= 10),
						"Popup must stay inside map with margin",
					);
					assert.deepEqual(
						metadata.popupOverlappingPins,
						[],
						"Desktop popup must not overlap numbered day markers",
					);
				}
			}
		}
		await page.screenshot({ path: path.join(evidence, file), fullPage: true });
		captures.push({ file, ...details, ...metadata });
	}
	for (const mode of ["map", "satellite"]) {
		if (mode === "satellite")
			await page.getByRole("button", { name: /^Sat/ }).click();
		for (const [device, width, height] of [
			["desktop", 1100, 1000],
			["mobile", 390, 844],
		]) {
			await page.setViewportSize({ width, height });
			await page.waitForTimeout(800);
			await page.evaluate((bounds) => {
				const m = window.fixtureMap;
				m.stop();
				m.resize();
				m.fitBounds(bounds, {
					padding: { top: 120, right: 104, bottom: 96, left: 40 },
					duration: 0,
					maxZoom: 10,
				});
			}, bounds);
			await page.waitForTimeout(2500);
			await capture(`${device}-complete-${mode}.png`, {
				device,
				mode,
				view: "complete-published-itinerary",
			});
			for (const zoom of process.argv.includes("--quick")
				? []
				: [10, 11, 12, 13]) {
				await page.evaluate(
					({ center, zoom }) => {
						const m = window.fixtureMap;
						m.stop();
						m.jumpTo({ center, zoom, bearing: 0 });
					},
					{ center: points[650], zoom },
				);
				await page.waitForTimeout(1200);
				await capture(`${device}-zoom-${zoom}-${mode}.png`, {
					device,
					mode,
					view: "railway-detail",
					requestedZoom: zoom,
				});
			}
		}
	}
	for (const selectedMode of assertDayLayout
		? ["map", "satellite"]
		: ["satellite"]) {
		if (selectedMode === "map")
			await page.getByRole("button", { name: "Mapa", exact: true }).click();
		else await page.getByRole("button", { name: /^Sat/ }).click();
		for (const [device, width, height] of [
			["mobile", 390, 1000],
			...(assertDayLayout ? [["mobile-small", 320, 844]] : []),
			["desktop", 1100, 1000],
		])
			for (const [index, stop] of realStops.entries()) {
				await page.setViewportSize({ width, height });
				await page.waitForTimeout(700);
				await page
					.locator("button[aria-pressed]")
					.filter({ hasText: stop.title })
					.press("Enter");
				await page.waitForTimeout(1500);
				const text = await page.locator("body").innerText();
				assert.ok(text.includes(stop.title));
				assert.ok(text.includes(stop.duration));
				assert.ok(text.includes(stop.routeText));
				assert.ok(
					text.includes(stop.description.slice(0, 80)),
					"Published description must remain in selected-day popup",
				);
				await capture(
					`${device}-day-${index + 1}-information${assertDayLayout ? `-${selectedMode}` : ""}.png`,
					{
						device,
						view: "selected-day",
						day: index + 1,
					},
				);
				const lines = await page.evaluate(() =>
					Object.entries(window.fixtureMap.getStyle().sources).flatMap(
						([id, s]) =>
							id.startsWith("railway-") || id.startsWith("round-trip-")
								? s.data.features.filter(
										(f) =>
											f.geometry.type === "LineString" &&
											(f.properties.mode === "train" ||
												id.startsWith("railway-")),
									)
								: [],
					),
				);
				assert.equal(lines.length, 1);
				assert.deepEqual(lines[0].geometry.coordinates, geometries[index]);
			}
	}
	await page.evaluate(() => window.chooseFixture("grouped"));
	const groupButton = page
		.locator('.maplibregl-marker button[aria-expanded="false"]')
		.first();
	await groupButton.waitFor();
	await groupButton.press("Enter");
	const dayChoices = page.locator(".maplibregl-marker [data-map-day]");
	assert.equal(await dayChoices.count(), 2);
	await dayChoices.nth(1).press("Enter");
	const selectedGroupButton = page.locator(
		'.maplibregl-marker button[aria-expanded][aria-pressed="true"]',
	);
	await selectedGroupButton.waitFor();
	assert.match(await selectedGroupButton.innerText(), /02/);
	assert.ok(
		(await page.locator("body").innerText()).includes(realStops[1].title),
		"Keyboard selection in a close-marker group must show the chosen day",
	);
	await page.waitForTimeout(700);
	const waypointVisible = await page.evaluate(() => {
		const map = window.fixtureMap;
		const coordinates = window.fixtureData.grouped[1].routePlan.legs.find(
			(leg) => leg.id === "review-waypoint",
		).destination.coordinates;
		const expected = map.project(coordinates);
		const bounds = map.getContainer().getBoundingClientRect();
		return [...document.querySelectorAll(".maplibregl-marker")].some(
			(marker) => {
				const rect = marker.getBoundingClientRect();
				return (
					Math.hypot(
						rect.left + rect.width / 2 - bounds.left - expected.x,
						rect.top + rect.height / 2 - bounds.top - expected.y,
					) < 2
				);
			},
		);
	});
	assert.equal(
		waypointVisible,
		true,
		"Selected-day waypoints must remain visible as secondary markers",
	);
	const popupOverlapsSelectedGroup = await page.evaluate(() => {
		const marker = document.querySelector(
			'.maplibregl-marker button[aria-pressed="true"]',
		);
		const popup = document.querySelector(".tour-map-popup-desktop");
		if (!marker || !popup) return null;
		const markerBounds = marker.getBoundingClientRect();
		const popupBounds = popup.getBoundingClientRect();
		return (
			markerBounds.left < popupBounds.right &&
			markerBounds.right > popupBounds.left &&
			markerBounds.top < popupBounds.bottom &&
			markerBounds.bottom > popupBounds.top
		);
	});
	assert.equal(
		popupOverlapsSelectedGroup,
		false,
		"Selected day popup must leave the grouped day marker visible",
	);
	assert.equal(
		await page.evaluate(() => JSON.stringify(window.fixtureData.real)),
		fixtureOriginal,
	);
	assert.deepEqual(await page.evaluate(() => window.fixtureChanges), []);
	assert.deepEqual(await page.evaluate(() => window.fixtureMapErrors), []);
	assert.deepEqual(errors, []);
	assert.deepEqual(external, []);
	if (topo) assert.ok(basemapResponses.topo > 0);
	else assert.ok(basemapResponses.map > 0);
	assert.ok(basemapResponses.satellite > 0);
	await writeFile(
		path.join(evidence, "captures.json"),
		JSON.stringify(
			{
				source: snapshot.source,
				snapshotUtc: snapshot.retrievedUtc,
				topo,
				basemapResponses,
				missingSavedGeometries: realStops.flatMap((s) =>
					s.routePlan.legs
						.filter((l) => !l.geometry)
						.map((l) => ({
							day: s.order,
							mode: l.mode,
							to: l.destination.label,
						})),
				),
				captures,
			},
			null,
			2,
		),
	);
	console.log(
		JSON.stringify(
			{
				result: "PASS",
				phase,
				captures: captures.length,
				basemapResponses,
				realPublishedData: true,
				geometryPoints: 1431,
				dataUnchanged: true,
			},
			null,
			2,
		),
	);
} finally {
	await browser?.close();
	await new Promise((resolve) => server.close(resolve));
}
