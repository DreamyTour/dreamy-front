import {
	BusFront,
	Clock,
	Compass,
	Footprints,
	Map as MapIcon,
	Plane,
	Route,
	Satellite,
	Scan,
	Ship,
	TrainFront,
	X,
} from "lucide-react";
import type { Map as MapLibreMap } from "maplibre-gl";
import * as React from "react";
import {
	MapControls,
	MapMarker,
	MapPopup,
	MarkerContent,
	MarkerTooltip,
	MapView as TourMap,
	useMap,
} from "@/components/ui/map";
import { getImageAlt, getImageUrl } from "@/lib/helpers";
import type { Lang } from "@/lib/i18n";
import { dayMarkerPlace } from "@/lib/tour-day-marker";
import { isValidTourMapStop, normalizeTourMapCoordinate } from "@/lib/tour-map";
import { type TourMapMode, tourMapStyles } from "@/lib/tour-map-styles";
import {
	normalizeRouteGeometry,
	normalizeTransportMode,
	type RouteCoordinate,
	type TransportMode,
	transportColors,
	transportLabels,
} from "@/lib/tour-map-transport";
import { pairReverseRoutes, roundTripLabels } from "@/lib/tour-round-trip";
import {
	normalizeTourRoutePlan,
	type RoutePlace,
	routePlanDestination,
	routePlanHighlight,
	routePlanSecondaryStops,
	routePlanSegments,
} from "@/lib/tour-route-plan";
import { cn } from "@/lib/utils";
import type { MapStop } from "@/types/tours";
import RailwayRoutes, { RailwayLegend } from "./RailwayRoutes";
import RoundTripRoutes from "./RoundTripRoutes";
import TransportRoute from "./TransportRoute";
import {
	routeCalculationKey,
	useCalculatedTourRoutes,
} from "./useCalculatedTourRoutes";

type TourMapStopSource = Omit<MapStop, "id"> & {
	id: string;
	markerPlace: RoutePlace;
};

type TourMapStop = TourMapStopSource & {
	day: string;
};

interface TourRouteSegment {
	verifiedGpx?: boolean;
	requiresReview?: boolean;
	id: string;
	label: string;
	from: [number, number];
	to: [number, number];
	fromStop: TourMapStop;
	toStop: TourMapStop;
	mode: TransportMode | null;
	coordinates: RouteCoordinate[] | null;
	provider?: string;
}

const transportIcons = {
	walking: Footprints,
	bus: BusFront,
	train: TrainFront,
	flight: Plane,
	boat: Ship,
};

const dayPrefixes: Record<Lang, string> = {
	es: "DÍA",
	en: "DAY",
	pt: "DIA",
};

const mapLabels: Record<
	Lang,
	{
		duration: string;
		route: string;
		viewDetails: string;
		map: string;
		satellite: string;
		explore: string;
		stops: string;
		reset: string;
		empty: string;
		layers: string;
		close: string;
	}
> = {
	es: {
		duration: "Tiempo de recorrido",
		route: "Tramo",
		viewDetails: "Ver detalles de",
		map: "Mapa",
		satellite: "Satélite",
		explore: "Tu próxima aventura, en el mapa",
		stops: "destinos por descubrir",
		reset: "Ver recorrido completo",
		empty: "El recorrido estará disponible próximamente.",
		layers: "Vista del mapa",
		close: "Cerrar detalles",
	},
	en: {
		duration: "Travel time",
		route: "Route",
		viewDetails: "View details for",
		map: "Map",
		satellite: "Satellite",
		explore: "Your next adventure, on the map",
		stops: "destinations to discover",
		reset: "Show full route",
		empty: "The route will be available soon.",
		layers: "Map view",
		close: "Close details",
	},
	pt: {
		duration: "Tempo de percurso",
		route: "Trecho",
		viewDetails: "Ver detalhes de",
		map: "Mapa",
		satellite: "Satélite",
		explore: "Sua próxima aventura, no mapa",
		stops: "destinos para descobrir",
		reset: "Ver percurso completo",
		empty: "O percurso estará disponível em breve.",
		layers: "Vista do mapa",
		close: "Fechar detalhes",
	},
};

const mapPopupClass =
	"tour-map-popup !max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl bg-white p-0 text-slate-950 shadow-[0_24px_70px_-22px_rgba(15,23,42,0.6)]";

