import type { MapStop } from "@/types/tours";

export type TransportMode = NonNullable<MapStop["transportMode"]>;
export type RouteCoordinate = [number, number];
export const transportModes: TransportMode[] = [
	"walking",
	"bus",
	"train",
	"flight",
	"boat",
];
export const transportColors: Record<TransportMode, string> = {
	walking: "#16a34a",
	bus: "#2563eb",
	train: "#c2410c",
	flight: "#0891b2",
	boat: "#0284c7",
};

export function normalizeTransportMode(value: unknown): TransportMode | null {
	return transportModes.includes(value as TransportMode)
		? (value as TransportMode)
		: null;
}

/** Reject the entire malformed path rather than joining across missing points. */
export function normalizeRouteGeometry(
	value: unknown,
): RouteCoordinate[] | null {
	let candidate = value;
	if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
		const object = candidate as {
			type?: unknown;
			geometry?: unknown;
			coordinates?: unknown;
		};
		if (object.type === "Feature")
			return normalizeRouteGeometry(object.geometry);
		if (object.type !== "LineString") return null;
		candidate = object.coordinates;
	}
	if (
		!Array.isArray(candidate) ||
		candidate.length < 2 ||
		candidate.length > 20_000
	)
		return null;
	const points: RouteCoordinate[] = [];
	for (const point of candidate) {
		if (
			!Array.isArray(point) ||
			point.length < 2 ||
			typeof point[0] !== "number" ||
			typeof point[1] !== "number" ||
			!Number.isFinite(point[0]) ||
			!Number.isFinite(point[1]) ||
			Math.abs(point[0]) > 180 ||
			Math.abs(point[1]) > 90
		)
			return null;
		points.push([point[0], point[1]]);
	}
	return points;
}

export const transportLabels = {
	es: {
		walking: "Caminata",
		bus: "Bus",
		train: "Tren",
		flight: "Vuelo",
		boat: "Barco",
		approximate: "Trazado aproximado",
		calculating: "Calculando recorrido…",
		unavailable: "Recorrido no disponible",
		legend: "Transporte",
		connection: "Conexión entre destinos",
	},
	en: {
		walking: "Walking",
		bus: "Bus",
		train: "Train",
		flight: "Flight",
		boat: "Boat",
		approximate: "Approximate route",
		calculating: "Calculating route…",
		unavailable: "Route unavailable",
		legend: "Transport",
		connection: "Connection between destinations",
	},
	pt: {
		walking: "Caminhada",
		bus: "Ônibus",
		train: "Trem",
		flight: "Voo",
		boat: "Barco",
		approximate: "Traçado aproximado",
		calculating: "Calculando percurso…",
		unavailable: "Percurso indisponível",
		legend: "Transporte",
		connection: "Conexão entre destinos",
	},
};
