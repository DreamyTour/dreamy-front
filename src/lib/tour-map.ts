import type { MapStop } from "@/types/tours";

export function normalizeTourMapCoordinate(value: unknown, maximum: number) {
	const coordinate = Number(value);

	if (!Number.isFinite(coordinate)) return null;

	// Some CMS responses expose coordinates scaled to six decimal places.
	const normalized =
		Math.abs(coordinate) > maximum ? coordinate / 1_000_000 : coordinate;

	return Math.abs(normalized) <= maximum ? normalized : null;
}

export function isValidTourMapStop(stop: unknown): stop is MapStop {
	if (!stop || typeof stop !== "object") return false;

	const candidate = stop as Partial<MapStop>;
	const order = Number(candidate.order);

	return (
		Number.isInteger(order) &&
		order > 0 &&
		typeof candidate.title === "string" &&
		candidate.title.trim().length > 0 &&
		normalizeTourMapCoordinate(candidate.latitude, 90) !== null &&
		normalizeTourMapCoordinate(candidate.longitude, 180) !== null
	);
}
