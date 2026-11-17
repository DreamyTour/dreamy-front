import type { RouteCoordinate, TransportMode } from "./tour-map-transport";
import { normalizeTourRoutePlan } from "./tour-route-plan";

export interface SecondaryDay {
	id: string;
	day: string;
	routePlan?: unknown;
}
export interface SecondaryStop {
	id: string;
	dayId: string;
	day: string;
	ordinal: number;
	label: string;
	coordinates: RouteCoordinate;
	mode: TransportMode;
}

/** Read existing current legs only. Repeated visits remain independent by leg ID. */
export function secondaryStopsForDays(days: SecondaryDay[]): SecondaryStop[] {
	const plans = days.map((day) => normalizeTourRoutePlan(day.routePlan));
	return days.flatMap((day, index) => {
		const plan = plans[index];
		if (!plan) return [];
		const end = plan.legs.at(-1);
		const previous = plans[index - 1];
		const start =
			plan.start ?? previous?.legs.at(-1)?.destination ?? previous?.start;
		const closed = start?.coordinates.every(
			(n, i) =>
				Math.round(n * 1e6) ===
				Math.round((end?.destination.coordinates[i] ?? NaN) * 1e6),
		);
		const mainId = closed && plan.primaryLegId ? plan.primaryLegId : end?.id;
		return plan.legs.flatMap((leg, index) =>
			leg.kind !== "end" && leg.id !== mainId
				? [
						{
							id: `${day.id}:${leg.id}`,
							dayId: day.id,
							day: day.day,
							ordinal: index + 1,
							label: leg.destination.label,
							coordinates: leg.destination.coordinates,
							mode: leg.mode,
						},
					]
				: [],
		);
	});
}

export interface SecondaryGroup {
	id: string;
	coordinates: RouteCoordinate;
	items: SecondaryStop[];
	x: number;
	y: number;
}

/** Screen-space grouping: no geometry processing, interpolation or coordinate averaging. */
export function groupSecondaryStops(
	stops: SecondaryStop[],
	project: (point: RouteCoordinate) => { x: number; y: number },
	radius: number,
	width: number,
	height: number,
): SecondaryGroup[] {
	const cells = new Map<string, SecondaryGroup[]>();
	const groups: SecondaryGroup[] = [];
	for (const stop of stops) {
		const { x, y } = project(stop.coordinates);
		if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
		if (x < -44 || y < -44 || x > width + 44 || y > height + 44) continue;
		const cx = Math.floor(x / radius),
			cy = Math.floor(y / radius);
		let group: SecondaryGroup | undefined;
		for (let dx = -1; dx <= 1 && !group; dx++) {
			for (let dy = -1; dy <= 1 && !group; dy++) {
				group = cells
					.get(`${cx + dx}:${cy + dy}`)
					?.find((g) => Math.hypot(g.x - x, g.y - y) < radius);
			}
		}
		if (group) group.items.push(stop);
		else {
			group = {
				id: stop.id,
				coordinates: stop.coordinates,
				items: [stop],
				x,
				y,
			};
			groups.push(group);
			const key = `${cx}:${cy}`;
			cells.set(key, [...(cells.get(key) ?? []), group]);
		}
	}
	return groups;
}
