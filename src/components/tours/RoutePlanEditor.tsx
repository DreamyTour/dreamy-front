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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	MapControls,
	MapMarker,
	MapView,
	MarkerContent,
	useMap,
} from "@/components/ui/map";
import { singleBusTracks } from "@/lib/tour-bus-rendering";
import { tourMapStyles } from "@/lib/tour-map-styles";
import {
	normalizeRouteGeometry,
	type TransportMode,
	transportLabels,
} from "@/lib/tour-map-transport";
import { pairReverseRoutes } from "@/lib/tour-round-trip";
import {
	ROUTE_PROTOCOL,
	type RouteEditorIdentity,
	routeContent,
	sameRouteIdentity,
} from "@/lib/tour-route-contract";
import {
	geometryMatchesEndpoints,
	normalizeRoutePlace,
	normalizeTourRoutePlan,
	type RoutePlace,
	routePlanSegments,
	routePlanVisits,
	type TourRoutePlan,
} from "@/lib/tour-route-plan";
import {
	affectedGeometries,
	geometryNeedsReview,
	preserveRouteGeometries,
	routeDistanceMetres,
	routeGpx,
} from "@/lib/tour-route-safety";
import RailwayRoutes, { RailwayLegend } from "./RailwayRoutes";
import RoundTripRoutes from "./RoundTripRoutes";
import TransportRoute from "./TransportRoute";

const empty: TourRoutePlan = { version: 1, start: null, legs: [] };
const input =
	"w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus-visible:outline-2 focus-visible:outline-green-700";
const button =
	"inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-green-700";
