import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapMarker, MarkerContent, useMap } from "@/components/ui/map";
import type { Lang } from "@/lib/i18n";
import type { RouteCoordinate } from "@/lib/tour-map-transport";
import {
	groupSecondaryStops,
	type SecondaryStop,
} from "@/lib/tour-secondary-stops";

import TourMarkerTooltip from "./TourMarkerTooltip";

const labels = {
	es: {
		view: "Ver parada",
		nearby: "Paradas cercanas",
		arrival: "Llegada en",
		close: "Cerrar parada",
		stop: "Parada",
		bus: "Bus",
		train: "Tren",
		walking: "Caminata",
		boat: "Embarcación",
		flight: "Avión",
	},
	en: {
		view: "View stop",
		nearby: "Nearby stops",
		arrival: "Arrive by",
		close: "Close stop",
		stop: "Stop",
		bus: "Bus",
		train: "Train",
		walking: "Walk",
		boat: "Boat",
		flight: "Flight",
	},
	pt: {
		view: "Ver parada",
		nearby: "Paradas próximas",
		arrival: "Chegada em",
		close: "Fechar parada",
		stop: "Parada",
		bus: "Ônibus",
		train: "Trem",
		walking: "Caminhada",
		boat: "Embarcação",
		flight: "Avião",
	},
};

const choiceKey = (item: SecondaryStop) =>
	JSON.stringify([item.label, item.day, item.mode]);

