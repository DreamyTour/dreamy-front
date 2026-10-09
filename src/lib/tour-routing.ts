import {
	normalizeRouteGeometry,
	type RouteCoordinate,
} from "./tour-map-transport";

export type AutomaticTransport = "bus" | "walking";
export interface TourRoutingRequest {
	mode: AutomaticTransport;
	from: RouteCoordinate;
	to: RouteCoordinate;
}
export interface CalculatedTourRoute {
	coordinates: RouteCoordinate[];
	provider: "OSRM" | "openrouteservice";
}

export class TourRoutingError extends Error {
	constructor(
		public code:
			| "invalid_request"
			| "not_configured"
			| "no_route"
			| "unavailable",
		public status: number,
	) {
		super(code);
	}
}

export function parseTourRoutingRequest(
	params: URLSearchParams,
): TourRoutingRequest {
	const mode = params.get("mode");
	if (mode !== "bus" && mode !== "walking")
		throw new TourRoutingError("invalid_request", 400);
	const parsePoint = (value: string | null): RouteCoordinate => {
		const parts = value?.split(",");
		if (!parts || parts.length !== 2 || parts.some((part) => !part.trim()))
			throw new TourRoutingError("invalid_request", 400);
		const numbers = parts.map(Number);
		const validated = normalizeRouteGeometry([numbers, numbers]);
		if (!validated) throw new TourRoutingError("invalid_request", 400);
		return validated[0].map(
			(number) => Math.round(number * 1_000_000) / 1_000_000,
		) as RouteCoordinate;
	};
	return {
		mode,
		from: parsePoint(params.get("from")),
		to: parsePoint(params.get("to")),
	};
}

// This scheduling is only used for the local demonstration provider, never
// relied on for production coordination or persistence.
let nextDemoRequest = 0;
async function paceDemoRequests() {
	const now = Date.now();
	const scheduled = Math.max(now, nextDemoRequest);
	nextDemoRequest = scheduled + 1100;
	if (scheduled > now)
		await new Promise((resolve) => setTimeout(resolve, scheduled - now));
}

export async function calculateTourRoute(
	route: TourRoutingRequest,
	options: {
		apiKey?: string;
		allowDemo?: boolean;
		signal?: AbortSignal;
		fetcher?: (input: string, init?: RequestInit) => Promise<Response>;
		paceDemo?: () => Promise<void>;
	} = {},
): Promise<CalculatedTourRoute> {
	const fetcher = options.fetcher ?? fetch;
	const key = options.apiKey?.trim();
	if (!key && !options.allowDemo)
		throw new TourRoutingError("not_configured", 503);
	if (!key) await (options.paceDemo ?? paceDemoRequests)();
	const controller = new AbortController();
	const abort = () => controller.abort();
	options.signal?.addEventListener("abort", abort, { once: true });
	if (options.signal?.aborted) controller.abort();
	const timer = setTimeout(abort, 15_000);
	try {
		let response: Response;
		if (key) {
			const profile = route.mode === "bus" ? "driving-car" : "foot-hiking";
			response = await fetcher(
				`https://api.openrouteservice.org/v2/directions/${profile}/geojson`,
				{
					method: "POST",
					signal: controller.signal,
					headers: { Authorization: key, "Content-Type": "application/json" },
					body: JSON.stringify({
						coordinates: [route.from, route.to],
						instructions: false,
					}),
				},
			);
		} else {
			const base =
				route.mode === "bus"
					? "https://routing.openstreetmap.de/routed-car"
					: "https://routing.openstreetmap.de/routed-foot";
			const points = `${route.from.join(",")};${route.to.join(",")}`;
			response = await fetcher(
				`${base}/route/v1/${route.mode === "bus" ? "driving" : "foot"}/${points}?overview=full&geometries=geojson&steps=false`,
				{
					signal: controller.signal,
					headers: {
						"User-Agent": "DreamyTours-LocalMap/1.0 (+https://dreamy.tours)",
					},
				},
			);
		}
		if (!response.ok)
			throw new TourRoutingError(
				response.status === 404 ? "no_route" : "unavailable",
				502,
			);
		const data = await response.json();
		const geometry = key
			? data.features?.[0]?.geometry
			: data.routes?.[0]?.geometry;
		const coordinates = normalizeRouteGeometry(geometry);
		if (!coordinates) throw new TourRoutingError("no_route", 422);
		// Reject paths that snap to a different distant town or disconnected road.
		const tolerance = route.mode === "walking" ? 0.01 : 0.05;
		for (const [requested, actual] of [
			[route.from, coordinates[0]],
			[route.to, coordinates[coordinates.length - 1]],
		]) {
			if (
				Math.hypot(requested[0] - actual[0], requested[1] - actual[1]) >
				tolerance
			)
				throw new TourRoutingError("no_route", 422);
		}
		return { coordinates, provider: key ? "openrouteservice" : "OSRM" };
	} catch (error) {
		if (error instanceof TourRoutingError) throw error;
		throw new TourRoutingError("unavailable", 502);
	} finally {
		clearTimeout(timer);
		options.signal?.removeEventListener("abort", abort);
	}
}