type Target = "start" | string;
function ClickDestination({
	onPick,
	enabled,
}: {
	onPick: (place: RoutePlace) => void;
	enabled: boolean;
}) {
	const { map } = useMap();
	useEffect(() => {
		if (!map || !enabled) return;
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
	}, [map, onPick, enabled]);
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
	const [searchNotice, setSearchNotice] = useState("");
	const [searching, setSearching] = useState(false);
	const [busy, setBusy] = useState(false);
	const [notice, setNotice] = useState("");
	const [changingLocation, setChangingLocation] = useState(false);
	const [persistence, setPersistence] = useState<"pending" | "saved" | "error">(
		"pending",
	);
	const [invalidPlan, setInvalidPlan] = useState(false);
	const [pendingChange, setPendingChange] = useState<{
		plan: TourRoutePlan;
		revision: number;
		count: number;
	} | null>(null);
	const confirmation = useRef<HTMLDialogElement>(null);
	const identity = useRef<RouteEditorIdentity | null>(null);
	const revision = useRef(0);
	const parentSequence = useRef(-1);
	const operation = useRef(0);
	const persistedContent = useRef<string | null>(null);
	const [statuses, setStatuses] = useState<Record<string, string>>({});
	const map = useRef<LibreMap | null>(null);
	const request = useRef<AbortController | null>(null);
	const latest = useRef(plan);
	latest.current = plan;
	const disabled =
		readonly || busy || invalidPlan || (!connected && !standalone);
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
	const segments = useMemo(
		() => routePlanSegments(plan, inherited),
		[plan, inherited],
	);
	const busPresentation = useMemo(
		() =>
			singleBusTracks(
				segments.map((segment) => ({
					...segment,
					verifiedGpx:
						plan.legs.find((leg) => leg.id === segment.id)?.geometryMeta
							?.source === "gpx" || segment.provider?.startsWith("GPX"),
				})),
			),
		[segments, plan],
	);
	const reversePairs = useMemo(
		() =>
			pairReverseRoutes(
				segments
					.map((segment) => ({
						...segment,
						verifiedGpx:
							plan.legs.find((leg) => leg.id === segment.id)?.geometryMeta
								?.source === "gpx" || segment.provider?.startsWith("GPX"),
					}))
					.filter((s) => !busPresentation.matchedIds.has(s.id)),
			),
		[segments, plan, busPresentation],
	);

	const directionMarkerPoints = useMemo(
		() => segments.flatMap((segment) => [segment.from, segment.to]),
		[segments],
	);
	const directionalSegments = useMemo(
		() =>
			segments.flatMap((segment) => {
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
		[segments, reversePairs],
	);
	const railwaySegments = useMemo(
		() =>
			segments.flatMap((segment) => {
				if (segment.mode !== "train" || !segment.coordinates) return [];
				const index = plan.legs.findIndex((leg) => leg.id === segment.id);
				return [
					{
						id: segment.id,
						coordinates: segment.coordinates,
						fromLabel:
							(index > 0
								? plan.legs[index - 1].destination.label
								: (inherited ?? plan.start)?.label) ?? "",
						toLabel: segment.label,
					},
				];
			}),
		[segments, plan, inherited],
	);
	const commit = useCallback(
		(next: TourRoutePlan) => {
			next = preserveRouteGeometries(latest.current, {
				...next,
				start: inherited ?? next.start,
			});
			if (!next.dayId)
				next.dayId = identity.current?.dayKey ?? crypto.randomUUID();
			revision.current++;
			latest.current = next;
			setPlan(next);
			setPersistence("pending");
			setStatuses({});
			if (window.parent !== window)
				window.parent.postMessage(
					{
						type: "dreamy-route-change",
						protocol: ROUTE_PROTOCOL,
						identity: identity.current,
						sequence: revision.current,
						value: next,
					},
					cmsOrigin,
				);
		},
		[cmsOrigin, inherited],
	);
	const publish = useCallback(
		(next: TourRoutePlan) => {
			const count = affectedGeometries(
				{ ...latest.current, start: inherited ?? latest.current.start },
				{ ...next, start: inherited ?? next.start },
			);
			if (count) {
				setPendingChange({ plan: next, revision: revision.current, count });
				return false;
			}
			commit(next);
			return true;
		},
		[commit, inherited],
	);
	useEffect(() => {
		if (pendingChange) confirmation.current?.showModal();
	}, [pendingChange]);
	useEffect(() => {
		setStandalone(window.parent === window);
		const receive = (event: MessageEvent) => {
			if (
				event.origin !== cmsOrigin ||
				event.source !== window.parent ||
				event.data?.type !== "dreamy-route-init"
			)
				return;
			if (event.data.protocol !== ROUTE_PROTOCOL || !event.data.identity) {
				setInvalidPlan(true);
				setNotice(
					"Actualiza el panel del CMS: esta versión necesita el protocolo seguro del editor.",
				);
				return;
			}
			const same = sameRouteIdentity(identity.current, event.data.identity);
			if (identity.current && !same) return; // A different day/session needs a fresh iframe.
			if (
				!Number.isSafeInteger(event.data.sequence) ||
				!Number.isSafeInteger(event.data.ackSequence)
			)
				return;
			if (same && event.data.sequence <= parentSequence.current) return;
			if (same && event.data.ackSequence < revision.current) return;
			const value =
				event.data.value == null
					? empty
					: normalizeTourRoutePlan(event.data.value);
			if (!value) {
				setInvalidPlan(true);
				setNotice(
					"El recorrido guardado contiene datos inválidos. Se conserva el original; no lo reemplaces por un plan vacío.",
				);
				return;
			}
			const incoming = routeContent(value);
			const current = routeContent(latest.current);
			if (
				same &&
				revision.current > 0 &&
				incoming !== current &&
				persistedContent.current !== current
			) {
				setPersistence("error");
				setNotice(
					"Conflicto: llegó otra versión. Tus cambios siguen en el editor; vuelve a abrir el documento después de descargarlos.",
				);
				return;
			}
			identity.current = event.data.identity;
			parentSequence.current = event.data.sequence;
			if (!same) revision.current = event.data.ackSequence ?? 0;
			request.current?.abort();
			operation.current++;
			setBusy(false);
			if (!same || event.data.disabled || incoming !== current)
				setChangingLocation(false);
			setPendingChange(null);
			setInvalidPlan(false);
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
			if (event.data.persisted) {
				persistedContent.current = incoming;
				setPersistence("saved");
			} else setPersistence("pending");
		};
		window.addEventListener("message", receive);
		window.parent.postMessage(
			{ type: "dreamy-route-ready", protocol: ROUTE_PROTOCOL },
			cmsOrigin,
		);
		return () => {
			window.removeEventListener("message", receive);
			request.current?.abort();
		};
	}, [cmsOrigin]);
	const pick = useCallback(
		(place: RoutePlace, source: "map" | "search" = "map") => {
			const current = latest.current;
			// Only an explicit search selection may initialize an empty start.
			// Map clicks and replacements still require location change mode.
			const initialStart =
				source === "search" &&
				target === "start" &&
				!current.start &&
				!inherited;
			if (disabled || (!changingLocation && !initialStart)) return;
			setChangingLocation(false);
			if (target === "start") {
				if (inherited) return;
				publish({
					...current,
					start: place,
					legs: current.legs,
				});
			} else {
				const index = current.legs.findIndex((leg) => leg.id === target);
				if (index < 0) return;
				publish({
					...current,
					legs: current.legs.map((leg, i) => ({
						...leg,
						...(i === index ? { destination: place } : {}),
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
		[target, disabled, changingLocation, inherited, publish],
	);
	const search = async () => {
		const text = query.trim();
		const operationId = ++operation.current;
		request.current?.abort();
		setPlaces([]);
		if (text.length < 3) {
			setSearching(false);
			setSearchNotice("Escribe al menos 3 letras del lugar.");
			return;
		}
		const controller = new AbortController();
		request.current = controller;
		setSearching(true);
		setSearchNotice("");
		try {
			const response = await fetch(
				`/api/tour-places?${new URLSearchParams({ q: text })}`,
				{ signal: controller.signal },
			);
			if (controller.signal.aborted || operationId !== operation.current)
				return;
			if (response.status === 401 || response.status === 403) {
				setSearchNotice(
					"No se pudo validar tu sesión. Vuelve a abrir el editor desde Strapi e intenta buscar de nuevo.",
				);
				return;
			}
			if (!response.ok) throw Error();
			const data = await response.json();
			if (controller.signal.aborted || operationId !== operation.current)
				return;
			if (!Array.isArray(data?.places)) throw Error();
			const found = data.places
				.map(normalizeRoutePlace)
				.filter((item: RoutePlace | null): item is RoutePlace => Boolean(item));
			setPlaces(found);
			if (!found.length)
				setSearchNotice(
					"No se encontró el lugar. Prueba con el nombre del pueblo o elige un pin en el mapa.",
				);
		} catch {
			if (!controller.signal.aborted && operationId === operation.current)
				setSearchNotice(
					"El servicio de búsqueda no está disponible. Intenta de nuevo o elige un pin en el mapa.",
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
					? plan.legs.filter((leg) => leg.kind === "end")
					: []),
			],
		});
		setTarget(id);
		setChangingLocation(true);
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
			legs,
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
		const operationRevision = revision.current;
		const operationIdentity = identity.current;
		const operationId = ++operation.current;
		setNotice("Comprobando las conexiones…");
		const next = { ...plan, start, legs: plan.legs.map((leg) => ({ ...leg })) };
		const checked: Record<string, string> = {};
		let previous = start;
		let failures = 0;
		for (const leg of next.legs) {
			if (controller.signal.aborted) break;
			if (leg.geometry && geometryNeedsReview(leg, previous.coordinates)) {
				checked[leg.id] =
					"Requiere revisión. El trazado anterior se conserva y no se recalcula automáticamente.";
				failures++;
				previous = leg.destination;
				continue;
			}
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
					leg.geometryMeta = {
						source: "routing",
						status: "valid",
						mode: leg.mode,
					};
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
		if (
			!controller.signal.aborted &&
			operationId === operation.current &&
			operationRevision === revision.current &&
			operationIdentity === identity.current
		) {
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
		const operationRevision = revision.current;
		const operationIdentity = identity.current;
		const operationId = ++operation.current;
		const legId = plan.legs[index]?.id;
		setBusy(true);
		try {
			if (file.size > 5_000_000)
				throw Error("El archivo debe pesar menos de 5 MB.");
			const document = new DOMParser().parseFromString(
				await file.text(),
				"application/xml",
			);
			if (
				operationId !== operation.current ||
				operationRevision !== revision.current ||
				operationIdentity !== identity.current ||
				latest.current.legs[index]?.id !== legId
			)
				throw Error(
					"La lectura del archivo quedó desactualizada; vuelve a seleccionarlo.",
				);
			if (document.querySelector("parsererror"))
				throw Error("No se pudo leer el GPX.");
			if (document.documentElement.localName !== "gpx")
				throw Error("El archivo no es un documento GPX.");
			const tracks = document.querySelectorAll("trkseg");
			const routes = document.querySelectorAll("rte");
			if (tracks.length + routes.length !== 1)
				throw Error("Usa un GPX con un único tramo continuo.");
			const nodes = tracks.length
				? tracks[0].querySelectorAll("trkpt")
				: routes.length
					? routes[0].querySelectorAll("rtept")
					: [];
			let geometry = normalizeRouteGeometry(
				Array.from(nodes).map((node) => {
					const lon = node.getAttribute("lon"),
						lat = node.getAttribute("lat");
					if (!lon?.trim() || !lat?.trim())
						throw Error("Hay puntos GPX sin latitud o longitud.");
					return [Number(lon), Number(lat)];
				}),
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
			const importedPlan: TourRoutePlan = {
				...plan,
				legs: plan.legs.map((item, i) =>
					i === index
						? {
								...item,
								geometry: importedGeometry,
								provider: "GPX verificado por el editor",
								geometryMeta: {
									source: "gpx",
									fileName: file.name,
									importedAt: new Date().toISOString(),
									status: "valid",
									mode: item.mode,
								},
							}
						: item,
				),
			};
			if (leg.geometry)
				setPendingChange({
					plan: importedPlan,
					revision: revision.current,
					count: 1,
				});
			else publish(importedPlan);
			setNotice("GPX cargado. Comprueba que corresponde al recorrido real.");
		} catch (error) {
			setNotice(
				error instanceof Error ? error.message : "No se pudo cargar el GPX.",
			);
		} finally {
			if (operationId === operation.current) setBusy(false);
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
	const download = (leg: (typeof plan.legs)[number]) => {
		try {
			const url = URL.createObjectURL(
				new Blob([routeGpx(leg)], { type: "application/gpx+xml" }),
			);
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = (
				leg.geometryMeta?.fileName ?? `recorrido-${leg.id}.gpx`
			).replace(/[\\/]/g, "-");
			anchor.click();
			setTimeout(() => URL.revokeObjectURL(url), 1000);
		} catch (error) {
			setNotice(
				error instanceof Error
					? error.message
					: "No se pudo descargar el recorrido.",
			);
		}
	};
	return (
		<main className="bg-white p-4 text-slate-950">
			{pendingChange && (
				<dialog
					ref={confirmation}
					aria-labelledby="route-confirm-title"
					className="max-w-lg rounded-xl border border-slate-300 p-5 text-slate-950 shadow-xl"
					style={{ overscrollBehavior: "contain" }}
					onCancel={() => {
						setPendingChange(null);
						setNotice("Cambio cancelado. Se conservó el recorrido anterior.");
					}}
				>
					<h2 id="route-confirm-title" className="text-lg font-bold">
						Confirmar cambio del recorrido
					</h2>
					<p className="my-3">
						Este cambio afecta {pendingChange.count} trazado(s). Los anteriores
						se conservarán como pendientes de revisión; no se borrarán.
					</p>
					<div className="flex justify-end gap-2">
						<button
							type="button"
							className={button}
							onClick={() => {
								setPendingChange(null);
								setNotice(
									"Cambio cancelado. Se conservó el recorrido anterior.",
								);
							}}
						>
							Cancelar
						</button>
						<button
							type="button"
							className={button}
							onClick={() => {
								if (pendingChange.revision === revision.current)
									commit(pendingChange.plan);
								else
									setNotice(
										"El recorrido cambió mientras confirmabas. Repite la acción.",
									);
								setPendingChange(null);
							}}
						>
							Conservar anterior y continuar
						</button>
					</div>
				</dialog>
			)}
			<style>
				{
					"dialog::backdrop { background: #0f172a66; overflow: hidden; overscroll-behavior: contain; }"
				}
			</style>
			<p role="status" className="mb-3 text-sm font-semibold">
				{persistence === "saved"
					? "Guardado · verificado mediante lectura del servidor"
					: persistence === "error"
						? "No se ha confirmado el guardado; conserva tus cambios"
						: "Pendiente de guardar"}
				{plan.legs.some((leg, i) =>
					geometryNeedsReview(
						leg,
						i ? plan.legs[i - 1].destination.coordinates : start?.coordinates,
					),
				)
					? " · Requiere revisión"
					: ""}
			</p>
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
				<div className="mb-3 flex items-center gap-2">
					<button
						type="button"
						className={button}
						disabled={target === "start" && !!inherited}
						aria-pressed={changingLocation}
						onClick={() => setChangingLocation((value) => !value)}
					>
						{changingLocation
							? "Cancelar cambio de ubicación"
							: "Cambiar ubicación"}
					</button>
					<span className="text-xs">
						{changingLocation
							? "Elige un lugar o pulsa el mapa para cambiar el punto seleccionado."
							: "Puedes explorar el mapa sin modificar los puntos."}
					</span>
				</div>
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
				<p
					role="status"
					className={searchNotice ? "mb-3 text-sm text-slate-700" : "sr-only"}
				>
					{searchNotice}
				</p>
				{places.length > 0 && (
					<ul className="mb-3 max-h-40 overflow-auto rounded-lg border border-slate-200">
						{places.map((place) => (
							<li key={`${place.label}:${place.coordinates}`}>
								<button
									type="button"
									className="w-full px-3 py-2 text-left text-sm hover:bg-green-50 focus-visible:outline-2 focus-visible:outline-green-700"
									onClick={() => pick(place, "search")}
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
							<ClickDestination
								onPick={pick}
								enabled={changingLocation && !disabled}
							/>
							{directionalSegments.length > 0 && (
								<RoundTripRoutes
									segments={directionalSegments}
									markerCoordinates={directionMarkerPoints}
								/>
							)}
							{railwaySegments.length > 0 && (
								<RailwayRoutes segments={railwaySegments} />
							)}
							{busPresentation.segments
								.filter(
									(segment) =>
										segment.mode !== "train" && !reversePairs[segment.id],
								)
								.map((segment) => (
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
										if (!disabled) {
											setTarget(item.id);
											setChangingLocation(false);
										}
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
						<RailwayLegend segments={railwaySegments} />
					</div>
					<div className="flex max-h-[300px] flex-col gap-2 overflow-auto rounded-xl bg-slate-50 p-3">
						<button
							type="button"
							className={`${button} !justify-start ${target === "start" ? "!border-green-700" : ""}`}
							onClick={() => {
								setTarget("start");
								setChangingLocation(false);
							}}
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
										onClick={() => {
											setTarget(leg.id);
											setChangingLocation(false);
										}}
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
											const legs = plan.legs.filter(
												(item) => item.id !== leg.id,
											);
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
									<div className="mt-2 flex flex-col gap-1 text-xs">
										<p className="font-semibold">
											{leg.geometryMeta?.source === "gpx" ||
											leg.provider?.startsWith("GPX")
												? persistence === "saved"
													? "GPX guardado"
													: "GPX cargado · pendiente de guardar"
												: "Trazado disponible"}
										</p>
										<p>
											{leg.geometryMeta?.fileName ??
												"Nombre original no disponible"}{" "}
											· {leg.geometry.length} puntos ·{" "}
											{(routeDistanceMetres(leg.geometry) / 1000).toFixed(2)} km
										</p>
										<p>
											{geometryNeedsReview(
												leg,
												index
													? plan.legs[index - 1].destination.coordinates
													: start?.coordinates,
											)
												? "Requiere revisión · trazado conservado"
												: "Validación de estructura y extremos correcta; revisa el itinerario real."}
										</p>
										<button
											type="button"
											className={button}
											onClick={() => download(leg)}
										>
											Descargar GPX
										</button>
										{geometryNeedsReview(
											leg,
											index
												? plan.legs[index - 1].destination.coordinates
												: start?.coordinates,
										) && (
											<button
												type="button"
												className={button}
												onClick={() =>
													setPendingChange({
														revision: revision.current,
														count: 1,
														plan: {
															...plan,
															legs: plan.legs.map((item) =>
																item.id === leg.id
																	? {
																			...item,
																			geometryMeta: {
																				...item.geometryMeta,
																				status: "valid",
																				mode: item.mode,
																			},
																		}
																	: item,
															),
														},
													})
												}
											>
												Confirmar trazado para estos puntos
											</button>
										)}
									</div>
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
												id={`gpx-${leg.id}`}
												hidden
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
											<button
												type="button"
												className={`${button} mt-2`}
												onClick={() =>
													document.getElementById(`gpx-${leg.id}`)?.click()
												}
											>
												{leg.geometry
													? "Reemplazar GPX…"
													: "Elegir archivo GPX…"}
											</button>
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
					Selecciona el tramo y activa «Cambiar ubicación» para buscar su
					destino o colocarlo en el mapa. La salida de cada tramo es el destino
					anterior.
				</p>
			</fieldset>
			{!!plan.archivedLegs?.length && (
				<details className="mt-3 rounded-lg border border-amber-300 p-3 text-sm">
					<summary>
						Trazados anteriores conservados · {plan.archivedLegs.length} ·
						Requieren revisión
					</summary>
					<p className="my-2">
						Se mantienen en el día y se guardan con el tour. Puedes descargarlos
						para revisarlos; no se dibujan como un recorrido vigente.
					</p>
					{plan.archivedLegs.map((leg, i) => (
						<div
							key={routeContent({
								id: leg.id,
								geometry: leg.geometry,
								fileName: leg.geometryMeta?.fileName,
							})}
							className="my-2 flex flex-wrap items-center gap-2"
						>
							<span>
								{leg.destination.label} ·{" "}
								{leg.geometryMeta?.fileName ?? "Nombre original no disponible"}
							</span>
							<button
								type="button"
								className={button}
								onClick={() => download(leg)}
							>
								Descargar GPX anterior {i + 1}
							</button>
						</div>
					))}
				</details>
			)}
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
