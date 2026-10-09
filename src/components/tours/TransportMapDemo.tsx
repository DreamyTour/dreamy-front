import { useState } from "react";
import {
	type TransportMode,
	transportLabels,
	transportModes,
} from "@/lib/tour-map-transport";
import type { MapStop } from "@/types/tours";
import MapTab from "./MapTab";

const initialStops: MapStop[] = [
	{
		id: 1,
		order: 1,
		title: "Lima",
		description: "Punto de partida de esta demostración.",
		latitude: -12.022,
		longitude: -77.114,
	},
	{
		id: 2,
		order: 2,
		title: "Cusco",
		description:
			"La conexión aérea se representa con un arco; no indica una trayectoria de vuelo real.",
		latitude: -13.532,
		longitude: -71.967,
		transportMode: "flight",
		routeText: "Vuelo desde Lima",
	},
	{
		id: 3,
		order: 3,
		title: "Ollantaytambo",
		description:
			"Trazado por carretera calculado con OSRM y datos de OpenStreetMap. Es una muestra técnica, no una indicación de navegación.",
		latitude: -13.258,
		longitude: -72.264,
		transportMode: "bus",
		routeText: "Cusco → Ollantaytambo",
	},
	{
		id: 4,
		order: 4,
		title: "Aguas Calientes",
		description:
			"El recorrido ferroviario requiere un trazado revisado. Se muestran los destinos sin inventar una vía.",
		latitude: -13.154,
		longitude: -72.525,
		transportMode: "train",
		routeText: "Tren desde Ollantaytambo",
	},
	{
		id: 5,
		order: 5,
		title: "Machu Picchu",
		description:
			"El sendero se calcula automáticamente a partir de los destinos.",
		latitude: -13.163,
		longitude: -72.545,
		transportMode: "walking",
		routeText: "Caminata desde Aguas Calientes",
	},
];
const coastalStops: MapStop[] = [
	{
		id: 11,
		order: 1,
		title: "Lima",
		description: "Plaza Mayor de Lima.",
		latitude: -12.0453,
		longitude: -77.0304,
	},
	{
		id: 12,
		order: 2,
		title: "Paracas",
		description:
			"Muestra de un trazado real por carretera con OSRM y datos de OpenStreetMap.",
		latitude: -13.835,
		longitude: -76.247,
		transportMode: "bus",
		routeText: "Lima → Paracas",
	},
];

export default function TransportMapDemo() {
	const [scenario, setScenario] = useState("andes");
	const [stops, setStops] = useState(initialStops);
	const sourceStops = scenario === "andes" ? initialStops : coastalStops;
	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
				<p className="mb-3 text-sm font-semibold">
					Prueba local · Los selectores simulan el nuevo campo del CMS.
				</p>
				<label className="mb-4 flex flex-wrap items-center gap-3 text-sm font-semibold">
					Recorrido de prueba
					<select
						aria-label="Recorrido de prueba"
						value={scenario}
						onChange={(event) => {
							const value = event.target.value;
							setScenario(value);
							setStops(value === "andes" ? initialStops : coastalStops);
						}}
						className="min-h-11 rounded-lg border border-border bg-background px-3 text-foreground"
					>
						<option value="andes">Andes · cuatro transportes</option>
						<option value="coast">Lima → Paracas · carretera</option>
					</select>
				</label>
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{stops.slice(1).map((stop, index) => (
						<label
							key={stop.id}
							className="flex flex-col gap-2 text-xs font-semibold"
						>
							<span>
								{stops[index].title} → {stop.title}
							</span>
							<select
								aria-label={`Transporte hacia ${stop.title}`}
								value={stop.transportMode ?? "bus"}
								className="min-h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
								onChange={(event) => {
									const mode = event.target.value as TransportMode;
									setStops((current) =>
										current.map((item) =>
											item.id === stop.id
												? {
														...item,
														transportMode: mode,
														routeGeometry:
															mode === sourceStops[index + 1].transportMode
																? sourceStops[index + 1].routeGeometry
																: null,
													}
												: item,
										),
									);
								}}
							>
								{transportModes.map((mode) => (
									<option key={mode} value={mode}>
										{transportLabels.es[mode]}
									</option>
								))}
							</select>
						</label>
					))}
				</div>
				<p className="mt-3 text-xs text-muted-foreground">
					Bus y caminata calculan su recorrido automáticamente. El tren necesita
					un trazado ferroviario revisado. Esta página no modifica los tours del
					CMS.
				</p>
			</div>
			<MapTab key={scenario} lang="es" mapStops={stops} />
		</div>
	);
}
