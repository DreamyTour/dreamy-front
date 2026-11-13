/** Real editor in Chromium; all requests stay in a disposable localhost fixture. */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import path from "node:path";
import { build } from "esbuild";
import { chromium, expect } from "@playwright/test";

const root = process.cwd();
const place = {
	label: "Plaza Regocijo, Cusco, Perú",
	coordinates: [-71.9808, -13.5176],
};
const oldStart = { label: "Salida anterior", coordinates: [-72.27, -13.26] };
const leg = {
	id: "visit",
	mode: "train",
	destination: { label: "Visita anterior", coordinates: [-72.51, -13.18] },
	geometry: [[-72.27, -13.26], [-72.4, -13.2], [-72.51, -13.18]],
	provider: "GPX verificado por el editor",
	geometryMeta: { source: "gpx", fileName: "original.gpx", status: "valid" },
};
let bundle;
const server = createServer((request, response) => {
	const url = new URL(request.url, "http://fixture");
	if (url.pathname === "/editor.js") {
		response.setHeader("Content-Type", "text/javascript");
		return response.end(bundle);
	}
	if (url.pathname === "/api/tour-places") {
		response.setHeader("Content-Type", "application/json");
		return response.end(JSON.stringify({ places: [place] }));
	}
	response.setHeader("Content-Type", "text/html; charset=utf-8");
	if (url.pathname === "/editor") {
		return response.end('<div id="root"></div><script type="module" src="/editor.js"></script>');
	}
	response.end(`<script>
	window.changes = [];
	window.addEventListener('message', event => {
		if (event.origin !== location.origin || event.source !== document.querySelector('iframe').contentWindow) return;
		if (event.data?.type === 'dreamy-route-ready') { window.ready = true; window.protocol = event.data.protocol; }
		if (event.data?.type === 'dreamy-route-change') window.changes.push(event.data.value);
	});
	</script><iframe src="/editor"></iframe>`);
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const mapStub = `import React from 'react';
const handlers = new Map();
const map = {on:(event,fn)=>handlers.set(event,fn),off:(event,fn)=>{if(handlers.get(event)===fn)handlers.delete(event)},flyTo(){},fitBounds(){}};
export const useMap=()=>({map});
export const MapView=({children})=><div><button type="button" data-testid="map-canvas" onClick={()=>handlers.get('click')?.({lngLat:{lng:-72.28,lat:-13.27}})}>Mapa</button>{children}</div>;
export const MapMarker=({children})=><div>{children}</div>;
export const MarkerContent=({children})=><>{children}</>;
export const MapControls=()=>null;
export const MapRoute=()=>null;
export const MapArc=()=>null;`;
let browser;
const passed = [];
try {
	const result = await build({
		bundle: true, write: false, format: "esm", platform: "browser", jsx: "automatic",
		stdin: { resolveDir: root, loader: "tsx", contents: `import React from 'react';import {createRoot} from 'react-dom/client';import Editor from './src/components/tours/RoutePlanEditor';createRoot(document.getElementById('root')).render(<Editor cmsOrigin=${JSON.stringify(origin)}/>);` },
		alias: { "@": path.join(root, "src") },
		define: { "process.env.NODE_ENV": '"test"', "import.meta.env": JSON.stringify({ DEV: true, PUBLIC_MAPTILER_KEY: "" }) },
		plugins: [{ name: "fixture-map", setup(builder) {
			builder.onResolve({ filter: /^@\/components\/ui\/map$/ }, () => ({ path: "map", namespace: "fixture" }));
			builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: mapStub, loader: "tsx", resolveDir: root }));
		} }],
	});
	bundle = result.outputFiles[0].text;
	browser = await chromium.launch({ headless: true });
	const page = await browser.newPage();
	page.setDefaultTimeout(5000);
	const errors = [];
	page.on("pageerror", error => errors.push(error.message));
	await page.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
	const frame = page.frameLocator("iframe");
	const changeMode = frame.getByRole("button", { name: "Cambiar ubicación", exact: true });
	const current = () => page.evaluate(() => window.changes.at(-1));
	const initialize = async (value, extra = {}) => {
		await page.goto(origin);
		await page.waitForFunction(() => window.ready);
		await page.evaluate(({ value, extra }) => document.querySelector("iframe").contentWindow.postMessage({
			type: "dreamy-route-init", protocol: window.protocol,
			identity: { documentId: "fixture", locale: "es", dayKey: "day", sessionId: "fixture" },
			sequence: 0, ackSequence: 0, value, ...extra,
		}, location.origin), { value, extra });
		const input = frame.getByRole("textbox", { name: "Buscar lugar", exact: true });
		if (extra.disabled) await expect(input).toBeDisabled();
		else await expect(input).toBeEnabled();
	};
	const search = async () => {
		await frame.getByRole("textbox", { name: "Buscar lugar", exact: true }).fill(place.label);
		await frame.getByRole("button", { name: "Buscar", exact: true }).click();
		await frame.getByRole("button", { name: place.label, exact: true }).click();
	};
	const unchanged = async value => {
		await expect(frame.getByRole("dialog")).toHaveCount(0);
		assert.deepEqual(await current(), value);
	};
	const empty = { version: 1, start: null, legs: [] };
	await initialize(empty);
	await frame.getByTestId("map-canvas").click();
	await unchanged(undefined);
	passed.push("empty start: map click ignored without change mode");
	await search();
	await expect(frame.getByRole("textbox").last()).toHaveValue(place.label);
	assert.deepEqual((await current()).start, place);
	await expect(changeMode).toHaveAttribute("aria-pressed", "false");
	passed.push("initial start selected by search without change mode");
	const initial = await current();
	await frame.getByTestId("map-canvas").click();
	await search();
	await unchanged(initial);
	passed.push("existing start: map and search require change mode");
	await frame.getByRole("button", { name: "Añadir visita", exact: true }).click();
	await search();
	await expect.poll(async () => (await current())?.legs[0].destination.label).toBe(place.label);
	assert.deepEqual((await current()).legs[0].destination, place);
	passed.push("add visit: search still selects destination");

	const saved = { version: 1, start: oldStart, legs: [leg] };
	await initialize(saved);
	await frame.getByTestId("map-canvas").click();
	await search();
	await unchanged(undefined);
	await changeMode.click();
	await search();
	await expect(frame.getByRole("dialog")).toBeVisible();
	assert.equal(await current(), undefined);
	await frame.getByRole("button", { name: "Cancelar", exact: true }).click();
	await expect(frame.getByRole("textbox").last()).toHaveValue(oldStart.label);
	await unchanged(undefined);
	passed.push("existing GPX start: search requires confirmation; cancel preserves plan");
	await changeMode.click();
	await search();
	await frame.getByRole("button", { name: "Conservar anterior y continuar" }).click();
	await expect.poll(async () => (await current())?.start.label).toBe(place.label);
	const changed = await current();
	assert.deepEqual(changed.start, place);
	assert.deepEqual(changed.legs[0].geometry, leg.geometry);
	assert.equal(changed.legs[0].geometryMeta.fileName, "original.gpx");
	assert.equal(changed.legs[0].geometryMeta.status, "review");
	passed.push("confirmed replacement preserves GPX points and marks review");

	// The initial-start exception also uses publish(): existing geometry is protected.
	await initialize({ ...saved, start: null });
	await search();
	await expect(frame.getByRole("dialog")).toBeVisible();
	assert.equal(await current(), undefined);
	await frame.getByRole("button", { name: "Cancelar", exact: true }).click();
	await unchanged(undefined);
	passed.push("empty start with linked geometry: initial search still requires confirmation");
	await initialize(empty, { inheritedStart: oldStart });
	await expect(changeMode).toBeDisabled();
	await search();
	await expect(frame.getByRole("textbox").last()).toHaveValue(oldStart.label);
	await unchanged(undefined);
	passed.push("inherited start cannot be replaced by initial search exception");
	await initialize(empty, { disabled: true });
	await expect(frame.getByRole("textbox", { name: "Buscar lugar", exact: true })).toBeDisabled();
	await unchanged(undefined);
	passed.push("readonly editor remains disabled with an empty start");
	assert.deepEqual(errors, []);
	console.log(JSON.stringify({ result: "PASS", cases: passed, productionAccess: false }, null, 2));
} finally {
	await browser?.close();
	await new Promise(resolve => server.close(resolve));
}
