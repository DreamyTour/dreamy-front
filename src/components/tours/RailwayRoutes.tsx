import type { ExpressionSpecification, GeoJSONSource } from "maplibre-gl";
import { useEffect, useId, useMemo } from "react";
import { useMap } from "@/components/ui/map";
import { type RailwaySegment, railwayFeatures } from "@/lib/tour-railway";

const zoom = (general: number, close: number): ExpressionSpecification => [
	"interpolate",
	["linear"],
	["zoom"],
	8,
	general,
	13,
	close,
];

/** One native source per visible set, three line layers, no per-sleeper objects. */
export default function RailwayRoutes({
	segments,
	satellite = false,
}: {
	segments: RailwaySegment[];
	satellite?: boolean;
}) {
	const { map, isLoaded } = useMap();
	const id = `railway-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
	const data = useMemo(() => railwayFeatures(segments), [segments]);
	useEffect(() => {
		if (!map || !isLoaded) return;
		map.addSource(id, {
			type: "geojson",
			data: { type: "FeatureCollection", features: [] },
			tolerance: 0,
		});
		map.addLayer({
			id: `${id}-contrast`,
			type: "line",
			source: id,
			layout: { "line-join": "round", "line-cap": "butt" },
			paint: {
				"line-color": "#ffffff",
				"line-gap-width": zoom(1.1, 2.8),
				"line-width": zoom(1.2, 1.7),
				"line-opacity": 0.5,
			},
		});
		map.addLayer({
			id: `${id}-sleepers`,
			type: "line",
			source: id,
			layout: { "line-join": "round", "line-cap": "butt" },
			paint: {
				"line-color": "#343434",
				"line-width": zoom(4.8, 7.5),
				"line-dasharray": [
					"step",
					["zoom"],
					["literal", [0.17, 2.1]],
					11,
					["literal", [0.17, 1.65]],
				],
				"line-opacity": 1,
			},
		});
		map.addLayer({
			id: `${id}-rails`,
			type: "line",
			source: id,
			layout: { "line-join": "round", "line-cap": "butt" },
			paint: {
				"line-color": "#343434",
				"line-gap-width": zoom(1.8, 3.5),
				"line-width": zoom(0.55, 1),
				"line-opacity": 1,
			},
		});
		return () => {
			if (!map.getStyle()) return;
			for (const suffix of ["rails", "sleepers", "contrast"])
				if (map.getLayer(`${id}-${suffix}`)) map.removeLayer(`${id}-${suffix}`);
			if (map.getSource(id)) map.removeSource(id);
		};
	}, [map, isLoaded, id]);
	useEffect(() => {
		if (map && isLoaded)
			(map.getSource(id) as GeoJSONSource | undefined)?.setData(data);
	}, [map, isLoaded, id, data]);
	useEffect(() => {
		if (map && isLoaded && map.getLayer(`${id}-contrast`))
			map.setPaintProperty(
				`${id}-contrast`,
				"line-opacity",
				satellite ? 0.85 : 0.4,
			);
	}, [map, isLoaded, id, satellite]);
	return null;
}

export function RailwayLegend({
	segments,
	lang = "es",
}: {
	segments: RailwaySegment[];
	lang?: "es" | "en" | "pt";
}) {
	if (!segments.length) return null;
	const title = {
		es: "Sentido del viaje en tren",
		en: "Train travel direction",
		pt: "Sentido da viagem de trem",
	}[lang];
	const to = { es: "hasta", en: "to", pt: "até" }[lang];
	return (
		<ul aria-label={title} className="space-y-1 px-1 text-xs text-slate-800">
			{segments.map((segment) => (
				<li key={segment.id}>
					{segment.day && <strong>{segment.day}: </strong>}
					{segment.fromLabel}
					<span aria-hidden="true"> → </span>
					<span className="sr-only"> {to} </span>
					{segment.toLabel}
				</li>
			))}
		</ul>
	);
}
