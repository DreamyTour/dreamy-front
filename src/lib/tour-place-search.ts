import { normalizeRoutePlace, type RoutePlace } from "./tour-route-plan";

interface Feature {
	properties?: Record<string, unknown>;
	geometry?: { coordinates?: unknown };
}
export interface SearchPlace extends RoutePlace {
	countryCode: string;
}
const text = (value: unknown) =>
	typeof value === "string" ? value.trim() : "";
const normalized = (value: string) =>
	value
		.normalize("NFD")
		.replace(/\p{M}/gu, "")
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, " ")
		.trim();
export function placeFeatures(
	features: unknown,
	source: "ors" | "photon",
): SearchPlace[] {
	if (!Array.isArray(features)) return [];
	return features.slice(0, 30).flatMap((feature: Feature) => {
		if (!feature || typeof feature !== "object") return [];
		const p = feature.properties ?? {};
		const countryCode = text(p.country_a || p.countrycode).toUpperCase();
		const country = ["PER", "PE"].includes(countryCode)
			? "Perú"
			: text(p.country);
		const parts =
			source === "ors"
				? [text(p.name), text(p.locality), text(p.region), country]
				: [text(p.name), text(p.city), text(p.state), country];
		const label =
			[...new Set(parts.filter(Boolean))].join(", ") || text(p.label);
		const place = normalizeRoutePlace({
			label,
			coordinates: feature.geometry?.coordinates,
		});
		return place ? [{ ...place, countryCode }] : [];
	});
}
export function mergeSearchPlaces(
	query: string,
	groups: SearchPlace[][],
): RoutePlace[] {
	const tokens = normalized(query)
		.split(" ")
		.filter(
			(token) =>
				!["de", "del", "la", "el", "los", "las", "peru"].includes(token),
		);
	const score = (place: SearchPlace) => {
		const label = normalized(place.label);
		const matches = tokens.filter((token) => label.includes(token)).length;
		return (
			(tokens.length && matches === tokens.length ? 100 : 0) +
			matches * 10 +
			(["PE", "PER"].includes(place.countryCode) ? 20 : 0)
		);
	};
	const result: SearchPlace[] = [];
	for (const place of groups.flat().sort((a, b) => score(b) - score(a))) {
		if (
			result.some(
				(other) =>
					normalized(other.label.split(",")[0]) ===
						normalized(place.label.split(",")[0]) &&
					Math.hypot(
						other.coordinates[0] - place.coordinates[0],
						other.coordinates[1] - place.coordinates[1],
					) < 0.002,
			)
		)
			continue;
		result.push(place);
	}
	return result
		.slice(0, 10)
		.map(({ label, coordinates }) => ({ label, coordinates }));
}
