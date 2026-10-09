import {
	ArrowDown,
	ArrowUp,
	Check,
	MapPin,
	Plus,
	Search,
	Star,
	Trash2,
} from "lucide-react";
import type { Map as LibreMap } from "maplibre-gl";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	MapControls,
	MapMarker,
	MapView,
	MarkerContent,
	useMap,
} from "@/components/ui/map";
import { tourMapStyles } from "@/lib/tour-map-styles";
import {
	normalizeRouteGeometry,
	type TransportMode,
	transportLabels,
} from "@/lib/tour-map-transport";
import {
	geometryMatchesEndpoints,
	normalizeRoutePlace,
	normalizeTourRoutePlan,
	type RoutePlace,
	routePlanSegments,
	routePlanVisits,
	type TourRoutePlan,
} from "@/lib/tour-route-plan";
import TransportRoute from "./TransportRoute";

const empty: TourRoutePlan = { version: 1, start: null, legs: [] };
const input =
	"w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus-visible:outline-2 focus-visible:outline-green-700";
const button =
	"inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-green-700";
type Target = "start" | string;
function ClickDestination({ onPick }: { onPick: (place: RoutePlace) => void }) {
	const { map } = useMap();
	useEffect(() => {
		if (!map) return;
		const pick = (event: { lngLat: { lng: number; lat: number } }) =>
			onPick({
				label: "Punto elegido en el mapa",
				coordinates: [
					Number(event.lngLat.lng.toFixed(6)),
					Number(event.lngLat.lat.toFixed(6)),
				],
			});
		map.on("click", pick);
		return () => {
			map.off("click", pick);
		};
	}, [map, onPick]);
	return null;
}

