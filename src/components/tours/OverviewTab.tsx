import * as React from "react";
import { marked } from "marked";
import type { Timeline } from "@/interface/tours";

interface OverviewTabProps {
	timeline: Timeline[];
}

export default function OverviewTab({ timeline }: OverviewTabProps) {
	const parseMarkdown = (content: string) => String(marked.parse(content));

	// Componente para renderizar itemsDay con bullet verde
	const ItemsDayContent = ({ content }: { content: string }) => {
		if (!content) return null;

		const html = parseMarkdown(content);
		const htmlWithGreenBullets = html.replace(
			/<li>/g,
			'<li class="flex items-start gap-2"><span class="text-green-600 font-bold text-2xl">•</span>',
		);

		return (
			<div
				className="space-y-1 text-base leading-relaxed text-gray-600"
				dangerouslySetInnerHTML={{ __html: htmlWithGreenBullets }}
			/>
		);
	};

	return (
		<div className="space-y-6">
			{timeline.map((item, index) => (
				<div key={index} className="timeline-item flex gap-4 md:gap-6">
					<div className="timeline-marker flex flex-col items-center shrink-0">
						<div className="w-12 h-12 p-2 rounded-full bg-primary text-white flex items-center justify-center text-sm text-center ring-6 ring-primary/20">
							{item.day}
						</div>
						{index < timeline.length - 1 && (
							<div className="w-0.5 flex-1 mt-2 bg-linear-to-b from-primary via-primary/40 to-transparent" />
						)}
					</div>
					<div className="timeline-content flex-1 pb-6 md:pb-8">
						<h3 className="text-lg font-semibold text-gray-800 my-2">
							{item.titulo}
						</h3>
						<ItemsDayContent content={item.itemsDay} />
					</div>
				</div>
			))}
		</div>
	);
}
