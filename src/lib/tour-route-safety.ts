import {
	normalizeRouteGeometry,
	type RouteCoordinate,
} from "./tour-map-transport";
import type { RouteLeg, TourRoutePlan } from "./tour-route-plan";
import { geometryMatchesEndpoints } from "./tour-route-plan";

export function geometryNeedsReview(
	leg: RouteLeg,
	from: RouteCoordinate | undefined,
) {
	return (
		!!leg.geometry &&
		(!from ||
			leg.geometryMeta?.status === "review" ||
			(!!leg.geometryMeta?.mode && leg.geometryMeta.mode !== leg.mode) ||
			(!!leg.geometryMeta?.from &&
				JSON.stringify(leg.geometryMeta.from) !== JSON.stringify(from)) ||
			(!!leg.geometryMeta?.to &&
				JSON.stringify(leg.geometryMeta.to) !==
					JSON.stringify(leg.destination.coordinates)) ||
			!geometryMatchesEndpoints(
				leg.geometry,
				from,
				leg.destination.coordinates,
				leg.mode,
			))
	);
}
/** Preserve every old geometry, including removed visits, inside the existing JSON field. */
export function preserveRouteGeometries(
	before: TourRoutePlan,
	after: TourRoutePlan,
): TourRoutePlan {
	const archived = [...(before.archivedLegs ?? [])];
	for (const leg of after.archivedLegs ?? []) {
		if (
			!archived.some(
				(old) =>
					old.id === leg.id &&
					old.geometryMeta?.fileName === leg.geometryMeta?.fileName &&
					JSON.stringify(old.geometry) === JSON.stringify(leg.geometry),
			)
		)
			archived.push(leg);
	}
	for (const old of before.legs) {
		if (!old.geometry) continue;
		const replacement = after.legs.find((leg) => leg.id === old.id);
		if (
			!replacement ||
			JSON.stringify(old.geometry) !== JSON.stringify(replacement.geometry) ||
			(!!old.geometryMeta?.fileName &&
				old.geometryMeta.fileName !== replacement.geometryMeta?.fileName)
		) {
			if (
				!archived.some(
					(leg) =>
						leg.id === old.id &&
						leg.geometryMeta?.fileName === old.geometryMeta?.fileName &&
						JSON.stringify(leg.geometry) === JSON.stringify(old.geometry),
				)
			)
				archived.push({
					...old,
					geometryMeta: { ...old.geometryMeta, status: "review" },
				});
		}
	}
	let previous = after.start?.coordinates;
	const legs = after.legs.map((leg) => {
		const oldIndex = before.legs.findIndex((old) => old.id === leg.id);
		const old = before.legs[oldIndex];
		const oldOrigin =
			oldIndex > 0
				? before.legs[oldIndex - 1].destination.coordinates
				: before.start?.coordinates;
		const unchangedGeometry =
			old?.geometry &&
			JSON.stringify(old.geometry) === JSON.stringify(leg.geometry);
		const changedBinding =
			unchangedGeometry &&
			(old.mode !== leg.mode ||
				JSON.stringify(old.destination.coordinates) !==
					JSON.stringify(leg.destination.coordinates) ||
				JSON.stringify(oldOrigin) !== JSON.stringify(previous));
		const acceptingReview =
			old?.geometryMeta?.status === "review" &&
			leg.geometryMeta?.status === "valid" &&
			unchangedGeometry;
		const bound =
			leg.geometry && (!unchangedGeometry || acceptingReview)
				? {
						...leg,
						geometryMeta: {
							...leg.geometryMeta,
							mode: leg.mode,
							from: previous,
							to: leg.destination.coordinates,
						},
					}
				: leg;
		const review = geometryNeedsReview(bound, previous) || changedBinding;
		previous = leg.destination.coordinates;
		return review
			? {
					...bound,
					geometryMeta: { ...bound.geometryMeta, status: "review" as const },
				}
			: bound;
	});
	return {
		...after,
		legs,
		...(archived.length ? { archivedLegs: archived } : {}),
	};
}
export function affectedGeometries(
	before: TourRoutePlan,
	after: TourRoutePlan,
): number {
	return before.legs.filter((old, index) => {
		if (!old.geometry) return false;
		const nextIndex = after.legs.findIndex((leg) => leg.id === old.id);
		if (nextIndex < 0) return true;
		const next = after.legs[nextIndex];
		const origin = index
			? before.legs[index - 1].destination.coordinates
			: before.start?.coordinates;
		const nextOrigin = nextIndex
			? after.legs[nextIndex - 1].destination.coordinates
			: after.start?.coordinates;
		return (
			next.mode !== old.mode ||
			JSON.stringify(next.geometry) !== JSON.stringify(old.geometry) ||
			JSON.stringify(next.destination.coordinates) !==
				JSON.stringify(old.destination.coordinates) ||
			JSON.stringify(origin) !== JSON.stringify(nextOrigin)
		);
	}).length;
}
export function routeDistanceMetres(value: unknown) {
	const points = normalizeRouteGeometry(value);
	if (!points) return 0;
	let total = 0;
	for (let i = 1; i < points.length; i++) {
		const [a, b] = [points[i - 1], points[i]];
		const lat1 = (a[1] * Math.PI) / 180,
			lat2 = (b[1] * Math.PI) / 180;
		const h =
			Math.sin((lat2 - lat1) / 2) ** 2 +
			Math.cos(lat1) *
				Math.cos(lat2) *
				Math.sin(((b[0] - a[0]) * Math.PI) / 360) ** 2;
		total += 6371008.8 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
	}
	return total;
}
export function routeGpx(leg: RouteLeg) {
	const geometry = normalizeRouteGeometry(leg.geometry);
	if (!geometry)
		throw Error("La geometría no es válida; no se ha modificado el original.");
	const escapeXml = (value: string) =>
		value.replace(
			/[<>&"']/g,
			(s) =>
				({
					"<": "&lt;",
					">": "&gt;",
					"&": "&amp;",
					'"': "&quot;",
					"'": "&apos;",
				})[s] ?? s,
		);
	return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Dreamy Tours" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>${escapeXml(leg.destination.label)}</name><trkseg>${geometry.map(([lon, lat]) => `<trkpt lat="${lat}" lon="${lon}"/>`).join("")}</trkseg></trk></gpx>`;
}
