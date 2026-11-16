/** Bundles the REAL editor and Strapi Input with test-only map/auth/form adapters. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "@playwright/test";
import { build } from "esbuild";

const root = process.cwd();
const cms = path.resolve(root, "../dreamy-cms");
const start = { label: "Ollantaytambo", coordinates: [-72.27, -13.26] };
const end = { label: "Km 104", coordinates: [-72.51, -13.18] };
const original = {
	documentId: "isolated-tour",
	locale: "es",
	tab: {
		maps: {
			mapstops: [
				{
					id: 11,
					order: 1,
					title: "Day 1",
					routePlan: {
						version: 1,
						start,
						legs: [{ id: "rail", destination: end, mode: "train" }],
					},
				},
				{
					id: 22,
					order: 2,
					title: "Day 2",
					routePlan: {
						version: 1,
						start: end,
						legs: [{ id: "bus", destination: start, mode: "bus" }],
					},
				},
			],
		},
	},
};
let saved = structuredClone(original);
let saveCount = 0;
let routingRequests = 0;
let releaseRouting;
let routingObserver;
let bundles = {};
const server = createServer(async (request, response) => {
	const url = new URL(request.url, "http://fixture");
	const reply = (data, type = "application/json") => {
		response.setHeader("Content-Type", type);
		response.end(type === "application/json" ? JSON.stringify(data) : data);
	};
	if (url.pathname === "/api/cms/session") return reply({ ok: true });
	if (url.pathname.startsWith("/content-manager/"))
		return reply({ data: saved });
	if (url.pathname === "/fixture-save" && request.method === "PUT") {
		let body = "";
		for await (const chunk of request) body += chunk;
		saved = JSON.parse(body);
		for (const day of saved.tab.maps.mapstops)
			if (day.routePlan) delete day.routePlan._baseRevision;
		saveCount++;
		return reply({ data: saved });
	}
	if (url.pathname === "/api/tour-places")
		return reply({
			places: [{ label: "Nuevo punto", coordinates: [-72.28, -13.27] }],
		});
	if (url.pathname === "/api/tour-route") {
		routingRequests++;
		routingObserver?.();
		await new Promise((resolve) => {
			releaseRouting = resolve;
		});
		return reply({
			provider: "openrouteservice",
			coordinates: [
				url.searchParams.get("from").split(",").map(Number),
				url.searchParams.get("to").split(",").map(Number),
			],
		});
	}
	if (["/parent.js", "/editor.js", "/public.js"].includes(url.pathname))
		return reply(bundles[url.pathname], "text/javascript");
	if (url.pathname === "/cms/map-editor")
		return reply(
			'<!doctype html><div id="root"></div><script type="module" src="/editor.js"></script>',
			"text/html",
		);
	reply(
		'<!doctype html><div id="root"></div><script type="module" src="/parent.js"></script>',
		"text/html",
	);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const mapStub = `import React,{useEffect,forwardRef} from 'react';
const sources={};window.fixtureNativeSources=sources;const handlers=new Map();const map={addSource:(id,source)=>{sources[id]={data:source.data,setData(data){this.data=data}}},getSource:id=>sources[id],removeSource:id=>{delete sources[id]},addLayer(){},getLayer:()=>null,removeLayer(){},setPaintProperty(){},addImage(){},hasImage:()=>false,removeImage(){},getStyle:()=>({layers:[],sources}),on:(event,fn)=>handlers.set(event,fn),off:(event,fn)=>{if(handlers.get(event)===fn)handlers.delete(event)},flyTo(){},fitBounds(){},resize(){},getContainer:()=>document.getElementById('root'),getZoom:()=>10,project:([lng,lat])=>({x:lng*100,y:lat*100})};
export const useMap=()=>({map,isLoaded:true});
export const MapView=forwardRef(function MapView({children},ref){useEffect(()=>{if(ref)ref.current=map},[]);return <div><button type="button" data-testid="map-canvas" onClick={()=>handlers.get('click')?.({lngLat:{lng:-72.28,lat:-13.27}})}>Mapa de prueba</button>{children}</div>});
export const MapMarker=({children,onClick})=><div onClick={onClick}>{children}</div>;
export const MarkerContent=({children})=><>{children}</>;
export const MarkerTooltip=({children})=><>{children}</>;
export const MapPopup=({children})=><>{children}</>;
export const MapControls=()=>null;
export const MapArc=()=>null;
export const MapRoute=({id,coordinates})=><output data-testid={'route-'+id}>{JSON.stringify(coordinates)}</output>;`;
const formStub = `import React,{createContext,useContext} from 'react';export const FixtureForm=createContext(null);export const useForm=(label,select)=>select(useContext(FixtureForm));export const useAuth=()=> 'fixture-token';`;
const plugin = {
	name: "isolated-adapters",
	setup(b) {
		b.onResolve({ filter: /^@\/components\/ui\/map$/ }, () => ({
			path: "map",
			namespace: "fixture",
		}));
		b.onResolve({ filter: /^@strapi\/strapi\/admin$/ }, () => ({
			path: "form",
			namespace: "fixture",
		}));
		b.onResolve({ filter: /^fixture-form$/ }, () => ({
			path: "form",
			namespace: "fixture",
		}));
		b.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
			contents: args.path === "map" ? mapStub : formStub,
			loader: "tsx",
			resolveDir: root,
		}));
		b.onResolve({ filter: /^react(?:\/.*)?$/ }, (args) => ({
			path: import.meta
				.resolve(args.path)
				.replace("file:///", "")
				.replaceAll("/", path.sep),
		}));
	},
};
const options = {
	bundle: true,
	write: false,
	format: "esm",
	platform: "browser",
	jsx: "automatic",
	plugins: [plugin],
	alias: { "@": path.join(root, "src") },
	define: {
		"process.env.NODE_ENV": '"test"',
		"process.env.STRAPI_ADMIN_TOUR_MAP_FRONTEND_URL": JSON.stringify(origin),
		"import.meta.env": JSON.stringify({
			DEV: true,
			PUBLIC_MAPTILER_KEY: "",
			VITE_STRAPI_URL: origin,
		}),
	},
	logLevel: "silent",
};
try {
	const parent = await build({
		...options,
		stdin: {
			resolveDir: root,
			loader: "tsx",
			contents: `
import React,{useEffect,useState} from 'react';import {createRoot} from 'react-dom/client';import {FixtureForm} from 'fixture-form';import Input from ${JSON.stringify(path.join(cms, "src/admin/tour-route-input.tsx"))};
function App(){const [values,setValues]=useState(${JSON.stringify(original)});const [initialValues,setInitial]=useState(values);const [isSubmitting,setSubmitting]=useState(false);const [day,setDay]=useState(0);const [generation,setGeneration]=useState(0);
window.fixtureValues=values;
useEffect(()=>{const listener=e=>{if(e.data?.type==='dreamy-route-change')window.lastChildMessage=e.data;};window.addEventListener('message',listener);return()=>window.removeEventListener('message',listener)},[]);
const onChange=e=>setValues(old=>{const next=structuredClone(old);next.tab.maps.mapstops[day].routePlan=e.target.value;return next});
const save=async()=>{setSubmitting(true);const r=await fetch('/fixture-save',{method:'PUT',body:JSON.stringify(values)});const b=await r.json();setValues(b.data);setInitial(b.data);setSubmitting(false)};
return <FixtureForm.Provider value={{values,initialValues,isSubmitting}}><button onClick={save}>Guardar fixture</button><button onClick={()=>setDay(day===0?1:0)}>Cambiar día fixture</button><button onClick={()=>setGeneration(n=>n+1)}>Reabrir fixture</button><Input key={day+'-'+generation} name={'tab.maps.mapstops.'+day+'.routePlan'} value={values.tab.maps.mapstops[day].routePlan} onChange={onChange}/></FixtureForm.Provider>};createRoot(document.getElementById('root')).render(<App/>);`,
		},
	});
	const editor = await build({
		...options,
		stdin: {
			resolveDir: root,
			loader: "tsx",
			contents: `import React from 'react';import{createRoot}from'react-dom/client';import Editor from './src/components/tours/RoutePlanEditor';window.addEventListener('message',e=>{if(e.data?.type==='dreamy-route-init'){window.lastInit=e.data;window.initialInit??=structuredClone(e.data)}});createRoot(document.getElementById('root')).render(<Editor cmsOrigin=${JSON.stringify(origin)}/>);`,
		},
	});
	bundles = {
		"/parent.js": parent.outputFiles[0].text,
		"/editor.js": editor.outputFiles[0].text,
	};
	const browser = await chromium.launch({ headless: true });
	try {
		const page = await browser.newPage();
		page.setDefaultTimeout(12000);
		const errors = [];
		page.on("pageerror", (e) => {
			errors.push(e.message);
			console.error("BROWSER ERROR", e.message);
		});
		page.on("console", (msg) => {
			if (msg.type() === "error") console.error("BROWSER", msg.text());
		});
		await page.route("**/*", (route) =>
			new URL(route.request().url()).origin === origin
				? route.continue()
				: route.abort(),
		);
		await page.goto(origin);
		const frame = () => page.frameLocator("iframe");
		await frame()
			.getByRole("button", { name: "Cambiar ubicación", exact: true })
			.waitFor();
		await frame()
			.getByRole("button", { name: "Cambiar ubicación", exact: true })
			.isEnabled();
		const gpx = Buffer.from(
			'<?xml version="1.0"?><gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1"><trk><trkseg><trkpt lat="-13.26" lon="-72.27"/><trkpt lat="-13.2" lon="-72.4"/><trkpt lat="-13.18" lon="-72.51"/></trkseg></trk></gpx>',
		);
		await frame().locator("input[type=file]").setInputFiles({
			name: "ferrocarril.gpx",
			mimeType: "application/gpx+xml",
			buffer: gpx,
		});
		await frame()
			.getByText("GPX cargado · pendiente de guardar", { exact: true })
			.waitFor();
		assert.equal(
			saved.tab.maps.mapstops[0].routePlan.legs[0].geometry,
			undefined,
		);
		await page.getByRole("button", { name: "Guardar fixture" }).click();
		await frame().getByText("GPX guardado", { exact: true }).waitFor();
		assert.equal(
			saved.tab.maps.mapstops[0].routePlan.legs[0].geometry.length,
			3,
		);
		assert.equal(
			saved.tab.maps.mapstops[0].routePlan.legs[0].geometryMeta.fileName,
			"ferrocarril.gpx",
		);
		const persisted = structuredClone(saved.tab.maps.mapstops[0].routePlan);
		// Real public MapTab/TransportRoute with the saved JSON; only MapLibre rendering is adapted.
		const publicBundle = await build({
			...options,
			stdin: {
				resolveDir: root,
				loader: "tsx",
				contents: `import React from 'react';import{createRoot}from'react-dom/client';import MapTab from './src/components/tours/MapTab';createRoot(document.getElementById('root')).render(<MapTab lang="es" mapStops={${JSON.stringify(saved.tab.maps.mapstops)}}/>);`,
			},
		});
		bundles["/public.js"] = publicBundle.outputFiles[0].text;
		const publicPage = await browser.newPage();
		publicPage.setDefaultTimeout(12000);
		publicPage.on("pageerror", (error) => {
			errors.push(error.message);
			console.error("PUBLIC ERROR", error.message);
		});
		await publicPage.route("**/*", (route) =>
			new URL(route.request().url()).origin === origin
				? route.continue()
				: route.abort(),
		);
		await publicPage.route("**/api/tour-route?*", (route) =>
			route.fulfill({ status: 503, json: { error: "fixture_no_route" } }),
		);
		await publicPage.goto(origin);
		await publicPage.setContent(
			'<div id="root"></div><script type="module" src="/public.js"></script>',
		);
		await publicPage.waitForFunction(() =>
			Object.entries(window.fixtureNativeSources).some(
				([id, source]) =>
					id.startsWith("railway-") && source.data.features.length,
			),
		);
		const rendered = await publicPage.evaluate(
			() =>
				Object.entries(window.fixtureNativeSources).find(([id]) =>
					id.startsWith("railway-"),
				)[1].data.features[0].geometry.coordinates,
		);
		assert.deepEqual(rendered, persisted.legs[0].geometry);
		await publicPage.close();
		await page.getByRole("button", { name: "Reabrir fixture" }).click();
		await frame().getByText("GPX guardado", { exact: true }).waitFor();
		await frame()
			.getByText(/ferrocarril.gpx · 3 puntos/)
			.waitFor();
		await frame().getByTestId("map-canvas").click();
		assert.deepEqual(
			await page.evaluate(
				() => window.fixtureValues.tab.maps.mapstops[0].routePlan,
			),
			persisted,
		);
		await frame()
			.getByRole("button", { name: "Cambiar ubicación", exact: true })
			.click();
		await frame().getByTestId("map-canvas").click();
		await frame().getByRole("dialog").waitFor();
		await frame()
			.getByRole("button", { name: "Cancelar", exact: true })
			.click();
		assert.deepEqual(
			await page.evaluate(
				() => window.fixtureValues.tab.maps.mapstops[0].routePlan,
			),
			persisted,
		);
		// Even a replacement with identical coordinates requires explicit confirmation.
		await frame().locator("input[type=file]").setInputFiles({
			name: "replacement.gpx",
			mimeType: "application/gpx+xml",
			buffer: gpx,
		});
		await frame().getByRole("dialog").waitFor();
		await frame()
			.getByRole("button", { name: "Cancelar", exact: true })
			.click();
		assert.deepEqual(
			await page.evaluate(
				() => window.fixtureValues.tab.maps.mapstops[0].routePlan,
			),
			persisted,
		);
		// An old parent init cannot replace pending edits; other day identity cannot replace either.
		await frame().getByRole("textbox").last().fill("Salida renombrada");
		await page.waitForFunction(
			() =>
				window.fixtureValues.tab.maps.mapstops[0].routePlan.start.label ===
				"Salida renombrada",
		);
		const dirty = await page.evaluate(
			() => window.fixtureValues.tab.maps.mapstops[0].routePlan,
		);
		const child = page
			.frames()
			.find((f) => f.url().includes("/cms/map-editor"));
		const oldInit = await child.evaluate(() => window.initialInit);
		await page.evaluate(
			({ msg, origin }) =>
				document.querySelector("iframe").contentWindow.postMessage(msg, origin),
			{ msg: oldInit, origin },
		);
		await page.evaluate(
			({ msg, origin }) =>
				document.querySelector("iframe").contentWindow.postMessage(
					{
						...msg,
						identity: { ...msg.identity, dayKey: "22" },
						sequence: 999,
					},
					origin,
				),
			{ msg: oldInit, origin },
		);
		await frame()
			.getByRole("textbox")
			.last()
			.evaluate((el) => {
				if (el.value !== "Salida renombrada")
					throw Error("Stale init overwrote edits");
			});
		assert.deepEqual(
			await page.evaluate(
				() => window.fixtureValues.tab.maps.mapstops[0].routePlan,
			),
			dirty,
		);
		await page.getByRole("button", { name: "Guardar fixture" }).click();
		await frame().getByText("GPX guardado", { exact: true }).waitFor();
		const day1 = structuredClone(saved.tab.maps.mapstops[0].routePlan);
		const beforeSwitch = page
			.frames()
			.find((f) => f.url().includes("/cms/map-editor"));
		await beforeSwitch.evaluate(() => {
			const original = File.prototype.text;
			File.prototype.text = async function () {
				await new Promise((resolve) => {
					window.releaseFileRead = resolve;
				});
				return original.call(this);
			};
		});
		await frame().locator("input[type=file]").setInputFiles({
			name: "late-file.gpx",
			mimeType: "application/gpx+xml",
			buffer: gpx,
		});
		await beforeSwitch.waitForFunction(() => !!window.releaseFileRead);
		// A same-context server synchronization invalidates an in-progress file read.
		const synchronization = await beforeSwitch.evaluate(() => window.lastInit);
		await page.evaluate(
			({ msg, origin }) =>
				document
					.querySelector("iframe")
					.contentWindow.postMessage(
						{ ...msg, sequence: msg.sequence + 1, disabled: true },
						origin,
					),
			{ msg: synchronization, origin },
		);
		await beforeSwitch.evaluate(() => window.releaseFileRead());
		await frame()
			.getByText(/La lectura del archivo quedó desactualizada/)
			.waitFor();
		assert.deepEqual(saved.tab.maps.mapstops[0].routePlan, day1);
		await page.getByRole("button", { name: "Cambiar día fixture" }).click();
		await frame()
			.getByRole("button", { name: "1. Ollantaytambo", exact: true })
			.click();
		await frame().getByRole("textbox").last().fill("Destino día 2 editado");
		await page.waitForFunction(
			() =>
				window.fixtureValues.tab.maps.mapstops[1].routePlan.legs[0].destination
					.label === "Destino día 2 editado",
		);
		// Replay a genuine previous child message from the new iframe: identity prevents cross-day write.
		const oldMessage = await page.evaluate(() => window.lastChildMessage);
		const day2frame = page
			.frames()
			.find((f) => f.url().includes("/cms/map-editor"));
		await day2frame.evaluate(
			({ msg, origin }) =>
				window.parent.postMessage(
					{
						...msg,
						identity: { ...msg.identity, dayKey: "11" },
						sequence: 999,
					},
					origin,
				),
			{ msg: oldMessage, origin },
		);
		await page.getByRole("button", { name: "Guardar fixture" }).click();
		await frame()
			.getByText("Guardado · verificado mediante lectura del servidor", {
				exact: true,
			})
			.waitFor();
		assert.deepEqual(saved.tab.maps.mapstops[0].routePlan, day1);
		const requestsBefore = routingRequests;
		const routingStarted = new Promise((resolve) => {
			routingObserver = resolve;
		});
		await frame()
			.getByRole("button", { name: "Comprobar recorrido", exact: true })
			.click();
		await routingStarted;
		routingObserver = null;
		assert.equal(routingRequests, requestsBefore + 1);
		await page.getByRole("button", { name: "Cambiar día fixture" }).click();
		await frame().getByText("GPX guardado", { exact: true }).waitFor();
		releaseRouting();
		// Add/reorder a new visit without changing the existing GPX or inventing geometry.
		await frame()
			.getByRole("button", { name: "Añadir visita", exact: true })
			.click();
		await page.waitForFunction(
			() =>
				window.fixtureValues.tab.maps.mapstops[0].routePlan.legs.length === 2,
		);
		const added = await page.evaluate(
			() => window.fixtureValues.tab.maps.mapstops[0].routePlan,
		);
		assert.deepEqual(added.legs[0].geometry, persisted.legs[0].geometry);
		if (
			await frame()
				.getByRole("button", { name: "Cambiar ubicación", exact: true })
				.count()
		)
			await frame()
				.getByRole("button", { name: "Cambiar ubicación", exact: true })
				.click();
		await frame().getByTestId("map-canvas").click();
		await page.waitForFunction(
			() =>
				window.fixtureValues.tab.maps.mapstops[0].routePlan.legs[1].destination
					.coordinates[0] === -72.28,
		);
		await frame()
			.getByRole("button", { name: "Subir tramo 2", exact: true })
			.click();
		await frame().getByRole("dialog").waitFor();
		await frame()
			.getByRole("button", { name: "Cancelar", exact: true })
			.click();
		assert.equal(
			(
				await page.evaluate(
					() => window.fixtureValues.tab.maps.mapstops[0].routePlan,
				)
			).legs[0].id,
			"rail",
		);
		await frame()
			.getByRole("button", { name: "Eliminar tramo 2", exact: true })
			.click();
		await page.waitForFunction(
			() =>
				window.fixtureValues.tab.maps.mapstops[0].routePlan.legs.length === 1,
		);
		assert.equal(
			(
				await page.evaluate(
					() => window.fixtureValues.tab.maps.mapstops[1].routePlan,
				)
			).legs[0].geometry,
			undefined,
		);
		// Removing a visit is confirmed and its old GPX remains downloadable from archive.
		await frame()
			.getByRole("button", { name: "Eliminar tramo 1", exact: true })
			.click();
		await frame().getByRole("dialog").waitFor();
		await frame()
			.getByRole("button", { name: "Conservar anterior y continuar" })
			.click();
		await page.waitForFunction(
			() =>
				window.fixtureValues.tab.maps.mapstops[0].routePlan.legs.length === 0,
		);
		const removed = await page.evaluate(
			() => window.fixtureValues.tab.maps.mapstops[0].routePlan,
		);
		assert.equal(removed.legs.length, 0);
		assert.deepEqual(
			removed.archivedLegs[0].geometry,
			persisted.legs[0].geometry,
		);
		await frame()
			.getByText(/Trazados anteriores conservados/)
			.click();
		await frame()
			.getByRole("button", { name: "Descargar GPX anterior 1" })
			.waitFor();
		const downloadPromise = page.waitForEvent("download");
		await frame()
			.getByRole("button", { name: "Descargar GPX anterior 1" })
			.click();
		const download = await downloadPromise;
		const downloaded = await readFile(await download.path(), "utf8");
		assert.equal((downloaded.match(/<trkpt /g) || []).length, 3);
		assert.deepEqual(errors, []);
		console.log(
			JSON.stringify(
				{
					result: "PASS",
					realEditor: true,
					realStrapiInput: true,
					saveCount,
					cases: [
						"GPX import metadata",
						"server reread before saved label",
						"reopen",
						"public MapTab passes saved geometry unchanged to native railway source",
						"accidental map click",
						"cancel location edit",
						"cancel identical GPX replacement",
						"stale parent init",
						"wrong day init",
						"wrong day child message",
						"late GPX file read rejected",
						"day 2 isolation",
						"late routing response after day switch",
						"add visit preserves GPX",
						"cancel reorder",
						"confirmed deletion retains downloadable geometry",
						"actual GPX download",
					],
					adapters: [
						"map renderer",
						"Strapi form/auth hooks",
						"HTTP fixture storage",
					],
					productionAccess: false,
				},
				null,
				2,
			),
		);
	} finally {
		await browser.close();
	}
} finally {
	await new Promise((resolve) => server.close(resolve));
}
