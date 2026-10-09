import { useRef } from "react";
import type { Lang } from "@/lib/i18n";
import { normalizeTourMapCoordinate } from "@/lib/tour-map";
import {
	normalizeRouteGeometry,
	normalizeTransportMode,
	type RouteCoordinate,
	transportColors,
} from "@/lib/tour-map-transport";
import {
	normalizeTourRoutePlan,
	type RoutePlace,
	routePlanSegments,
} from "@/lib/tour-route-plan";
import type { MapStop } from "@/types/tours";

export default function RouteMapPreview({
	stops,
	lang,
	onOpen,
	previewImage,
	fitHeight = false,
}: {
	stops: MapStop[];
	lang: Lang;
	onOpen: () => void;
	previewImage?: string;
	fitHeight?: boolean;
}) {
	const dialog = useRef<HTMLDialogElement>(null);
	const closeLabel =
		lang === "en"
			? "Close image"
			: lang === "pt"
				? "Fechar imagem"
				: "Cerrar imagen";
	let previous: RoutePlace | null = null;
	const paths = stops.flatMap((stop) => {
		const plan = normalizeTourRoutePlan(stop.routePlan);
		if (plan) {
			const segments = routePlanSegments(plan, previous);
			previous = plan.legs.at(-1)?.destination ?? plan.start;
			return segments.map((segment) => ({
				...segment,
				id: `${stop.id}-${segment.id}`,
			}));
		}
		const longitude = normalizeTourMapCoordinate(stop.longitude, 180);
		const latitude = normalizeTourMapCoordinate(stop.latitude, 90);
		if (longitude === null || latitude === null) return [];
		const point: RoutePlace = {
			label: stop.title,
			coordinates: [longitude, latitude],
		};
		const origin = previous;
		previous = point;
		return origin
			? [
					{
						id: `legacy-${stop.id}`,
						from: origin.coordinates,
						to: point.coordinates,
						coordinates: normalizeRouteGeometry(stop.routeGeometry),
						mode: normalizeTransportMode(stop.transportMode),
					},
				]
			: [];
	});
	const points = paths.flatMap(
		(path) => path.coordinates ?? [path.from, path.to],
	);
	if (!points.length && !previewImage) return null;
	const xs = points.length ? points.map((p) => p[0]) : [0],
		ys = points.length ? points.map((p) => p[1]) : [0];
	const minX = xs.reduce((a, b) => Math.min(a, b)),
		maxX = xs.reduce((a, b) => Math.max(a, b));
	const minY = ys.reduce((a, b) => Math.min(a, b)),
		maxY = ys.reduce((a, b) => Math.max(a, b));
	const scale = Math.min(
		260 / Math.max(maxX - minX, 0.001),
		145 / Math.max(maxY - minY, 0.001),
	);
	const project = (p: RouteCoordinate) =>
		`${160 + (p[0] - (minX + maxX) / 2) * scale},${92 - (p[1] - (minY + maxY) / 2) * scale}`;
	const label =
		lang === "en"
			? "Explore the route"
			: lang === "pt"
				? "Explorar o percurso"
				: "Explora el recorrido";
	return (
		<>
			<button
				type="button"
				onClick={() => (previewImage ? dialog.current?.showModal() : onOpen())}
				className={`group mt-4 w-full overflow-hidden rounded-xl border border-primary/20 bg-[#eef5ee] text-left shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ${fitHeight ? "lg:flex lg:min-h-0 lg:flex-1 lg:basis-0 lg:flex-col" : ""}`}
				aria-label={label}
			>
				{previewImage ? (
					<span
						className={`relative block overflow-hidden cursor-zoom-in ${fitHeight ? "lg:min-h-0 lg:w-full lg:flex-1 lg:bg-white" : ""}`}
					>
						<img
							src={previewImage}
							alt={
								lang === "en"
									? "Illustrated tour itinerary"
									: lang === "pt"
										? "Mapa ilustrado do itinerário"
										: "Mapa ilustrado del itinerario"
							}
							width={1400}
							height={1050}
							loading="lazy"
							decoding="async"
							className={`block h-auto w-full bg-white transition-transform duration-300 group-hover:scale-[1.025] group-focus-visible:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none ${fitHeight ? "lg:absolute lg:inset-0 lg:h-full lg:object-contain" : ""}`}
						/>
						<span
							aria-hidden="true"
							className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/45 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
						>
							<span className="flex size-14 items-center justify-center rounded-full border border-white/70 bg-white text-4xl font-light leading-none text-slate-950 shadow-xl">
								+
							</span>
							<span className="rounded-full bg-slate-950/65 px-4 py-1.5 text-sm font-semibold text-white">
								{lang === "en"
									? "Click to enlarge"
									: lang === "pt"
										? "Clique para ampliar"
										: "Haz clic para ampliar"}
							</span>
						</span>
					</span>
				) : (
					<svg
						viewBox="0 0 320 190"
						className={`w-full ${fitHeight ? "lg:min-h-0 lg:flex-1" : ""}`}
						aria-hidden="true"
					>
						<defs>
							<pattern
								id="route-preview-contours"
								width="90"
								height="70"
								patternUnits="userSpaceOnUse"
							>
								<path
									d="M-10 50 Q30 -10 90 30 M-10 65 Q30 5 90 45 M-10 80 Q30 20 90 60"
									fill="none"
									stroke="#cedecf"
									strokeWidth="1"
								/>
							</pattern>
						</defs>
						<rect
							width="320"
							height="190"
							fill="url(#route-preview-contours)"
						/>
						{paths.map((path) => {
							const coordinates = path.coordinates;
							const stride = Math.max(
								1,
								Math.floor((coordinates?.length ?? 0) / 160),
							);
							const sampled = coordinates?.filter(
								(_, i) => i % stride === 0 || i === coordinates.length - 1,
							);
							const line = (sampled ?? [path.from, path.to])
								.map(project)
								.join(" ");
							return (
								<g key={path.id}>
									<polyline
										points={line}
										fill="none"
										stroke="white"
										strokeWidth="6"
										strokeLinejoin="round"
									/>
									<polyline
										points={line}
										fill="none"
										stroke={path.mode ? transportColors[path.mode] : "#16803c"}
										strokeWidth="3"
										strokeDasharray={
											!coordinates || path.mode === "walking"
												? "4 4"
												: undefined
										}
										strokeLinejoin="round"
									/>
								</g>
							);
						})}
					</svg>
				)}
				<span className="flex w-full shrink-0 items-center justify-between border-t border-primary/10 bg-white px-4 py-3 text-sm font-bold text-primary">
					{label}
					<span
						aria-hidden="true"
						className="transition-transform group-hover:translate-x-1"
					>
						↗
					</span>
				</span>
			</button>
			{previewImage && (
				<dialog
					ref={dialog}
					data-route-image-dialog
					aria-label={label}
					className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-slate-950/95 p-4 text-white backdrop:bg-black/80 sm:p-6"
				>
					<button
						type="button"
						onClick={() => dialog.current?.close()}
						aria-label={closeLabel}
						className="absolute right-4 top-4 z-10 flex size-11 items-center justify-center rounded-full bg-white text-2xl text-slate-950 shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
					>
						×
					</button>
					<img
						src={previewImage}
						alt={
							lang === "en"
								? "Illustrated tour itinerary"
								: "Mapa ilustrado del itinerario"
						}
						className="h-full w-full object-contain"
					/>
				</dialog>
			)}
		</>
	);
}
