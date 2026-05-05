import * as React from "react";
import { ChevronIcon } from "@/components/icons/NavigationIcons";
import type { Acordeon as AcordeonType } from "@/interface/tours";
import { normalizeLists } from "@/lib/strapiBlocks";

interface ItineraryTabProps {
	items: AcordeonType[];
}

export default function ItineraryTab({ items }: ItineraryTabProps) {
	return (
		<div className="space-y-3">
			{items.map((item, index) => (
				<AccordionItem key={index} item={item} defaultOpen={index === 0} />
			))}
		</div>
	);
}

function AccordionItem({
	item,
	defaultOpen,
}: {
	item: AcordeonType;
	defaultOpen: boolean;
}) {
	// Componente para renderizar blocks del acordeón
	const AcordeonContent = ({ content }: { content: any[] }) => {
		if (!content || !Array.isArray(content)) return null;

		const renderTextNodes = (children: any[]) => {
			return children.map((child, i) => {
				if (!child.text) return null;
				let textElement: React.ReactNode = child.text;
				if (child.bold) textElement = <strong key={`bold-${i}`}>{textElement}</strong>;
				if (child.italic) textElement = <em key={`em-${i}`}>{textElement}</em>;
				if (child.underline) textElement = <u key={`u-${i}`}>{textElement}</u>;
				if (child.strikethrough) textElement = <s key={`s-${i}`}>{textElement}</s>;
				if (child.code) textElement = <code key={`code-${i}`} className="bg-gray-100 px-1 rounded text-sm">{textElement}</code>;
				return <React.Fragment key={i}>{textElement}</React.Fragment>;
			});
		};

		const normalized = React.useMemo(() => normalizeLists(content), [content]);

		return (
			<div className="space-y-2">
				{normalized.map((block: any, blockIndex: number) => {
					if (block.type === "paragraph") {
						return (
							<p
								key={blockIndex}
								className="text-base leading-relaxed text-foreground/80"
							>
								{renderTextNodes(block.children || [])}
							</p>
						);
					}

					if (block.type === "heading") {
						const level = block.level;
						if (level === 1) {
							return (
								<h1
									key={blockIndex}
									className="text-xl font-bold text-gray-900"
								>
									{renderTextNodes(block.children || [])}
								</h1>
							);
						}
						if (level === 2) {
							return (
								<h2
									key={blockIndex}
									className="text-lg font-bold text-gray-900"
								>
									{renderTextNodes(block.children || [])}
								</h2>
							);
						}
						return (
							<h3
								key={blockIndex}
								className="text-base font-semibold text-gray-800"
							>
								{renderTextNodes(block.children || [])}
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
										{renderTextNodes(listItem.children || [])}
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
		<details
			open={defaultOpen}
			className="group border border-gray-200 rounded-sm overflow-hidden"
		>
			<summary className="w-full flex items-center justify-between p-4 md:p-5 bg-white hover:bg-gray-50 transition-colors duration-200 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
				<span className="font-semibold text-gray-800 text-sm md:text-base text-left">
					{item.titulo}
				</span>
				<span className="text-gray-400 transition-transform duration-200 group-open:rotate-180">
					<ChevronIcon className="w-5 h-5" />
				</span>
			</summary>
			<div className="px-4 md:px-5 pb-4 md:pb-5">
				<AcordeonContent content={item.contenido} />
			</div>
		</details>
	);
}
