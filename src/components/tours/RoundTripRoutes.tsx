import type { GeoJSONSource } from "maplibre-gl";
import { useEffect, useId, useMemo } from "react";
import { useMap } from "@/components/ui/map";
import type { RouteCoordinate } from "@/lib/tour-map-transport";
import {
	type DirectionalSegment,
	roundTripFeatures,
} from "@/lib/tour-round-trip";

/** Native camera-aware rendering. Sources change only with itinerary/view data. */
const noMarkers: RouteCoordinate[] = [];
export default function RoundTripRoutes({
	segments,
	markerCoordinates = noMarkers,
	satellite = false,
}: {
	segments: DirectionalSegment[];
	markerCoordinates?: RouteCoordinate[];
	satellite?: boolean;
}) {
	const { map, isLoaded } = useMap();
	const instance = useId().replace(/[^a-zA-Z0-9-]/g, "");
	const prefix = `round-trip-${instance}`;
	const data = useMemo(
		() => roundTripFeatures(segments, markerCoordinates),
		[segments, markerCoordinates],
	);
	useEffect(() => {
		if (!map || !isLoaded) return;
		const arrowId = `${prefix}-arrow`,
			stationId = `${prefix}-station`;
		const canvas = document.createElement("canvas");
		canvas.width = 12;
		canvas.height = 6;
		const context = canvas.getContext("2d");
		if (!context) return;
		// A right-facing chevron: native line placement rotates its x-axis with travel.
		context.strokeStyle = "#0f172a";
		context.lineWidth = 1.6;
		context.lineCap = "round";
		context.lineJoin = "round";
		context.beginPath();
		context.moveTo(3, 1);
		context.lineTo(8, 3);
		context.lineTo(3, 5);
		context.stroke();
		map.addImage(arrowId, context.getImageData(0, 0, 12, 6));
		// Invisible collision boxes protect the ends without moving the real markers.
		map.addImage(stationId, {
			width: 48,
			height: 48,
			data: new Uint8Array(48 * 48 * 4),
		});
		map.addSource(prefix, {
			type: "geojson",
			data: { type: "FeatureCollection", features: [] },
			tolerance: 0,
		});
		const lineFilter: ["==", ["get", string], string] = [
			"==",
			["get", "kind"],
			"route",
		];
		const ids = [
			`${prefix}-outer`,
			`${prefix}-halo`,
			`${prefix}-line`,
			`${prefix}-stations`,
			`${prefix}-arrows`,
		];
		for (const [index, width, color] of [
			[0, 8, "#ffffff"],
			[1, 6, "#0f172a"],
			[2, 3.5, null],
		] as const) {
			map.addLayer({
				id: ids[index],
				type: "line",
				source: prefix,
				filter: lineFilter,
				layout: { "line-join": "round", "line-cap": "round" },
				paint: {
					"line-color": color ?? ["get", "color"],
					"line-width": width,
					"line-offset": ["get", "offset"],
					"line-opacity": 1,
				},
			});
		}
		map.addLayer({
			id: ids[3],
			type: "symbol",
			source: prefix,
			filter: ["==", ["get", "kind"], "station"],
			layout: {
				"icon-image": stationId,
				"icon-allow-overlap": false,
				"icon-ignore-placement": false,
				"icon-padding": 8,
			},
		});
		map.addLayer({
			id: ids[4],
			type: "symbol",
			source: prefix,
			filter: lineFilter,
			layout: {
				"symbol-placement": "line",
				"symbol-spacing": 220,
				"icon-image": arrowId,
				"icon-size": 1,
				"icon-offset": ["get", "arrowOffset"],
				"icon-rotation-alignment": "map",
				"icon-pitch-alignment": "map",
				"icon-keep-upright": false,
				"icon-allow-overlap": false,
				"icon-ignore-placement": false,
				// The 6px icon fits each 8px-separated lane; padded boxes hid its inverse.
				"icon-padding": 0,
			},
		});
		return () => {
			// The parent map can be removed before React cleans up its children.
			if (!map.getStyle()) return;
			for (const id of [...ids].reverse())
				if (map.getLayer(id)) map.removeLayer(id);
			if (map.getSource(prefix)) map.removeSource(prefix);
			for (const id of [arrowId, stationId])
				if (map.hasImage(id)) map.removeImage(id);
		};
	}, [map, isLoaded, prefix]);
	useEffect(() => {
		if (!map || !isLoaded) return;
		(map.getSource(prefix) as GeoJSONSource | undefined)?.setData(data);
	}, [map, isLoaded, prefix, data]);
	useEffect(() => {
		if (!map || !isLoaded || !map.getLayer(`${prefix}-outer`)) return;
		map.setPaintProperty(
			`${prefix}-outer`,
			"line-opacity",
			satellite ? 0.9 : 1,
		);
	}, [map, isLoaded, prefix, satellite]);
	return null;
}
