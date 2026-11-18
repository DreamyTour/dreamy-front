import { BusFront, Footprints, Plane, Ship, TrainFront } from "lucide-react";
import type { Lang } from "@/lib/i18n";
import {
	type TransportMode,
	transportColors,
	transportLabels,
} from "@/lib/tour-map-transport";

const icons = {
	walking: Footprints,
	bus: BusFront,
	train: TrainFront,
	boat: Ship,
	flight: Plane,
};

export default function DayCardTransportIcons({
	modes,
	lang,
}: {
	modes: TransportMode[];
	lang: Lang;
}) {
	return (
		<span className="flex min-w-0 flex-wrap items-center justify-end gap-2">
			{modes.map((mode) => {
				const Icon = icons[mode];
				const label = transportLabels[lang][mode];
				return (
					<span
						key={mode}
						data-day-card-mode={mode}
						role="img"
						aria-label={label}
						title={label}
						className="inline-flex items-center gap-1.5 text-xs font-semibold"
						style={{
							color: mode === "train" ? "#343434" : transportColors[mode],
						}}
					>
						<Icon className="size-4 shrink-0" aria-hidden="true" />
						{modes.length === 1 && <span aria-hidden="true">{label}</span>}
					</span>
				);
			})}
		</span>
	);
}
