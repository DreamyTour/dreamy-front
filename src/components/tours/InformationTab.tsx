import * as React from "react";
import type { Acordeon as AcordeonType } from "@/interface/tours";

interface InformationTabProps {
	items: AcordeonType[];
}

// Reutiliza el mismo AccordionItem de ItineraryTab
export default function InformationTab({ items }: InformationTabProps) {
	return (
		<div className="space-y-3">
			{items.map((item, index) => (
				<AccordionItem key={index} item={item} />
			))}
		</div>
	);
}

function AccordionItem({ item }: { item: AcordeonType }) {
	const AcordeonContent = ({ content }: { content: any[] }) => {
		if (!content || !Array.isArray(content)) return null;

		return (
			<div className="space-y-2">
				{content.map((block: any, blockIndex: number) => {
					if (block.type === "paragraph") {
						return (
							<p
								key={blockIndex}
								className="text-base leading-relaxed text-gray-600"
							>
								{(block.children || [])
									.map((child: any, i: number) => child.text || "")
									.join("")}
							</p>
						);
					}

					if (block.type === "heading") {
						const level = block.level;
						const headingText = (block.children || [])
							.map((child: any, i: number) => child.text || "")
							.join("");

						if (level === 1) {
							return (
								<h1
									key={blockIndex}
									className="text-xl font-bold text-gray-900"
								>
									{headingText}
								</h1>
							);
						}
						if (level === 2) {
							return (
								<h2
									key={blockIndex}
									className="text-lg font-bold text-gray-900"
								>
									{headingText}
								</h2>
							);
						}
						return (
							<h3
								key={blockIndex}
								className="text-base font-semibold text-gray-800"
							>
								{headingText}
							</h3>
						);
					}

					if (block.type === "list") {
						const format = block.format;
						const ListTag = format === "ordered" ? "ol" : "ul";

						return (
							<ListTag
								key={blockIndex}
								className={`${format === "ordered" ? "list-decimal" : "list-disc"} ml-4 text-base text-gray-600 space-y-1`}
							>
								{(block.children || []).map((listItem: any, i: number) => (
									<li key={i} className="text-gray-600">
										{(listItem.children || [])
											.map((child: any, j: number) => child.text || "")
											.join("")}
									</li>
								))}
							</ListTag>
						);
					}

					return null;
				})}
			</div>
		);
	};

	return (
		<details className="group border border-gray-200 rounded-sm overflow-hidden">
			<summary className="w-full flex items-center justify-between p-4 md:p-5 bg-white hover:bg-gray-50 transition-colors duration-200 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
				<span className="font-semibold text-gray-800 text-sm md:text-base text-left">
					{item.titulo}
				</span>
				<span className="text-gray-400 transition-transform duration-200 group-open:rotate-180">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="w-5 h-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</span>
			</summary>
			<div className="px-4 md:px-5 pb-4 md:pb-5">
				<AcordeonContent content={item.contenido} />
			</div>
		</details>
	);
}