function DayStopDetails({
	stop,
	image,
}: {
	stop: TourMapStop;
	image: string | null;
}) {
	return (
		<div
			className={cn(
				"grid min-h-[14rem] grid-cols-1",
				image &&
					"sm:min-h-[24rem] sm:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]",
			)}
		>
			<div className="min-w-0 p-5">
				<p className="text-2xl font-extrabold tracking-[0.02em] text-slate-950">
					{stop.day}
				</p>
				<p className="mt-1 text-xl font-bold leading-snug text-slate-900">
					{stop.title}
				</p>
				<p className="mt-6 whitespace-pre-line text-lg leading-[1.13] text-slate-800">
					{stop.description}
				</p>
			</div>
			{image && (
				<div className="border-t-2 border-dotted border-slate-300 p-4 sm:border-l-2 sm:border-t-0 sm:pl-7">
					<img
						src={image}
						alt={getImageAlt(stop.imagen, stop.title)}
						width={640}
						height={640}
						loading="lazy"
						decoding="async"
						className="aspect-[4/3] w-full object-cover sm:aspect-square"
					/>
				</div>
			)}
		</div>
	);
}

/** Native automatic anchor, bounded content, and event-end viewport correction. */
function DayMapPopup({
	label,
	...props
}: React.ComponentProps<typeof MapPopup> & { label: string }) {
	const { map } = useMap();
	const content = React.useRef<HTMLElement>(null);
	const [size, setSize] = React.useState({ width: 262, height: 260 });
	React.useEffect(() => {
		if (!map) return;
		let frame = 0;
		const resize = () => {
			const { width, height } = map.getContainer().getBoundingClientRect();
			setSize((previous) => {
				const next = {
					width: Math.max(160, Math.min(520, width - 128)),
					height: Math.max(100, Math.min(320, height - 200)),
				};
				return previous.width === next.width && previous.height === next.height
					? previous
					: next;
			});
		};
		const fit = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				const el = content.current?.closest(".maplibregl-popup");
				if (!el || getComputedStyle(el).display === "none" || map.isMoving())
					return;
				const box = el.getBoundingClientRect(),
					bounds = map.getContainer().getBoundingClientRect();
				const dx =
					box.left < bounds.left + 12
						? box.left - bounds.left - 12
						: box.right > bounds.right - 52
							? box.right - bounds.right + 52
							: 0;
				const dy =
					box.top < bounds.top + 82
						? box.top - bounds.top - 82
						: box.bottom > bounds.bottom - 64
							? box.bottom - bounds.bottom + 64
							: 0;
				if (Math.abs(dx) > 1 || Math.abs(dy) > 1)
					map.panBy([dx, dy], { duration: 0 });
			});
		};
		const observer = new ResizeObserver(() => {
			resize();
			fit();
		});
		observer.observe(map.getContainer());
		if (content.current) observer.observe(content.current);
		map.on("moveend", fit);
		resize();
		fit();
		return () => {
			observer.disconnect();
			map.off("moveend", fit);
			cancelAnimationFrame(frame);
		};
	}, [map]);
	return (
		<MapPopup
			{...props}
			offset={48}
			contentStyle={{ width: size.width, maxWidth: size.width }}
		>
			{/* Keyboard focus allows scrolling the bounded popup without dragging the map. */}
			<section
				ref={content}
				aria-label={label}
				// biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard scrolling of bounded day information
				tabIndex={0}
				style={{
					maxHeight: size.height,
					overflowY: "auto",
					overscrollBehavior: "contain",
				}}
			>
				{props.children}
			</section>
		</MapPopup>
	);
}

function FitTourBounds({
	bounds,
}: {
	bounds: [[number, number], [number, number]];
}) {
	const { map } = useMap();

	React.useEffect(() => {
		if (!map) return;

		const container = map.getContainer();
		let frame = 0;
		const fit = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				if (!container.clientWidth || !container.clientHeight) return;
				map.resize();
				map.fitBounds(bounds, {
					padding: { top: 120, right: 104, bottom: 96, left: 40 },
					maxZoom: 8.4,
					duration: 0,
				});
			});
		};
		const observer = new ResizeObserver(fit);
		observer.observe(container);
		fit();
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
		};
	}, [bounds, map]);

	return null;
}

function Pin({
	active,
	day,
	label,
}: {
	active: boolean;
	day: string;
	label: string;
}) {
	const [dayLabel, dayNumber = day] = day.split(": ");

	return (
		<button
			type="button"
			aria-label={label}
			data-day-marker
			className={cn(
				"relative flex h-12 w-12 flex-col items-center justify-center rounded-full border-2 border-white bg-primary text-primary-foreground shadow-[0_12px_24px_-16px_color-mix(in_oklab,var(--foreground)_68%,transparent)] transition-[transform,box-shadow] duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-secondary/55 sm:h-[3.25rem] sm:w-[3.25rem]",
				active
					? "scale-105 ring-4 ring-primary/25"
					: "hover:scale-105 hover:shadow-[0_16px_28px_-16px_color-mix(in_oklab,var(--foreground)_68%,transparent)]",
			)}
		>
			<span className="absolute top-[calc(100%-0.28rem)] left-1/2 z-0 h-3 w-3 -translate-x-1/2 rotate-45 border-r-2 border-b-2 border-white bg-primary" />
			<span
				className="relative z-10 text-[0.58rem] font-extrabold leading-none tracking-[0.06em]"
				aria-hidden="true"
			>
				{dayLabel}:
			</span>
			<span
				className="relative z-10 mt-0.5 text-base font-extrabold leading-none"
				aria-hidden="true"
			>
				{dayNumber}
			</span>
		</button>
	);
}

