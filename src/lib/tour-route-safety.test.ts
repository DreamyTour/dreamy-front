import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { routeContent, sameRouteIdentity } from "./tour-route-contract";
import {
	normalizeTourRoutePlan,
	routePlanSegments,
	type TourRoutePlan,
} from "./tour-route-plan";
import {
	affectedGeometries,
	preserveRouteGeometries,
	routeDistanceMetres,
	routeGpx,
} from "./tour-route-safety";

const fixture = (): TourRoutePlan => ({
	version: 1,
	start: { label: "Cusco", coordinates: [-71.98, -13.52] },
	legs: [
		{
			id: "a",
			destination: { label: "Ollantaytambo", coordinates: [-72.27, -13.26] },
			mode: "bus",
			geometry: [
				[-71.98, -13.52],
				[-72.27, -13.26],
			],
		},
		{
			id: "b",
			destination: { label: "Km 104", coordinates: [-72.51, -13.18] },
			mode: "train",
			geometry: [
				[-72.27, -13.26],
				[-72.51, -13.18],
			],
			provider: "GPX verificado por el editor",
		},
		{
			id: "c",
			destination: { label: "Visita", coordinates: [-72.52, -13.19] },
			mode: "walking",
			geometry: [
				[-72.51, -13.18],
				[-72.52, -13.19],
			],
		},
	],
});
describe("preserving saved tour routes", () => {
	test("identical GPX points with a new filename retain the original filename in the archive", () => {
		const old = fixture();
		old.legs[1].geometryMeta = { source: "gpx", fileName: "original.gpx" };
		const next = structuredClone(old);
		next.legs[1].geometryMeta = { source: "gpx", fileName: "replacement.gpx" };
		const safe = preserveRouteGeometries(old, next);
		expect(safe.legs[1].geometryMeta?.fileName).toBe("replacement.gpx");
		expect(safe.archivedLegs?.[0].geometryMeta?.fileName).toBe("original.gpx");
		expect(safe.archivedLegs?.[0].geometry).toEqual(old.legs[1].geometry);
	});
	test("a changed inherited origin is reviewable even inside the old wide endpoint tolerance", () => {
		const old = fixture();
		old.legs[0].geometryMeta = {
			status: "valid",
			mode: "bus",
			from: old.start?.coordinates,
			to: old.legs[0].destination.coordinates,
		};
		const inherited = {
			label: "New previous day end",
			coordinates: [-71.981, -13.52] as [number, number],
		};
		expect(routePlanSegments(old, inherited)[0].coordinates).toBeNull();
		expect(routePlanSegments(old, inherited)[0].requiresReview).toBe(true);
		expect(old.legs[0].geometry).toHaveLength(2);
	});
	test("explicitly reviewing a retained route rebinds it without changing any point", () => {
		const old = fixture();
		old.legs[0].geometryMeta = {
			status: "review",
			mode: "bus",
			from: [-71.981, -13.52],
		};
		const reviewed = structuredClone(old);
		reviewed.legs[0].geometryMeta = {
			...reviewed.legs[0].geometryMeta,
			status: "valid",
		};
		const safe = preserveRouteGeometries(old, reviewed);
		expect(safe.legs[0].geometryMeta?.status).toBe("valid");
		expect(routePlanSegments(safe, null)[0].coordinates).toEqual(
			old.legs[0].geometry ?? null,
		);
	});
	test("changing start preserves ALL coordinates and flags only affected leg", () => {
		const old = fixture();
		const next = {
			...old,
			start: {
				label: "Otro acceso",
				coordinates: [-71.981, -13.52] as [number, number],
			},
		};
		expect(affectedGeometries(old, next)).toBe(1);
		const safe = preserveRouteGeometries(old, next);
		expect(safe.legs.map((l) => l.geometry)).toEqual(
			old.legs.map((l) => l.geometry),
		);
		expect(safe.legs[0].geometryMeta?.status).toBe("review");
		expect(safe.legs[1].geometryMeta).toBeUndefined();
		expect(routePlanSegments(safe, null)[0].requiresReview).toBe(true);
		expect(routePlanSegments(safe, null)[0].coordinates).toBeNull();
	});
	test("removing a visit archives its geometry and retains unrelated routes", () => {
		const old = fixture();
		const safe = preserveRouteGeometries(old, {
			...old,
			legs: old.legs.slice(1),
		});
		expect(safe.archivedLegs?.[0].geometry).toEqual(old.legs[0].geometry);
		expect(safe.legs[0].geometry).toEqual(old.legs[1].geometry);
		expect(safe.legs[1]).toEqual(old.legs[2]);
	});
	test("reorder and insertion flag bindings without destroying geometry", () => {
		const old = fixture();
		const reordered = preserveRouteGeometries(old, {
			...old,
			legs: [old.legs[1], old.legs[0], old.legs[2]],
		});
		expect(reordered.legs.every((l) => l.geometry)).toBe(true);
		const inserted = preserveRouteGeometries(old, {
			...old,
			legs: [
				...old.legs,
				{ id: "new", mode: "walking", destination: old.legs[2].destination },
			],
		});
		expect(inserted.legs.slice(0, 3)).toEqual(old.legs);
	});
	test("replacement archives original GPX including its filename", () => {
		const old = fixture();
		old.legs[1].geometryMeta = { source: "gpx", fileName: "original.gpx" };
		const next = structuredClone(old);
		next.legs[1].geometry = [
			[-72.27, -13.26],
			[-72.4, -13.2],
			[-72.51, -13.18],
		];
		const safe = preserveRouteGeometries(old, next);
		expect(safe.archivedLegs?.[0].geometryMeta?.fileName).toBe("original.gpx");
		expect(safe.archivedLegs?.[0].geometry).toEqual(old.legs[1].geometry);
	});
	test("old plans and unknown additive metadata survive normalization", () => {
		const old = fixture();
		const extra = { ...old, customFutureField: { retained: true } };
		expect(normalizeTourRoutePlan(extra)).toMatchObject(extra);
		const bad = structuredClone(old);
		bad.legs[0].geometry = [
			[999, 0],
			[0, 0],
		];
		expect(normalizeTourRoutePlan(bad)).toBeNull();
		expect(bad.legs[0].geometry[0][0]).toBe(999);
	});
	test("download uses saved points, escapes text and does not invent connectors", () => {
		const leg = fixture().legs[1];
		leg.destination.label = "A & <B>";
		const xml = routeGpx(leg);
		expect(xml).toContain("A &amp; &lt;B&gt;");
		expect(xml.match(/<trkseg>/g)?.length).toBe(1);
		expect(xml.match(/<trkpt /g)?.length).toBe(leg.geometry?.length);
		expect(routeDistanceMetres(leg.geometry)).toBeGreaterThan(20000);
	});
	test("wire contract rejects other days and canonicalizes transient lock tokens", () => {
		const a = {
			documentId: "doc",
			locale: "es",
			dayKey: "1",
			sessionId: "session",
		};
		expect(sameRouteIdentity(a, { ...a, dayKey: "2" })).toBe(false);
		expect(sameRouteIdentity(a, { ...a, sessionId: "old" })).toBe(false);
		expect(routeContent({ ...fixture(), _baseRevision: "hash" })).toBe(
			routeContent(fixture()),
		);
		// The frontend can be checked out alone in CI; compare when both repos exist.
		if (existsSync("../dreamy-cms/src/shared/tour-route-contract.ts")) {
			expect(
				readFileSync(
					new URL("./tour-route-contract.ts", import.meta.url),
					"utf8",
				),
			).toBe(
				readFileSync("../dreamy-cms/src/shared/tour-route-contract.ts", "utf8"),
			);
		}
	});
});