export default function SecondaryStops({
	stops,
	primaryPoints,
	selectedId,
	onSelect,
	lang,
	suppressTooltips = false,
}: {
	stops: SecondaryStop[];
	primaryPoints: RouteCoordinate[];
	selectedId: string | null;
	onSelect: (id: string | null) => void;
	lang: Lang;
	suppressTooltips?: boolean;
}) {
	const { map } = useMap();
	const [revision, setRevision] = useState(0);
	const trigger = useRef<HTMLButtonElement | null>(null);
	const closeButton = useRef<HTMLButtonElement | null>(null);
	const keyboardOpen = useRef(false);
	const text = labels[lang];
	useEffect(() => {
		if (!map) return;
		let timer: ReturnType<typeof setTimeout>;
		// Rebuild only after interaction settles, never on move/render frames.
		const refresh = () => {
			clearTimeout(timer);
			timer = setTimeout(() => setRevision((n) => n + 1), 80);
		};
		map.on("moveend", refresh);
		map.on("resize", refresh);
		refresh();
		return () => {
			clearTimeout(timer);
			map.off("moveend", refresh);
			map.off("resize", refresh);
		};
	}, [map]);
	const presentation = useMemo(() => {
		void revision;
		if (!map) return { groups: [], detailed: false };
		const box = map.getContainer();
		const detailed = map.getZoom() >= 10;
		const groups = groupSecondaryStops(
			stops,
			(p) => map.project(p),
			detailed ? 56 : 72,
			box.clientWidth,
			box.clientHeight,
		);
		const primary = primaryPoints.map((p) => {
			const point = map.project(p);
			return { x: point.x, y: point.y - 24 };
		});
		return {
			detailed,
			groups: groups.map((group) => {
				const clear = (dx: number, dy: number) =>
					primary.every(
						(p) => Math.hypot(group.x + dx - p.x, group.y + dy - p.y) >= 47,
					);
				let offset: [number, number] = [0, 0];
				if (!clear(0, 0)) {
					// A shared-location disclosure sits beside the main pin; its geographic anchor stays unchanged.
					offset = (
						[
							[48, -24],
							[-48, -24],
							[0, 36],
							[0, -76],
						] as [number, number][]
					).find(
						([dx, dy]) =>
							clear(dx, dy) &&
							group.x + dx >= 22 &&
							group.x + dx <= box.clientWidth - 22 &&
							group.y + dy >= 22 &&
							group.y + dy <= box.clientHeight - 22,
					) ?? [48, -24];
				}
				return { ...group, offset };
			}),
		};
	}, [map, stops, primaryPoints, revision]);
	const selected = stops.find((stop) => stop.id === selectedId);
	const selectedGroup = presentation.groups.find((group) =>
		group.items.some((item) => item.id === selectedId),
	);
	const choices = selectedGroup?.items ?? (selected ? [selected] : []);
	const samePlaceName = choices.every(
		(choice) => choice.label === selected?.label,
	);
	const repeats = useMemo(() => {
		const counts = new Map<string, number>();
		for (const item of choices) {
			const key = choiceKey(item);
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
		return counts;
	}, [choices]);
	useEffect(() => {
		if (selected && keyboardOpen.current)
			closeButton.current?.focus({ preventScroll: true });
		keyboardOpen.current = false;
	}, [selected]);
	const close = () => {
		onSelect(null);
		if (trigger.current?.isConnected)
			trigger.current.focus({ preventScroll: true });
	};
	return (
		<>
			{presentation.groups.map((group) => {
				const active = group.items.some((item) => item.id === selectedId);
				return (
					<MapMarker
						key={group.id}
						longitude={group.coordinates[0]}
						latitude={group.coordinates[1]}
						offset={group.offset}
						onClick={(event) => {
							trigger.current =
								event.target instanceof Element
									? event.target.closest<HTMLButtonElement>(
											"[data-secondary-marker]",
										)
									: null;
							keyboardOpen.current = event.detail === 0;
							const id = active && selectedId ? selectedId : group.items[0].id;
							onSelect(id);
							if (keyboardOpen.current && id === selectedId)
								closeButton.current?.focus({ preventScroll: true });
						}}
					>
						<MarkerContent>
							<TourMarkerTooltip
								label={
									group.items[0].label +
									(group.items.length > 1
										? ` (+${group.items.length - 1})`
										: "")
								}
								disabled={suppressTooltips}
							>
								<button
									type="button"
									data-secondary-marker={group.id}
									data-secondary-count={group.items.length}
									aria-label={
										group.items.length === 1
											? `${text.view}: ${group.items[0].label}, ${group.items[0].day}`
											: `${text.nearby}: ${group.items[0].label}, ${group.items[0].day} (${group.items.length})`
									}
									aria-pressed={active}
									aria-expanded={active}
									className="flex size-11 items-center justify-center rounded-full text-[#007A32] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007A32]"
								>
									<span
										aria-hidden="true"
										className={`flex items-center justify-center rounded-full border-2 border-[#007A32] bg-white shadow-[0_0_0_1px_white] ${presentation.detailed ? "size-3.5" : "size-2.5"} ${active ? "ring-4 ring-[#007A32]/20" : ""}`}
									>
										<span className="size-1 rounded-full bg-[#007A32]" />
									</span>
								</button>
							</TourMarkerTooltip>
						</MarkerContent>
					</MapMarker>
				);
			})}
			{selected && (
				<section
					data-secondary-details
					aria-label={`${text.view}: ${selected.label}`}
					onKeyDown={(event) => {
						if (event.key === "Escape") {
							event.preventDefault();
							close();
						}
					}}
					className="absolute bottom-10 left-3 right-3 z-30 max-h-[min(40%,calc(100%-144px))] overflow-y-auto overscroll-contain rounded-2xl border border-[#007A32]/20 bg-white text-slate-950 shadow-lg md:left-auto md:right-16 md:w-80"
				>
					<div className="sticky top-0 z-10 flex items-start gap-2 bg-white p-2">
						<div className="min-w-0 flex-1">
							<p className="text-[0.6875rem] font-semibold text-[#007A32]">
								{selected.day}
							</p>
							<h3 className="mt-1 text-sm font-bold leading-snug">
								{selected.label}
							</h3>
							<p className="mt-1 text-xs text-slate-600">
								{text.arrival} {text[selected.mode]}
							</p>
						</div>
						<button
							ref={closeButton}
							type="button"
							aria-label={text.close}
							onClick={close}
							className="flex size-11 shrink-0 items-center justify-center rounded-full text-slate-700 hover:bg-green-50 focus-visible:outline-2 focus-visible:outline-[#007A32]"
						>
							<X className="size-5" aria-hidden="true" />
						</button>
					</div>
					<p role="status" className="sr-only">
						{selected.label}, {selected.day}, {text.arrival}{" "}
						{text[selected.mode]}
					</p>
					{choices.length > 1 && (
						<div className="border-t border-slate-100 p-2">
							<p className="px-2 pb-1 text-xs text-slate-600">{text.nearby}</p>
							{choices.map((item) => (
								<button
									key={item.id}
									type="button"
									data-secondary-choice={item.id}
									aria-pressed={item.id === selectedId}
									aria-label={`${item.label}, ${item.day}, ${text[item.mode]}, ${text.stop} ${item.ordinal}`}
									onClick={() => onSelect(item.id)}
									className={`block min-h-11 w-full rounded-lg px-3 py-2 text-left text-xs focus-visible:outline-2 focus-visible:outline-[#007A32] ${item.id === selectedId ? "bg-green-50 text-[#007A32]" : "text-slate-800 hover:bg-slate-50"}`}
								>
									{!samePlaceName && (
										<span className="block font-semibold">{item.label}</span>
									)}
									<span>
										{item.day} · {text[item.mode]}
										{(repeats.get(choiceKey(item)) ?? 0) > 1 &&
											` · ${text.stop} ${item.ordinal}`}
									</span>
								</button>
							))}
						</div>
					)}
				</section>
			)}
		</>
	);
}
