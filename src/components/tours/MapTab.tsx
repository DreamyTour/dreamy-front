import { Clock, Route } from "lucide-react";
import type { Map as MapLibreMap } from "maplibre-gl";
import * as React from "react";
import {
	MapArc,
	type MapArcDatum,
	MapControls,
	MapMarker,
	MapPopup,
	MarkerContent,
	MarkerTooltip,
	MapView as TourMap,
	useMap,
} from "@/components/ui/map";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { MapStop } from "@/types/tours";

type TourMapStopSource = Omit<MapStop, "id"> & {
	id: string;
};

type TourMapStop = TourMapStopSource & {
	day: string;
	dayNumber: string;
};

interface TourRouteSegment extends MapArcDatum {
	id: string;
	label: string;
	from: [number, number];
	to: [number, number];
	fromStop: TourMapStop;
	toStop: TourMapStop;
}

const TOUR_ROUTE_COLOR = "#16a34a";

const dayPrefixes: Record<Lang, string> = {
	es: "DIA",
	en: "DAY",
	pt: "DIA",
};

const glassPanelClass =
	"bg-white/72 text-slate-900 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.72)] backdrop-blur-2xl ring-0";

function FitTourBounds({
	bounds,
}: {
	bounds: [[number, number], [number, number]];
}) {
	const { map } = useMap();

	React.useEffect(() => {
		if (!map) return;

		map.fitBounds(bounds, {
			padding: { top: 72, right: 72, bottom: 72, left: 72 },
			maxZoom: 8.4,
			duration: 0,
		});
	}, [bounds, map]);

	return null;
}

function Pin({
	active,
	number,
	label,
}: {
	active: boolean;
	number: string;
	label: string;
}) {
	return (
		<button
			type="button"
			aria-label={label}
			className={cn(
				"flex items-center justify-center rounded-full text-sm font-extrabold text-white shadow-[0_18px_34px_-20px_rgba(15,23,42,0.85)] transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-green-500/70",
				active
					? "h-10 w-10 scale-110 bg-green-700 ring-4 ring-green-500/35"
					: "h-8 w-8 bg-black ring-4 ring-white/90 hover:bg-green-700",
			)}
		>
			{number}
		</button>
	);
}

function normalizeMapStops(mapStops: MapStop[]): TourMapStopSource[] {
	return mapStops
		.map((stop) => ({
			id: `map-stop-${stop.id}`,
			order: Number(stop.order),
			title: stop.title?.trim() || "",
			description: stop.description?.trim() || "",
			duration: stop.duration?.trim() || "",
			routeText: stop.routeText?.trim() || "",
			latitude: Number(stop.latitude),
			longitude: Number(stop.longitude),
		}))
		.filter(
			(stop) =>
				Number.isFinite(stop.order) &&
				stop.title &&
				Number.isFinite(stop.latitude) &&
				Number.isFinite(stop.longitude),
		)
		.sort((a, b) => a.order - b.order);
}