function DayMarkers({
	stops,
	selectedId,
	onSelect,
	labels,
}: {
	stops: TourMapStop[];
	selectedId: string | null;
	onSelect: (stop: TourMapStop) => void;
	labels: typeof mapLabels.es;
}) {
	const { map } = useMap();
	const [, refresh] = React.useReducer((n) => n + 1, 0);
	const [openGroup, setOpenGroup] = React.useState<string | null>(null);
	React.useEffect(() => {
		if (!map) return;
		map.on("moveend", refresh);
		map.on("resize", refresh);
		refresh();
		return () => {
			map.off("moveend", refresh);
			map.off("resize", refresh);
		};
	}, [map]);
	const groups: TourMapStop[][] = [];
	for (const stop of stops) {
		const point = map?.project([
			stop.markerPlace.coordinates[0],
			stop.markerPlace.coordinates[1],
		]);
		const group = groups.find((items) => {
			const anchor = map?.project([
				items[0].markerPlace.coordinates[0],
				items[0].markerPlace.coordinates[1],
			]);
			return point && anchor
				? Math.hypot(point.x - anchor.x, point.y - anchor.y) < 58
				: stop.markerPlace.coordinates[0] ===
						items[0].markerPlace.coordinates[0] &&
						stop.markerPlace.coordinates[1] ===
							items[0].markerPlace.coordinates[1];
		});
		if (group) group.push(stop);
		else groups.push([stop]);
	}
	return (
		<>
			{groups.map((group) => {
				const stop = group[0];
				return (
					<MapMarker
						key={stop.id}
						longitude={stop.markerPlace.coordinates[0]}
						latitude={stop.markerPlace.coordinates[1]}
						onClick={(event) => {
							const choice =
								event.target instanceof Element
									? event.target.closest<HTMLElement>("[data-map-day]")?.dataset
											.mapDay
									: undefined;
							const chosen = group.find((item) => item.id === choice);
							if (chosen) {
								setOpenGroup(null);
								onSelect(chosen);
							} else if (group.length === 1) onSelect(stop);
							else setOpenGroup(openGroup === stop.id ? null : stop.id);
						}}
					>
						<MarkerContent>
							{group.length === 1 ? (
								<Pin
									active={stop.id === selectedId}
									day={stop.day}
									label={`${labels.viewDetails} ${stop.day}`}
								/>
							) : (
								<div className="relative">
									<button
										type="button"
										aria-expanded={openGroup === stop.id}
										aria-pressed={group.some((item) => item.id === selectedId)}
										className={cn(
											"flex min-h-12 min-w-14 items-center justify-center rounded-2xl border-2 border-white bg-primary px-3 text-sm font-bold text-white shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
											group.some((item) => item.id === selectedId) &&
												"ring-4 ring-primary/50",
										)}
									>
										{group.map((item, index) => (
											<React.Fragment key={item.id}>
												{index > 0 && <span aria-hidden="true"> · </span>}
												<span
													className={cn(
														item.id === selectedId &&
															"rounded bg-white px-1 text-primary",
													)}
												>
													{item.day.split(":").at(-1)?.trim()}
												</span>
											</React.Fragment>
										))}
									</button>
									{openGroup === stop.id && (
										<div className="absolute left-1/2 top-full z-20 mt-2 w-60 -translate-x-1/2 rounded-xl bg-white p-2 shadow-xl">
											{group.map((item) => (
												<button
													type="button"
													key={item.id}
													data-map-day={item.id}
													aria-pressed={item.id === selectedId}
													className={cn(
														"block min-h-11 w-full rounded-lg px-3 py-2 text-left text-xs text-slate-900 hover:bg-green-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
														item.id === selectedId &&
															"bg-green-50 font-semibold ring-2 ring-inset ring-primary",
													)}
												>
													<strong>{item.day}</strong> ·{" "}
													{item.markerPlace.label ?? item.title}
												</button>
											))}
										</div>
									)}
								</div>
							)}
						</MarkerContent>
						<MarkerTooltip offset={24}>
							{group
								.map(
									(item) =>
										`${item.day}: ${item.markerPlace.label ?? item.title}`,
								)
								.join(" · ")}
						</MarkerTooltip>
					</MapMarker>
				);
			})}
		</>
	);
}

