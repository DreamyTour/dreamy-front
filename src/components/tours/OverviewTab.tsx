import TourRichTextBlocks from "@/components/tours/TourRichTextBlocks";
import type { Timeline } from "@/types/tours";

interface OverviewTabProps {
	timeline: Timeline[];
}

export default function OverviewTab({ timeline }: OverviewTabProps) {
	return (
		<ol className="space-y-6">
			{timeline.map((item, index) => (
				<li
					key={`${item.day}-${item.titulo}`}
					className="timeline-item flex gap-4 md:gap-6"
				>
					<div className="timeline-marker flex shrink-0 flex-col items-center">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary p-2 text-center text-sm text-white ring-6 ring-primary/20">
							{item.day}
						</div>
						{index < timeline.length - 1 && (
							<div className="mt-2 w-0.5 flex-1 bg-linear-to-b from-primary via-primary/40 to-transparent" />
						)}
					</div>
					<div className="timeline-content flex-1 pb-6 md:pb-8">
						<h2 className="my-2 text-lg font-semibold text-gray-800">
							{item.titulo}
						</h2>
						<TourRichTextBlocks content={item.itemsDay} variant="overview" />
					</div>
				</li>
			))}
		</ol>
	);
}
