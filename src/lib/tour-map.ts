import type { MapStop } from "@/types/tours";
import { routePlanDestination } from "./tour-route-plan";

export function normalizeTourMapCoordinate(value: unknown, maximum: number) {
	if (
		value === null ||
		value === undefined ||
		(typeof value === "string" && !value.trim())
	)
		return null;
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
	const planned = routePlanDestination(candidate.routePlan);

	return (
		Number.isInteger(order) &&
		order > 0 &&
		typeof candidate.title === "string" &&
		candidate.title.trim().length > 0 &&
		(planned !== null ||
			(normalizeTourMapCoordinate(candidate.latitude, 90) !== null &&
				normalizeTourMapCoordinate(candidate.longitude, 180) !== null))
	);
}