export default function RoutePlanEditor({ cmsOrigin }: { cmsOrigin: string }) {
	const [plan, setPlan] = useState<TourRoutePlan>(empty);
	const [inherited, setInherited] = useState<RoutePlace | null>(null);
	const [legacy, setLegacy] = useState<RoutePlace | null>(null);
	const [legacyMode, setLegacyMode] = useState<TransportMode>("bus");
	const [readonly, setReadonly] = useState(false);
	const [connected, setConnected] = useState(false);
	const [standalone, setStandalone] = useState(false);
	const [target, setTarget] = useState<Target>("start");
	const [query, setQuery] = useState("");
	const [places, setPlaces] = useState<RoutePlace[]>([]);
	const [searching, setSearching] = useState(false);
	const [busy, setBusy] = useState(false);
	const [notice, setNotice] = useState("");
	const [statuses, setStatuses] = useState<Record<string, string>>({});
	const map = useRef<LibreMap | null>(null);
	const request = useRef<AbortController | null>(null);
	const latest = useRef(plan);
	latest.current = plan;
	const disabled = readonly || busy;
	const start = inherited ?? plan.start;
	const fitRoute = () => {
		const points = [
			...(start ? [start.coordinates] : []),
			...plan.legs.flatMap(
				(leg) => leg.geometry ?? [leg.destination.coordinates],
			),
		];
		if (!points.length) return;
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
		map.current?.fitBounds(bounds, { padding: 35, maxZoom: 13, duration: 500 });
	};
	const segments = routePlanSegments(plan, inherited);
	const publish = useCallback(
		(next: TourRoutePlan) => {
			latest.current = next;
			setPlan(next);
			setStatuses({});
			if (window.parent !== window)
				window.parent.postMessage(
					{
						type: "dreamy-route-change",
						value: next.legs.length || next.start ? next : null,
					},
					cmsOrigin,
				);
		},
		[cmsOrigin],
	);
	useEffect(() => {
		setStandalone(window.parent === window);
		const receive = (event: MessageEvent) => {
			if (
				event.origin !== cmsOrigin ||
				event.source !== window.parent ||
				event.data?.type !== "dreamy-route-init"
			)
				return;
			const value = normalizeTourRoutePlan(event.data.value) ?? empty;
			setPlan(value);
			latest.current = value;
			setInherited(normalizeRoutePlace(event.data.inheritedStart));
			setLegacy(normalizeRoutePlace(event.data.legacyDestination));
			setLegacyMode(
				["walking", "train", "flight", "boat"].includes(event.data.legacyMode)
					? event.data.legacyMode
					: "bus",
			);
			setReadonly(Boolean(event.data.disabled));
			setConnected(true);
		};
		window.addEventListener("message", receive);
		window.parent.postMessage({ type: "dreamy-route-ready" }, cmsOrigin);
		return () => {
			window.removeEventListener("message", receive);
			request.current?.abort();
		};
	}, [cmsOrigin]);
	const pick = useCallback(
		(place: RoutePlace) => {
			if (disabled) return;
			const current = latest.current;
			if (target === "start") {
				if (inherited) return;
				publish({
					...current,
					start: place,
					legs: current.legs.map((leg) => ({
						...leg,
						geometry: undefined,
						provider: undefined,
					})),
				});
			} else {
				const index = current.legs.findIndex((leg) => leg.id === target);
				if (index < 0) return;
				publish({
					...current,
					legs: current.legs.map((leg, i) => ({
						...leg,
						...(i === index ? { destination: place } : {}),
						...(i === index || i === index + 1
							? { geometry: undefined, provider: undefined }
							: {}),
					})),
				});
			}
			setPlaces([]);
			setNotice("Destino elegido. Puedes ajustar el pin o cambiar el nombre.");
			map.current?.flyTo({
				center: place.coordinates,
				zoom: 13,
				duration: 500,
			});
		},
		[target, disabled, inherited, publish],
	);
	const search = async () => {
		if (query.trim().length < 3) {
			setNotice("Escribe al menos 3 letras del lugar.");
			return;
		}
		request.current?.abort();
		const controller = new AbortController();
		request.current = controller;
		setSearching(true);
		setPlaces([]);
		setNotice("");
		try {
			const response = await fetch(
				`/api/tour-places?${new URLSearchParams({ q: query.trim() })}`,
				{ signal: controller.signal },
			);
			if (!response.ok) throw Error();
			const data = await response.json();
			const found = (data.places ?? [])
				.map(normalizeRoutePlace)
				.filter((item: RoutePlace | null): item is RoutePlace => Boolean(item));
			setPlaces(found);
			if (!found.length)
				setNotice(
					"No se encontró el lugar. Prueba con el nombre del pueblo o elige un pin en el mapa.",
				);
		} catch {
			if (!controller.signal.aborted)
				setNotice(
					"No se pudo buscar ahora. Puedes elegir el destino en el mapa.",
				);
		} finally {
			if (!controller.signal.aborted) setSearching(false);
		}
	};
	const add = (kind: "visit" | "end" = "visit") => {
		if (plan.legs.length >= 50) return;
		const id = crypto.randomUUID();
		publish({
			...plan,
			legs: [
				...plan.legs.filter((leg) => leg.kind !== "end"),
				{
					id,
					kind,
					mode: "bus",
					destination: {
						label: "Elige el destino",
						coordinates: start?.coordinates ?? [-71.978, -13.518],
					},
				},
				...(kind === "visit"
					? plan.legs
							.filter((leg) => leg.kind === "end")
							.map((leg) => ({
								...leg,
								geometry: undefined,
								provider: undefined,
							}))
					: []),
			],
		});
		setTarget(id);
		setQuery("");
		setNotice("Busca el destino del nuevo tramo o coloca un pin en el mapa.");
	};
	const move = (index: number, direction: number) => {
		const legs = [...plan.legs];
		[legs[index], legs[index + direction]] = [
			legs[index + direction],
			legs[index],
		];
		publish({
			...plan,
			legs: legs.map((leg) => ({
				...leg,
				geometry: undefined,
				provider: undefined,
			})),
		});
	};
	const check = async () => {
		if (!start) {
			setNotice("Primero elige el punto de salida.");
			return;
		}
		if (!plan.legs.length) {
			setNotice("Añade al menos un tramo.");
			return;
		}
		request.current?.abort();
		const controller = new AbortController();
		request.current = controller;
		setBusy(true);
		setNotice("Comprobando las conexiones…");
		const next = { ...plan, start, legs: plan.legs.map((leg) => ({ ...leg })) };
		const checked: Record<string, string> = {};
		let previous = start;
		let failures = 0;
		for (const leg of next.legs) {
			if (controller.signal.aborted) break;
			if (
				leg.destination.label === "Elige el destino" ||
				Math.hypot(
					previous.coordinates[0] - leg.destination.coordinates[0],
					previous.coordinates[1] - leg.destination.coordinates[1],
				) < 0.00001
			) {
				checked[leg.id] = "Elige un destino diferente al origen.";
				failures++;
			} else if (
				leg.geometry &&
				geometryMatchesEndpoints(
					leg.geometry,
					previous.coordinates,
					leg.destination.coordinates,
					leg.mode,
				)
			)
				checked[leg.id] =
					"✓ Trazado disponible. Revisa que coincida con tu itinerario.";
			else if (leg.mode === "flight" || leg.mode === "boat")
				checked[leg.id] =
					leg.mode === "boat"
						? "Conexión aproximada por agua; no representa la navegación exacta."
						: "Conexión aérea entre destinos.";
			else if (leg.mode === "train") {
				checked[leg.id] = "Carga el GPX verificado del recorrido ferroviario.";
				failures++;
			} else {
				try {
					const response = await fetch(
						"/api/tour-route?" +
							new URLSearchParams({
								mode: leg.mode,
								from: previous.coordinates.join(","),
								to: leg.destination.coordinates.join(","),
							}),
						{ signal: controller.signal },
					);
					if (!response.ok) throw Error();
					const result = await response.json();
					const geometry = normalizeRouteGeometry(result.coordinates);
					if (
						!geometry ||
						!geometryMatchesEndpoints(
							geometry,
							previous.coordinates,
							leg.destination.coordinates,
							leg.mode,
						)
					)
						throw Error();
					leg.geometry = geometry;
					leg.provider = result.provider;
					checked[leg.id] =
						"✓ Ruta calculada. Confirma que sigue el recorrido contratado.";
				} catch {
					checked[leg.id] =
						"No hay ruta disponible. Revisa el pin y el transporte o carga un GPX.";
					failures++;
				}
			}
			previous = leg.destination;
			setStatuses({ ...checked });
		}
		if (!controller.signal.aborted) {
			publish(next);
			setStatuses(checked);
			setNotice(
				failures
					? `${failures} tramo(s) necesitan revisión. No se dibujarán carreteras inventadas.`
					: "Recorrido comprobado. Revisa el mapa y guarda el tour en el CMS.",
			);
			setBusy(false);
			fitRoute();
		}
	};
	const importGpx = async (index: number, file: File | null) => {
		if (!file) return;
		try {
			if (file.size > 5_000_000)
				throw Error("El archivo debe pesar menos de 5 MB.");
			const document = new DOMParser().parseFromString(
				await file.text(),
				"application/xml",
			);
			if (document.querySelector("parsererror"))
				throw Error("No se pudo leer el GPX.");
			const tracks = document.querySelectorAll("trkseg");
			const routes = document.querySelectorAll("rte");
			if (tracks.length > 1 || routes.length > 1)
				throw Error("Usa un GPX con un único tramo continuo.");
			const nodes = tracks.length
				? tracks[0].querySelectorAll("trkpt")
				: routes.length
					? routes[0].querySelectorAll("rtept")
					: [];
			let geometry = normalizeRouteGeometry(
				Array.from(nodes).map((node) => [
					Number(node.getAttribute("lon")),
					Number(node.getAttribute("lat")),
				]),
			);
			if (!geometry)
				throw Error("El GPX necesita entre 2 y 20.000 puntos válidos.");
			const from = index ? plan.legs[index - 1].destination : start;
			const leg = plan.legs[index];
			if (!from) throw Error("Elige primero el origen.");
			if (
				!geometryMatchesEndpoints(
					geometry,
					from.coordinates,
					leg.destination.coordinates,
					leg.mode,
				)
			)
				geometry = geometry.reverse();
			if (
				!geometryMatchesEndpoints(
					geometry,
					from.coordinates,
					leg.destination.coordinates,
					leg.mode,
				)
			)
				throw Error(
					"El GPX no empieza y termina cerca de los lugares elegidos. Revisa los destinos.",
				);
			const importedGeometry = geometry;
			publish({
				...plan,
				legs: plan.legs.map((item, i) =>
					i === index
						? {
								...item,
								geometry: importedGeometry,
								provider: "GPX verificado por el editor",
							}
						: item,
				),
			});
			setNotice("GPX cargado. Comprueba que corresponde al recorrido real.");
		} catch (error) {
			setNotice(
				error instanceof Error ? error.message : "No se pudo cargar el GPX.",
			);
		}
	};
	const activePlace =
		target === "start"
			? start
			: plan.legs.find((leg) => leg.id === target)?.destination;
	const rename = (label: string) => {
		if (target === "start" && !inherited && plan.start)
			publish({ ...plan, start: { ...plan.start, label } });
		else
			publish({
				...plan,
				legs: plan.legs.map((leg) =>
					leg.id === target
						? { ...leg, destination: { ...leg.destination, label } }
						: leg,
				),
			});
	};
	return (
		<main className="bg-white p-4 text-slate-950">
			<header className="mb-4 flex flex-wrap items-center justify-between gap-3">
				<div>
					<p className="text-xs font-bold uppercase tracking-widest text-green-700">
						Diseña el recorrido
					</p>
					<h1 className="text-xl font-bold">¿Qué conocerán este día?</h1>
					<p className="text-sm text-slate-600">
						1. Añade visitas · 2. Elige el transporte · 3. Indica dónde termina
						el día.
					</p>
				</div>
				<button
					type="button"
					className={`${button} !border-green-700 !bg-green-700 !text-white`}
					disabled={disabled}
					onClick={check}
				>
					<Check size={16} />
					{busy ? "Comprobando…" : "Comprobar recorrido"}
				</button>
			</header>
			{!connected && standalone && (
				<p className="mb-3 text-xs text-amber-700">
					Vista de prueba. Abre este editor dentro del CMS para guardar los
					cambios.
				</p>
			)}
			{!plan.legs.length && legacy && (
				<div className="mb-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
					<p>
						Este día ya tiene un destino: <strong>{legacy.label}</strong>.
					</p>
					<button
						type="button"
						className={`${button} mt-2`}
						disabled={disabled}
						onClick={() => {
							const id = crypto.randomUUID();
							publish({
								version: 1,
								start: inherited ? null : legacy,
								legs: inherited
									? [{ id, destination: legacy, mode: legacyMode }]
									: [],
							});
							setTarget(inherited ? id : "start");
						}}
					>
						Usar destino existente
					</button>
				</div>
			)}
			<fieldset disabled={disabled} className="min-w-0">
				<div className="mb-3 flex gap-2">
					<input
						aria-label="Buscar lugar"
						className={input}
						value={query}
						maxLength={150}
						placeholder="Ej.: Ollantaytambo, Perú"
						onChange={(event) => setQuery(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								event.preventDefault();
								void search();
							}
						}}
					/>
					<button
						type="button"
						className={button}
						disabled={searching}
						onClick={search}
					>
						<Search size={16} />
						{searching ? "Buscando…" : "Buscar"}
					</button>
				</div>
				{places.length > 0 && (
					<ul className="mb-3 max-h-40 overflow-auto rounded-lg border border-slate-200">
						{places.map((place) => (
							<li key={`${place.label}:${place.coordinates}`}>
								<button
									type="button"
									className="w-full px-3 py-2 text-left text-sm hover:bg-green-50 focus-visible:outline-2 focus-visible:outline-green-700"
									onClick={() => pick(place)}
								>
									{place.label}
								</button>
							</li>
						))}
					</ul>
				)}
				<div className="mb-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
					<div className="h-[300px] overflow-hidden rounded-xl border border-slate-200">
						<MapView
							ref={map}
							theme="light"
							center={start?.coordinates ?? [-71.978, -13.518]}
							zoom={start ? 11 : 5}
							styles={{ light: tourMapStyles.map }}
						>
							<MapControls showZoom />
							<ClickDestination onPick={pick} />
							{segments.map((segment) => (
								<TransportRoute
									key={segment.id}
									{...segment}
									active={segment.id === target}
									satellite={false}
								/>
							))}
							{[
								...(start ? [{ id: "start", place: start }] : []),
								...plan.legs.map((leg) => ({
									id: leg.id,
									place: leg.destination,
								})),
							].map((item, index) => (
								<MapMarker
									key={item.id}
									longitude={item.place.coordinates[0]}
									latitude={item.place.coordinates[1]}
									onClick={() => {
										if (!disabled) setTarget(item.id);
									}}
								>
									<MarkerContent>
										<button
											type="button"
											aria-label={`Elegir ${item.place.label}`}
											className={`flex size-8 items-center justify-center rounded-full border-2 border-white font-bold text-white shadow-md ${item.id === target ? "bg-green-700" : "bg-slate-700"}`}
										>
											{index === 0 ? "S" : index}
										</button>
									</MarkerContent>
								</MapMarker>
							))}
						</MapView>
					</div>
					<div className="flex max-h-[300px] flex-col gap-2 overflow-auto rounded-xl bg-slate-50 p-3">
						<button
							type="button"
							className={`${button} !justify-start ${target === "start" ? "!border-green-700" : ""}`}
							onClick={() => setTarget("start")}
						>
							<MapPin size={16} />
							<span className="text-left">
								<span className="block text-xs text-slate-500">
									{inherited
										? "Salida · destino del día anterior"
										: "Punto de salida"}
								</span>
								{start?.label ?? "Elige dónde empieza el viaje"}
							</span>
						</button>
						{plan.legs.map((leg, index) => (
							<div
								key={leg.id}
								className={`rounded-lg border bg-white p-2 ${target === leg.id ? "border-green-700" : "border-slate-200"}`}
							>
								<div className="flex items-center gap-1">
									<button
										type="button"
										className="min-w-0 flex-1 text-left text-sm font-semibold"
										onClick={() => setTarget(leg.id)}
									>
										{index + 1}. {leg.destination.label}
									</button>
									<button
										type="button"
										aria-label={`Subir tramo ${index + 1}`}
										className="rounded p-1 hover:bg-slate-100"
										disabled={!index}
										onClick={() => move(index, -1)}
									>
										<ArrowUp size={14} />
									</button>
									<button
										type="button"
										aria-label={`Bajar tramo ${index + 1}`}
										className="rounded p-1 hover:bg-slate-100"
										disabled={index === plan.legs.length - 1}
										onClick={() => move(index, 1)}
									>
										<ArrowDown size={14} />
									</button>
									<button
										type="button"
										aria-label={`Eliminar tramo ${index + 1}`}
										className="rounded p-1 text-red-700 hover:bg-red-50"
										onClick={() => {
											const legs = plan.legs
												.filter((item) => item.id !== leg.id)
												.map((item) => ({
													...item,
													geometry: undefined,
													provider: undefined,
												}));
											publish({ ...plan, legs });
											setTarget(legs.at(-1)?.id ?? "start");
										}}
									>
										<Trash2 size={14} />
									</button>
								</div>
								<label className="mt-2 block text-xs text-slate-500">
									Tipo de lugar
									<select
										className={`${input} mt-1`}
										value={leg.kind ?? "visit"}
										onChange={(event) =>
											publish({
												...plan,
												legs: plan.legs.map((item) =>
													item.id === leg.id
														? {
																...item,
																kind: event.target.value as
																	| "visit"
																	| "waypoint"
																	| "end",
															}
														: item,
												),
											})
										}
									>
										<option value="visit">Atractivo / visita</option>
										<option value="waypoint">
											Solo guía la ruta (oculto al turista)
										</option>
										<option value="end">Final del día / alojamiento</option>
									</select>
								</label>
								{leg.kind !== "end" && leg.kind !== "waypoint" && (
									<button
										type="button"
										className={`${button} mt-2 text-xs`}
										aria-pressed={
											(plan.primaryLegId ?? routePlanVisits(plan)[0]?.id) ===
											leg.id
										}
										onClick={() => publish({ ...plan, primaryLegId: leg.id })}
									>
										<Star
											size={14}
											fill={
												(plan.primaryLegId ?? routePlanVisits(plan)[0]?.id) ===
												leg.id
													? "currentColor"
													: "none"
											}
										/>{" "}
										Visita principal del día
									</button>
								)}
								<label className="mt-2 block text-xs text-slate-500">
									Cómo llegamos
									<select
										className={`${input} mt-1`}
										value={leg.mode}
										onChange={(event) =>
											publish({
												...plan,
												legs: plan.legs.map((item) =>
													item.id === leg.id
														? {
																...item,
																mode: event.target.value as TransportMode,
																geometry: undefined,
																provider: undefined,
															}
														: item,
												),
											})
										}
									>
										{(
											["bus", "walking", "train", "boat", "flight"] as const
										).map((mode) => (
											<option key={mode} value={mode}>
												{transportLabels.es[mode]}
											</option>
										))}
									</select>
								</label>
								{statuses[leg.id] && (
									<p className="mt-2 text-xs text-slate-600">
										{statuses[leg.id]}
									</p>
								)}
								{leg.geometry && (
									<p className="mt-1 text-xs font-semibold text-green-700">
										Trazado disponible
									</p>
								)}
								{leg.mode !== "flight" && (
									<details className="mt-2 text-xs text-slate-600">
										<summary className="cursor-pointer font-semibold">
											Opciones avanzadas · recorrido propio
										</summary>
										<label className="mt-2 block">
											{leg.mode === "train"
												? "Cargar recorrido del tren (GPX)"
												: leg.mode === "bus"
													? "Cargar mi recorrido en bus (GPX)"
													: "Ruta especial: cargar GPX (opcional)"}
											<input
												type="file"
												accept=".gpx,application/gpx+xml"
												className="mt-1 w-full text-xs"
												onChange={(event) => {
													void importGpx(
														index,
														event.target.files?.[0] ?? null,
													);
													event.target.value = "";
												}}
											/>
											{leg.mode === "bus" && (
												<span className="mt-1 block">
													Si el cálculo automático no encuentra la carretera,
													puedes usar tu GPX. Se conservará al comprobar el
													recorrido.
												</span>
											)}
										</label>
									</details>
								)}
							</div>
						))}
						<button
							type="button"
							className={`${button} !border-dashed`}
							disabled={plan.legs.length >= 50}
							onClick={() => add()}
						>
							<Plus size={16} />
							Añadir visita
						</button>
					</div>
				</div>
				<div className="mb-3 rounded-xl border border-green-200 bg-green-50 p-3">
					<p className="mb-2 text-sm font-semibold">¿Dónde termina el día?</p>
					<p className="mb-2 text-xs text-slate-600">
						{plan.legs.at(-1)?.destination.label ??
							start?.label ??
							"Elige la salida"}
						. El siguiente día comienza aquí.
					</p>
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							className={button}
							disabled={!start || !plan.legs.length || plan.legs.length >= 50}
							onClick={() => {
								if (!start) return;
								const legs = plan.legs.filter((leg) => leg.kind !== "end");
								const last = legs.at(-1)?.destination;
								if (
									last?.coordinates.every(
										(coordinate, i) => coordinate === start.coordinates[i],
									)
								) {
									publish({
										...plan,
										legs: legs.map((leg, i) =>
											i === legs.length - 1 ? { ...leg, kind: "end" } : leg,
										),
									});
								} else
									publish({
										...plan,
										legs: [
											...legs,
											{
												id: crypto.randomUUID(),
												destination: start,
												mode: "bus",
												kind: "end",
											},
										],
									});
							}}
						>
							Volvemos a {start?.label ?? "la salida"}
						</button>
						<button
							type="button"
							className={button}
							disabled={plan.legs.length >= 50}
							onClick={() => add("end")}
						>
							Termina en otro lugar
						</button>
					</div>
				</div>
				<button type="button" className={`${button} mb-3`} onClick={fitRoute}>
					Ver recorrido completo
				</button>
				<label className="block text-xs font-semibold text-slate-600">
					Lugar seleccionado ·{" "}
					{target === "start" ? "salida" : "destino del tramo"}
					<input
						className={`${input} mt-1`}
						disabled={
							!activePlace || (target === "start" && Boolean(inherited))
						}
						value={activePlace?.label ?? ""}
						maxLength={250}
						onChange={(event) => rename(event.target.value)}
					/>
				</label>
				<p className="mt-2 text-xs text-slate-500">
					Selecciona el tramo y busca su destino o haz clic en el mapa. La
					salida de cada tramo es el destino anterior.
				</p>
			</fieldset>
			<p
				role="status"
				className="mt-3 min-h-5 text-sm font-medium text-green-800"
			>
				{notice}
			</p>
			<details className="mt-3 text-xs text-slate-600">
				<summary className="cursor-pointer font-semibold">
					Consejos para rutas reales
				</summary>
				<p className="mt-2">
					Bus y caminatas comunes se calculan por carreteras y senderos
					registrados. Si un tramo no está disponible, sus visitas siguen
					visibles. Para Camino Inca y trenes puedes usar un GPX verificado por
					tu operador. Barco muestra una conexión aproximada si no cargas un
					trazado. Comprueba siempre que los pines estén en el acceso correcto.
				</p>
			</details>
		</main>
	);
}