function normalizeMapStops(mapStops: MapStop[]): TourMapStopSource[] {
	return mapStops
		.filter(isValidTourMapStop)
		.map((stop) => {
			const legacyPlace = routePlanHighlight(stop.routePlan);
			const latitude =
				legacyPlace?.coordinates[1] ??
				(normalizeTourMapCoordinate(stop.latitude, 90) as number);
			const longitude =
				legacyPlace?.coordinates[0] ??
				(normalizeTourMapCoordinate(stop.longitude, 180) as number);

			return {
				id: `map-stop-${stop.id}`,
				markerPlace: {
					label: stop.title ?? "",
					coordinates: [longitude, latitude] as RouteCoordinate,
				},
				order: Number(stop.order),
				title: stop.title?.trim() || "",
				description: stop.description?.trim() || "",
				duration: stop.duration?.trim() || "",
				routeText: stop.routeText?.trim() || "",
				transportMode: normalizeTransportMode(stop.transportMode),
				routeGeometry: normalizeRouteGeometry(stop.routeGeometry),
				routePlan: stop.routePlan,
				imagen: stop.imagen ?? null,
				latitude,
				longitude,
			};
		})
		.sort((a, b) => a.order - b.order)
		.map((stop, index, stops) => ({
			...stop,
			markerPlace: dayMarkerPlace(
				stop.routePlan,
				stop.markerPlace,
				index > 0 ? routePlanDestination(stops[index - 1].routePlan) : null,
			),
		}));
}