export default function MapTab({
	lang,
	mapStops,
}: {
	lang: Lang;
	mapStops: MapStop[];
}) {
	const mapRef = React.useRef<MapLibreMap | null>(null);
	const tourMapStopsSource = React.useMemo(
		() => normalizeMapStops(mapStops),
		[mapStops],
	);
	const tourMapStops = React.useMemo<TourMapStop[]>(() => {
		const prefix = dayPrefixes[lang] ?? dayPrefixes.es;

		return tourMapStopsSource.map((stop, index) => ({
			...stop,
			dayNumber: String(index + 1).padStart(2, "0"),
			day: `${prefix} ${String(index + 1).padStart(2, "0")}`,
		}));
	}, [lang, tourMapStopsSource]);
	const tourMapCenter = React.useMemo<[number, number]>(() => {
		const longitudeSum = tourMapStops.reduce(
			(sum, stop) => sum + stop.longitude,
			0,
		);
		const latitudeSum = tourMapStops.reduce(
			(sum, stop) => sum + stop.latitude,
			0,
		);

		return [
			longitudeSum / tourMapStops.length,
			latitudeSum / tourMapStops.length,
		];
	}, [tourMapStops]);
	const routeSegments = React.useMemo<TourRouteSegment[]>(
		() =>
			tourMapStops.slice(1).map((stop, index) => {
				const previousStop = tourMapStops[index];

				return {
					id: `${previousStop.id}-to-${stop.id}`,
					label: `${previousStop.day} -> ${stop.day}`,
					from: [previousStop.longitude, previousStop.latitude],
					to: [stop.longitude, stop.latitude],
					fromStop: previousStop,
					toStop: stop,
				};
			}),
		[tourMapStops],
	);
	const tourMapBounds = React.useMemo<[[number, number], [number, number]]>(
		() => [
			[
				Math.min(...tourMapStops.map((stop) => stop.longitude)),
				Math.min(...tourMapStops.map((stop) => stop.latitude)),
			],
			[
				Math.max(...tourMapStops.map((stop) => stop.longitude)),
				Math.max(...tourMapStops.map((stop) => stop.latitude)),
			],
		],
		[tourMapStops],
	);
	const [selectedId, setSelectedId] = React.useState<string | null>(null);
	const [activeSegmentId, setActiveSegmentId] = React.useState<string | null>(
		null,
	);
	const selectedStop = tourMapStops.find((stop) => stop.id === selectedId);
	const selectStop = React.useCallback(
		(stop: TourMapStop) => {
			const relatedSegment = routeSegments.find(
				(segment) => segment.toStop.id === stop.id,
			);

			setSelectedId(stop.id);
			setActiveSegmentId(relatedSegment?.id ?? null);

			mapRef.current?.flyTo({
				center: [stop.longitude, stop.latitude],
				zoom: Math.max(mapRef.current.getZoom(), 8),
				duration: 650,
				essential: true,
			});
		},
		[routeSegments],
	);

	return (
		<div className="tour-map-tab grid h-[700px] grid-rows-[auto_minmax(0,1fr)] gap-4 lg:h-[840px]">
			<style>{`
				.tour-map-tab,
				.tour-map-tab .maplibregl-map,
				.tour-map-tab .maplibregl-popup,
				.tour-map-tab .maplibregl-ctrl {
					font-family: var(--font-outfit), ui-sans-serif, system-ui, sans-serif;
				}
			`}</style>
			<aside className="order-1 min-w-0 overflow-hidden rounded-sm bg-background px-1 py-2 shadow-[0_22px_60px_-52px_rgba(15,23,42,0.65)]">
				<div className="flex gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1">
					{tourMapStops.map((stop) => {
						const active = stop.id === selectedId;

						return (
							<button
								key={stop.id}
								type="button"
								className={cn(
									"relative h-32 min-w-[16rem] overflow-hidden rounded-sm px-4 py-3 text-left transition-all duration-200 after:absolute after:right-[-0.25rem] after:top-3 after:h-[calc(100%-1.5rem)] after:w-px after:bg-border/80 after:content-[''] last:after:hidden hover:-translate-y-0.5 hover:bg-muted/45 hover:shadow-[0_18px_38px_-26px_rgba(15,23,42,0.62)] focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/45",
									active
										? "bg-muted/55 shadow-[0_18px_38px_-26px_rgba(15,23,42,0.62)]"
										: "",
								)}
								onClick={() => {
									selectStop(stop);
								}}
							>
								<span className="flex items-start justify-between gap-3">
									<span className="text-sm font-extrabold text-foreground">
										{stop.day}
									</span>
								</span>

								<span className="mt-2 block overflow-hidden text-sm font-semibold leading-snug text-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
									{stop.title}
								</span>

								<span className="mt-2 block space-y-1.5 overflow-hidden text-xs text-muted-foreground">
									{stop.duration && (
										<span className="flex items-center gap-1.5 truncate">
											<Clock
												className="h-3.5 w-3.5 shrink-0 text-secondary"
												aria-hidden="true"
											/>
											Tiempo de recorrido: {stop.duration}
										</span>
									)}
									{stop.routeText && (
										<span className="flex items-center gap-1.5 truncate">
											<Route
												className="h-3.5 w-3.5 shrink-0 text-secondary"
												aria-hidden="true"
											/>
											Tramo: {stop.routeText}
										</span>
									)}
								</span>
							</button>
						);
					})}
				</div>
			</aside>

			<div className="order-2 min-h-0 overflow-hidden rounded-sm bg-muted/30 shadow-[0_30px_80px_-56px_rgba(15,23,42,0.8)]">
				<TourMap
					ref={mapRef}
					center={tourMapCenter}
					zoom={6.2}
					minZoom={5}
					maxZoom={15}
					theme="light"
				>
					<MapControls showFullscreen showCompass />
					<FitTourBounds bounds={tourMapBounds} />

					<MapArc<TourRouteSegment>
						id="tour-route-arcs"
						data={routeSegments}
						curvature={0.28}
						samples={96}
						paint={{
							"line-color": TOUR_ROUTE_COLOR,
							"line-width": [
								"case",
								["==", ["get", "id"], activeSegmentId ?? ""],
								3.5,
								2,
							],
							"line-opacity": 0.82,
						}}
						interactive={false}
					/>

					{tourMapStops.map((stop) => (
						<MapMarker
							key={stop.id}
							longitude={stop.longitude}
							latitude={stop.latitude}
							onClick={() => {
								selectStop(stop);
							}}
						>
							<MarkerContent>
								<Pin
									active={stop.id === selectedId}
									number={stop.dayNumber}
									label={`Ver detalles de ${stop.day}`}
								/>
							</MarkerContent>
							<MarkerTooltip
								offset={24}
								className={cn(
									"rounded-sm px-3 py-2 text-xs font-semibold text-slate-900",
									glassPanelClass,
								)}
							>
								{`${stop.day}: ${stop.title}`}
							</MarkerTooltip>
						</MapMarker>
					))}

					{selectedStop && (
						<MapPopup
							longitude={selectedStop.longitude}
							latitude={selectedStop.latitude}
							offset={30}
							closeButton
							closeOnClick={false}
							onClose={() => setSelectedId(null)}
							className={cn("min-w-64 rounded-sm p-4", glassPanelClass)}
							focusAfterOpen={false}
						>
							<p className="pr-6 text-sm font-extrabold text-slate-950">
								{selectedStop.day}
							</p>
							<p className="mt-1 text-sm leading-snug text-slate-700">
								{selectedStop.title}
							</p>
							<p className="mt-3 text-xs leading-relaxed text-slate-500">
								{selectedStop.description}
							</p>
						</MapPopup>
					)}
				</TourMap>
			</div>
		</div>
	);
}
