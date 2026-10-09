import { MapArc, MapRoute } from "@/components/ui/map";
import {
	type RouteCoordinate,
	type TransportMode,
	transportColors,
} from "@/lib/tour-map-transport";

interface Props {
	id: string;
	from: RouteCoordinate;
	to: RouteCoordinate;
	mode: TransportMode | null;
	coordinates: RouteCoordinate[] | null;
	active: boolean;
	satellite: boolean;
	dimmed?: boolean;
}

export default function TransportRoute({
	id,
	from,
	to,
	mode,
	coordinates,
	active,
	satellite,
	dimmed = false,
}: Props) {
	const color = mode
		? transportColors[mode]
		: satellite
			? "#a3e635"
			: "#16a34a";
	const width = active ? 5 : 3.5;
	const outline = satellite ? "#0f172a" : "#ffffff";
	// A straight line is not a road or a trail. Wait for a real geometry.
	if (!coordinates && mode && mode !== "flight" && mode !== "boat") return null;
	if (!coordinates && (!mode || mode === "flight" || mode === "boat")) {
		const data = [{ id, from, to }];
		return (
			<>
				<MapArc
					id={`${id}-outline`}
					data={data}
					curvature={0.28}
					samples={96}
					paint={{
						"line-color": outline,
						"line-width": width + 4,
						"line-opacity": dimmed ? 0.15 : 0.85,
					}}
					interactive={false}
				/>
				<MapArc
					id={id}
					data={data}
					curvature={0.28}
					samples={96}
					paint={{
						"line-color": color,
						"line-width": width,
						"line-opacity": dimmed ? 0.2 : 1,
						...(mode === "boat" ? { "line-dasharray": [2, 2] } : {}),
					}}
					interactive={false}
				/>
			</>
		);
	}
	const path = coordinates ?? [from, to];
	const dashed = mode === "walking" || !coordinates;
	const dashArray: [number, number] | undefined = dashed ? [1, 1.6] : undefined;
	return (
		<>
			<MapRoute
				id={`${id}-outline`}
				coordinates={path}
				color={outline}
				width={width + 4}
				dashArray={dashArray}
				opacity={dimmed ? 0.15 : 0.9}
				interactive={false}
			/>
			<MapRoute
				id={id}
				coordinates={path}
				color={color}
				width={width}
				dashArray={dashArray}
				opacity={dimmed ? 0.2 : 1}
				interactive={false}
			/>
			{mode === "train" && (
				<>
					<MapRoute
						id={`${id}-rail-gap`}
						coordinates={path}
						color={outline}
						width={1.5}
						opacity={dimmed ? 0.2 : 1}
						interactive={false}
					/>
					<MapRoute
						id={`${id}-sleepers`}
						coordinates={path}
						color={color}
						width={width + 6}
						dashArray={[0.1, 1]}
						lineCap="butt"
						opacity={dimmed ? 0.2 : 1}
						interactive={false}
					/>
				</>
			)}
		</>
	);
}
