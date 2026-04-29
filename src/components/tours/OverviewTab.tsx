import * as React from "react";
import type {
	StrapiBlock,
	StrapiBlockChild,
	Timeline,
} from "@/interface/tours";

interface OverviewTabProps {
	timeline: Timeline[];
}

export default function OverviewTab({ timeline }: OverviewTabProps) {
	// Componente para renderizar itemsDay con bullet verde
	const ItemsDayContent = ({ content }: { content: StrapiBlock[] }) => {
		if (!content || !Array.isArray(content)) return null;

		return (
			<div className="space-y-4">
				{content.map((block, blockIndex) => {
					if (block.type === "heading") {
						const headingText = (block.children || [])
							.map((child: StrapiBlockChild) => child.text || "")
							.join("");
						return (
							<h4
								key={blockIndex}
								className="text-base font-semibold text-gray-800 mb-2 mt-3"
							>
								{headingText}
							</h4>
						);
					}

					if (block.type === "list") {
						const format = (block as { format?: string }).format;
						const ListTag = format === "ordered" ? "ol" : "ul";

						return (
							<ListTag
								key={blockIndex}
								className={`${format === "ordered" ? "list-decimal" : "list-none"} space-y-2 my-3 ml-0`}
							>
								{(block.children || []).map(
									(listItem: StrapiBlockChild, i: number) => (
										<li key={i} className="flex items-start gap-2">
											<span className="text-green-600 font-bold text-2xl">
												•
											</span>
											<span className="text-base text-gray-600 mt-1">
												{(listItem.children || [])
													.map((child: StrapiBlockChild) => child.text || "")
													.join("")}
											</span>
										</li>
									),
								)}
							</ListTag>
						);
					}

					if (block.type === "paragraph") {
						return (
							<p
								key={blockIndex}
								className="mb-2 text-base leading-relaxed text-gray-600"
							>
								{(block.children || [])
									.map((child: StrapiBlockChild) => child.text || "")
									.join("")}
							</p>
						);
					}

					if (block.type === "quote") {
						return (
							<blockquote
								key={blockIndex}
								className="border-l-4 border-primary pl-4 italic text-base text-gray-600 my-2"
							>
								{(block.children || [])
									.map((child: StrapiBlockChild) => child.text || "")
									.join("")}
							</blockquote>
						);
					}

					return null;
				})}
			</div>
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