export default function MapTab({
	lang,
	mapStops,
}: {
	lang: Lang;
	mapStops: MapStop[];
}) {
	const mapRef = React.useRef<MapLibreMap | null>(null);
	const layoutRef = React.useRef<HTMLDivElement>(null);
	const headingRef = React.useRef<HTMLDivElement>(null);
	React.useEffect(() => {
		const layout = layoutRef.current;
		const heading = headingRef.current;
		const card = layout
			?.closest("[data-tour-layout]")
			?.querySelector<HTMLElement>(
				"#tour-contact-form .booking-summary, #tour-contact-form [data-contact-form-root]",
			);
		if (!layout || !heading || !card) return;
		const desktop = window.matchMedia("(min-width: 1024px)");
		const alignMap = () => {
			if (!desktop.matches) {
				layout.style.removeProperty("--tour-map-aligned-height");
				return;
			}
			const gap = Number.parseFloat(getComputedStyle(layout).rowGap) || 0;
			const height =
				card.getBoundingClientRect().height -
				heading.getBoundingClientRect().height -
				gap;
			if (height > 0) {
				layout.style.setProperty("--tour-map-aligned-height", `${height}px`);
			}
		};
		const observer = new ResizeObserver(alignMap);
		observer.observe(card);
		observer.observe(heading);
		desktop.addEventListener("change", alignMap);
		alignMap();
		return () => {
			observer.disconnect();
			desktop.removeEventListener("change", alignMap);
		};
	}, []);
	const labels = mapLabels[lang];
	const [mapMode, setMapMode] = React.useState<TourMapMode>("map");
	const styles = React.useMemo(
		() => ({ light: tourMapStyles[mapMode] }),
		[mapMode],
	);
	const tourMapStopsSource = React.useMemo(
		() => normalizeMapStops(mapStops),
		[mapStops],
	);
	const tourMapStops = React.useMemo<TourMapStop[]>(() => {
		const prefix = dayPrefixes[lang] ?? dayPrefixes.es;

		return tourMapStopsSource.map((stop, index) => ({
			...stop,
			day: `${prefix}: ${String(index + 1).padStart(2, "0")}`,
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
	const baseRouteSegments = React.useMemo<TourRouteSegment[]>(
		() =>
			tourMapStops.flatMap((stop, index) => {
				const previousStop = tourMapStops[index - 1];
				const plan = normalizeTourRoutePlan(stop.routePlan);
				if (plan)
					return routePlanSegments(
						plan,
						previousStop
							? {
									label: previousStop.title,
									coordinates: routePlanDestination(previousStop.routePlan)
										?.coordinates ?? [
										previousStop.longitude,
										previousStop.latitude,
									],
								}
							: null,
					).map((segment) => ({
						...segment,
						verifiedGpx:
							plan.legs.find((leg) => leg.id === segment.id)?.geometryMeta
								?.source === "gpx" || segment.provider?.startsWith("GPX"),
						id: `${stop.id}-${segment.id}`,
						fromStop: previousStop ?? stop,
						toStop: stop,
					}));
				if (!previousStop) return [];

				return {
					id: `${previousStop.id}-to-${stop.id}`,
					label: `${previousStop.day} -> ${stop.day}`,
					from: routePlanDestination(previousStop.routePlan)?.coordinates ?? [
						previousStop.longitude,
						previousStop.latitude,
					],
					to: [stop.longitude, stop.latitude],
					fromStop: previousStop,
					toStop: stop,
					mode: normalizeTransportMode(stop.transportMode),
					coordinates: normalizeRouteGeometry(stop.routeGeometry),
				};
			}),
		[tourMapStops],
	);
	const calculatedRoutes = useCalculatedTourRoutes(baseRouteSegments);
	const routeSegments = React.useMemo(
		() =>
			baseRouteSegments.map((segment) => ({
				...segment,
				coordinates: segment.requiresReview
					? null
					: (segment.coordinates ??
						calculatedRoutes[routeCalculationKey(segment)]?.coordinates ??
						null),
			})),
		[baseRouteSegments, calculatedRoutes],
	);
	const routingProviders = [
		...new Set(
			[
				...Object.values(calculatedRoutes),
				...baseRouteSegments.map((segment) => ({
					provider: "provider" in segment ? segment.provider : undefined,
				})),
			]
				.map((result) => result.provider)
				.filter(Boolean),
		),
	];
	const routeModes = [
		...new Set(
			routeSegments
				.map((segment) => segment.mode)
				.filter((mode): mode is TransportMode => mode !== null),
		),
	];
	const routeBoundsPoints = React.useMemo(
		() => [
			...tourMapStops.map((stop) => stop.markerPlace.coordinates),
			...routeSegments.flatMap((segment) => segment.coordinates ?? []),
			...routeSegments.flatMap((segment) => [segment.from, segment.to]),
		],
		[tourMapStops, routeSegments],
	);
	const tourMapBounds = React.useMemo<[[number, number], [number, number]]>(
		() =>
			routeBoundsPoints.reduce<[[number, number], [number, number]]>(
				(bounds, [longitude, latitude]) => {
					bounds[0][0] = Math.min(bounds[0][0], longitude);
					bounds[0][1] = Math.min(bounds[0][1], latitude);
					bounds[1][0] = Math.max(bounds[1][0], longitude);
					bounds[1][1] = Math.max(bounds[1][1], latitude);
					return bounds;
				},
				[
					[Infinity, Infinity],
					[-Infinity, -Infinity],
				],
			),
		[routeBoundsPoints],
	);
	const [selectedId, setSelectedId] = React.useState<string | null>(null);
	const directionMarkerPoints = React.useMemo(
		() => [
			...tourMapStops.map((stop) => stop.markerPlace.coordinates),
			...routeSegments.flatMap((segment) => [segment.from, segment.to]),
		],
		[tourMapStops, routeSegments],
	);
	const reversePairs = React.useMemo(
		() => pairReverseRoutes(baseRouteSegments),
		[baseRouteSegments],
	);
	const visibleSegments = React.useMemo(
		() =>
			routeSegments.filter(
				(segment) => selectedId === null || segment.toStop.id === selectedId,
			),
		[routeSegments, selectedId],
	);
	const directionalSegments = React.useMemo(
		() =>
			visibleSegments.flatMap((segment) => {
				const presentation = reversePairs[segment.id];
				return segment.mode !== "train" && presentation && segment.coordinates
					? [
							{
								id: segment.id,
								coordinates: segment.coordinates,
								mode: segment.mode,
								presentation,
							},
						]
					: [];
			}),
		[visibleSegments, reversePairs],
	);
	const railwaySegments = React.useMemo(
		() =>
			visibleSegments.flatMap((segment) => {
				if (segment.mode !== "train" || !segment.coordinates) return [];
				const plan = normalizeTourRoutePlan(segment.toStop.routePlan);
				const index =
					plan?.legs.findIndex(
						(leg) => `${segment.toStop.id}-${leg.id}` === segment.id,
					) ?? -1;
				const origin =
					index > 0
						? plan?.legs[index - 1].destination.label
						: segment.fromStop.id !== segment.toStop.id
							? routePlanDestination(segment.fromStop.routePlan)?.label
							: plan?.start?.label;
				return [
					{
						id: segment.id,
						coordinates: segment.coordinates,
						fromLabel: origin ?? segment.fromStop.title,
						toLabel: segment.label,
						day: segment.toStop.day,
					},
				];
			}),
		[visibleSegments],
	);
	const [activeSegmentId, setActiveSegmentId] = React.useState<string | null>(
		null,
	);
	const selectedStop = tourMapStops.find((stop) => stop.id === selectedId);
	const selectedPrevious = selectedStop
		? tourMapStops[tourMapStops.indexOf(selectedStop) - 1]
		: undefined;
	const selectedStart = selectedPrevious
		? (routePlanDestination(selectedPrevious.routePlan) ?? {
				label: selectedPrevious.title,
				coordinates: [
					selectedPrevious.longitude,
					selectedPrevious.latitude,
				] as RouteCoordinate,
			})
		: normalizeTourRoutePlan(selectedStop?.routePlan)?.start;
	const selectedStopImage = selectedStop?.imagen
		? getImageUrl(selectedStop.imagen, "medium")
		: null;
	const selectStop = React.useCallback(
		(stop: TourMapStop) => {
			const relatedSegment = routeSegments.find(
				(segment) => segment.toStop.id === stop.id,
			);

			setSelectedId(stop.id);
			setActiveSegmentId(relatedSegment?.id ?? null);

			const points = [
				stop.markerPlace.coordinates,
				...routeSegments
					.filter((segment) => segment.toStop.id === stop.id)
					.flatMap(
						(segment) => segment.coordinates ?? [segment.from, segment.to],
					),
			];
			const bounds = points.reduce<[[number, number], [number, number]]>(
				(box, point) => [
					[Math.min(box[0][0], point[0]), Math.min(box[0][1], point[1])],
					[Math.max(box[1][0], point[0]), Math.max(box[1][1], point[1])],
				],
				[
					[Infinity, Infinity],
					[-Infinity, -Infinity],
				],
			);
			mapRef.current?.fitBounds(bounds, {
				padding: { top: 120, right: 104, bottom: 96, left: 40 },
				maxZoom: 12,
				duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
					? 0
					: 650,
			});
		},
		[routeSegments],
	);

	if (!tourMapStops.length)
		return (
			<p className="rounded-2xl bg-muted p-8 text-center text-muted-foreground">
				{labels.empty}
			</p>
		);

	return (
		<div ref={layoutRef} className="tour-map-tab flex flex-col gap-3">
			<div
				ref={headingRef}
				className="flex items-center justify-between gap-4 px-1"
			>
				<div>
					<p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
						<Compass className="size-4" aria-hidden="true" />
						{tourMapStops.length} {labels.stops}
					</p>
					<h3 className="text-lg font-bold tracking-tight text-foreground sm:text-2xl">
						{labels.explore}
					</h3>
				</div>
				<span className="hidden size-12 items-center justify-center rounded-full bg-primary/10 text-primary sm:flex">
					<Route className="size-6" aria-hidden="true" />
				</span>
			</div>
			<style>{`
				.tour-map-tab,
				.tour-map-tab .maplibregl-map,
				.tour-map-tab .maplibregl-popup,
				.tour-map-tab .maplibregl-ctrl {
					font-family: var(--font-outfit), ui-sans-serif, system-ui, sans-serif;
				}

				.tour-map-tab .maplibregl-popup-content:has(.tour-map-popup) {
					background: transparent;
					border-radius: 0;
					box-shadow: none;
				}

				.tour-map-tab .maplibregl-marker:has([data-day-marker]) {
					z-index: 1 !important;
				}

				@media (max-width: 767px) {
					.tour-map-tab .maplibregl-popup:has(.tour-map-popup-desktop) {
						display: none !important;
					}
				}

				.tour-map-stops-scroll {
					--tour-map-scrollbar-thumb: var(--primary);
					--tour-map-scrollbar-track: color-mix(in oklab, var(--primary) 14%, transparent);
					scrollbar-color: var(--tour-map-scrollbar-thumb) var(--tour-map-scrollbar-track);
					scrollbar-width: thin;
				}

				@supports not (scrollbar-color: auto) {
					.tour-map-stops-scroll::-webkit-scrollbar {
						height: 0.625rem;
					}

					.tour-map-stops-scroll::-webkit-scrollbar-track {
						background: var(--tour-map-scrollbar-track);
						border-radius: 999px;
					}

					.tour-map-stops-scroll::-webkit-scrollbar-thumb {
						background: var(--tour-map-scrollbar-thumb);
						border-radius: 999px;
					}
				}
			`}</style>
			<div className="relative isolate h-[clamp(260px,calc(100svh-340px),560px)] lg:h-[var(--tour-map-aligned-height,clamp(260px,calc(100svh-340px),560px))] shrink-0 overflow-hidden rounded-2xl bg-slate-900 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.5)]">
				<TourMap
					ref={mapRef}
					center={tourMapCenter}
					zoom={6.2}
					minZoom={2}
					maxZoom={15}
					theme="light"
					styles={styles}
				>
					<MapControls showFullscreen showCompass className="!bottom-10" />
					<FitTourBounds bounds={tourMapBounds} />
					<div className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2 sm:left-5 sm:top-5">
						<fieldset
							aria-label={labels.layers}
							className="flex gap-1 rounded-2xl bg-white/95 p-1.5 shadow-xl backdrop-blur-md"
						>
							{(["map", "satellite"] as const).map((mode) => {
								const Icon = mode === "map" ? MapIcon : Satellite;
								return (
									<button
										key={mode}
										type="button"
										aria-pressed={mapMode === mode}
										onClick={() => setMapMode(mode)}
										className={cn(
											"flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
											mapMode === mode
												? "bg-primary text-primary-foreground shadow-sm"
												: "text-slate-700 hover:bg-slate-100",
										)}
									>
										<Icon className="size-4" aria-hidden="true" />
										{labels[mode]}
									</button>
								);
							})}
						</fieldset>
						<button
							type="button"
							title={labels.reset}
							aria-label={labels.reset}
							className="flex size-14 items-center justify-center rounded-2xl bg-white/95 text-slate-800 shadow-xl hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
							onClick={() => {
								setSelectedId(null);
								setActiveSegmentId(null);
								mapRef.current?.fitBounds(tourMapBounds, {
									padding: { top: 120, right: 104, bottom: 96, left: 40 },
									maxZoom: 8.4,
									duration: window.matchMedia(
										"(prefers-reduced-motion: reduce)",
									).matches
										? 0
										: 650,
								});
							}}
						>
							<Scan className="size-5" aria-hidden="true" />
						</button>
					</div>
					{directionalSegments.length > 0 && (
						<RoundTripRoutes
							segments={directionalSegments}
							markerCoordinates={directionMarkerPoints}
							satellite={mapMode === "satellite"}
						/>
					)}
					{railwaySegments.length > 0 && (
						<RailwayRoutes
							segments={railwaySegments}
							satellite={mapMode === "satellite"}
						/>
					)}
					{visibleSegments
						.filter(
							(segment) =>
								segment.mode !== "train" && !reversePairs[segment.id],
						)
						.map((segment) => (
							<TransportRoute
								key={segment.id}
								id={segment.id}
								from={segment.from}
								to={segment.to}
								mode={segment.mode}
								coordinates={segment.coordinates}
								active={
									selectedId === segment.toStop.id ||
									activeSegmentId === segment.id
								}
								satellite={mapMode === "satellite"}
								dimmed={selectedId !== null && selectedId !== segment.toStop.id}
							/>
						))}

					<DayMarkers
						stops={tourMapStops}
						selectedId={selectedId}
						onSelect={selectStop}
						labels={labels}
					/>
					{selectedStart &&
						selectedStop &&
						!tourMapStops.some((stop) =>
							stop.markerPlace.coordinates.every(
								(coordinate, index) =>
									coordinate === selectedStart.coordinates[index],
							),
						) &&
						(selectedStart.coordinates[0] !==
							selectedStop.markerPlace.coordinates[0] ||
							selectedStart.coordinates[1] !==
								selectedStop.markerPlace.coordinates[1]) && (
							<MapMarker
								longitude={selectedStart.coordinates[0]}
								latitude={selectedStart.coordinates[1]}
							>
								<MarkerContent>
									<span className="block max-w-40 rounded-lg border border-white bg-slate-900 px-2 py-1 text-center text-xs font-semibold text-white shadow-lg">
										{selectedStart.label}
										<small className="block font-normal">
											{lang === "en"
												? "Departure"
												: lang === "pt"
													? "Saída"
													: "Salida del día"}
										</small>
									</span>
								</MarkerContent>
							</MapMarker>
						)}
					{selectedStop &&
						routePlanSecondaryStops(selectedStop.routePlan)
							.filter(
								(leg, index, legs) =>
									legs.findIndex((other) =>
										other.destination.coordinates.every(
											(n, i) => n === leg.destination.coordinates[i],
										),
									) === index &&
									!leg.destination.coordinates.every(
										(n, i) => n === selectedStop.markerPlace.coordinates[i],
									) &&
									!tourMapStops.some((stop) =>
										stop.markerPlace.coordinates.every(
											(n, i) => n === leg.destination.coordinates[i],
										),
									),
							)
							.map((leg, index) => (
								<MapMarker
									key={leg.id}
									longitude={leg.destination.coordinates[0]}
									latitude={leg.destination.coordinates[1]}
								>
									<MarkerContent>
										<span className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-primary text-xs font-bold text-white shadow-md">
											{index + 1}
										</span>
									</MarkerContent>
									<MarkerTooltip>{leg.destination.label}</MarkerTooltip>
								</MapMarker>
							))}

					{selectedStop && (
						<DayMapPopup
							label={selectedStop.day}
							longitude={selectedStop.markerPlace.coordinates[0]}
							latitude={selectedStop.markerPlace.coordinates[1]}
							offset={34}
							closeButton
							closeOnClick
							onClose={() => setSelectedId(null)}
							className={cn(
								mapPopupClass,
								"tour-map-popup-desktop",
								"[&_button]:min-h-8 [&_button]:min-w-8",
							)}
							focusAfterOpen={false}
						>
							<DayStopDetails stop={selectedStop} image={selectedStopImage} />
						</DayMapPopup>
					)}
				</TourMap>
			</div>
			{selectedStop && (
				<section
					data-day-details-mobile
					aria-label={selectedStop.day}
					className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.45)] md:hidden"
				>
					<button
						type="button"
						aria-label={labels.close}
						className="absolute right-3 top-3 z-10 flex size-11 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-md hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
						onClick={() => setSelectedId(null)}
					>
						<X className="size-5" aria-hidden="true" />
					</button>
					<DayStopDetails stop={selectedStop} image={selectedStopImage} />
				</section>
			)}
			{routeModes.length > 0 && (
				<section
					aria-label={transportLabels[lang].legend}
					className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-xs font-semibold text-muted-foreground"
				>
					{routeModes.map((mode) => {
						const Icon = transportIcons[mode];
						return (
							<span key={mode} className="flex items-center gap-1.5">
								<Icon
									className="size-4"
									style={{
										color: mode === "train" ? "#343434" : transportColors[mode],
									}}
									aria-hidden="true"
								/>
								{transportLabels[lang][mode]}
							</span>
						);
					})}
				</section>
			)}
			{directionalSegments.length > 0 && (
				<p className="px-1 text-sm text-slate-800">
					{directionalSegments.some(
						(segment) => segment.presentation.direction === "outbound",
					) && (
						<span className="mr-4">
							<span aria-hidden="true" style={{ color: "#E77A28" }}>
								━ →{" "}
							</span>
							{roundTripLabels[lang].outbound}
						</span>
					)}
					{directionalSegments.some(
						(segment) => segment.presentation.direction === "return",
					) && (
						<span className="mr-4">
							<span aria-hidden="true" style={{ color: "#DB5260" }}>
								━ ←{" "}
							</span>
							{roundTripLabels[lang].return}
						</span>
					)}
					<span className="block text-xs">{roundTripLabels[lang].detail}</span>
				</p>
			)}
			<RailwayLegend segments={railwaySegments} lang={lang} />
			{routingProviders.length > 0 && (
				<p className="px-1 text-[0.65rem] text-muted-foreground">
					{routingProviders.join(" / ")} · © OpenStreetMap contributors ·{" "}
					<a
						href="https://www.openstreetmap.org/fixthemap"
						target="_blank"
						rel="noreferrer"
						className="underline"
					>
						{lang === "en"
							? "Improve the map"
							: lang === "pt"
								? "Corrigir o mapa"
								: "Corregir el mapa"}
					</a>
				</p>
			)}
			<aside className="min-w-0 overflow-hidden rounded-2xl bg-muted/50 p-2.5">
				<div className="tour-map-stops-scroll flex gap-2.5 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-2">
					{tourMapStops.map((stop) => {
						const active = stop.id === selectedId;
						const incoming = routeSegments.find(
							(segment) => segment.toStop.id === stop.id,
						);
						const TransportIcon = incoming?.mode
							? transportIcons[incoming.mode]
							: null;

						return (
							<button
								key={stop.id}
								type="button"
								aria-pressed={active}
								className={cn(
									"relative flex h-44 min-w-[17rem] max-w-[17rem] shrink-0 flex-col items-start overflow-hidden rounded-xl border-2 bg-background px-4 py-3 text-left text-foreground shadow-sm transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none",
									active ? "border-primary" : "border-border/60",
								)}
								onClick={() => {
									selectStop(stop);
								}}
							>
								<span className="relative flex w-full items-center justify-between gap-3">
									<span
										className={cn(
											"rounded-full px-2.5 py-1 text-xs font-extrabold",
											active
												? "bg-primary text-primary-foreground"
												: "bg-primary/10 text-primary",
										)}
									>
										{stop.day}
									</span>
									{TransportIcon && incoming?.mode && (
										<span
											className="flex items-center gap-1.5 text-xs font-semibold"
											style={{ color: transportColors[incoming.mode] }}
										>
											<TransportIcon className="size-4" aria-hidden="true" />
											{transportLabels[lang][incoming.mode]}
										</span>
									)}
								</span>

								<span
									className={cn(
										"relative mt-2 block overflow-hidden text-base font-bold leading-snug text-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]",
									)}
								>
									{stop.title}
								</span>

								<span className="relative mt-2 block space-y-1.5 overflow-hidden text-xs text-muted-foreground">
									{stop.duration && (
										<span className="flex items-center gap-1.5 truncate">
											<Clock
												className="h-3.5 w-3.5 shrink-0 text-secondary"
												aria-hidden="true"
											/>
											{labels.duration}: {stop.duration}
										</span>
									)}
									{stop.routeText && (
										<span className="flex items-center gap-1.5 truncate">
											<Route
												className="h-3.5 w-3.5 shrink-0 text-secondary"
												aria-hidden="true"
											/>
											{labels.route}: {stop.routeText}
										</span>
									)}
								</span>
								{incoming?.mode &&
									incoming.mode !== "flight" &&
									incoming.mode !== "boat" &&
									!incoming.coordinates && (
										<span className="mt-2 text-[0.65rem] font-medium text-amber-700 dark:text-amber-400">
											{incoming.requiresReview
												? lang === "en"
													? "Route needs review"
													: lang === "pt"
														? "Percurso requer revisão"
														: "Recorrido requiere revisión"
												: incoming.mode === "bus" || incoming.mode === "walking"
													? calculatedRoutes[routeCalculationKey(incoming)]
															?.status === "failed"
														? transportLabels[lang].unavailable
														: transportLabels[lang].calculating
													: transportLabels[lang].unavailable}
										</span>
									)}
							</button>
						);
					})}
				</div>
			</aside>
		</div>
	);
}
