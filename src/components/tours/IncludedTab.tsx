import * as React from "react";
import type { StrapiBlock, StrapiBlockChild } from "@/interface/tours";

interface IncludedTabProps {
	contenido: StrapiBlock[];
}

// Componente interno para renderizar blocks
function IncludedBlocks({ content }: { content: StrapiBlock[] }) {
	if (!content || !Array.isArray(content)) return null;

	return (
		<div className="space-y-4">
			{content.map((block, blockIndex) => {
				if (block.type === "heading") {
					const level = (block as { level?: number }).level;
					const headingText = (block.children || [])
						.map((child: StrapiBlockChild, i: number) => child.text || "")
						.join("");

					if (level === 3) {
						return (
							<h3
								key={blockIndex}
								className="text-lg font-bold text-gray-900 mb-2 mt-4"
							>
								{headingText}
							</h3>
						);
					}
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
					let headingIndex = 0;
					for (let i = blockIndex - 1; i >= 0; i--) {
						if (content[i].type === "heading") {
							const lvl = (content[i] as { level?: number }).level;
							if (lvl === 2 || lvl === 3) {
								headingIndex = content
									.slice(0, i)
									.filter(
										(b: StrapiBlock) =>
											b.type === "heading" &&
											((b as { level?: number }).level === 2 ||
												(b as { level?: number }).level === 3),
									).length;
							}
							break;
						}
					}

					const format = (block as { format?: string }).format;
					const listIconStyles = [
						{ icon: "✓", color: "text-green-600" },
						{ icon: "✗", color: "text-red-600" },
						{ icon: "⚠", color: "text-yellow-600" },
					];
					const style = listIconStyles[headingIndex % 3];
					const ListTag = format === "ordered" ? "ol" : "ul";

					return (
						<ListTag
							key={blockIndex}
							className={`${format === "ordered" ? "list-decimal" : "list-none"} space-y-2 my-3 ml-0 p-3`}
						>
							{(block.children || []).map(
								(listItem: StrapiBlockChild, i: number) => (
									<li key={i} className="flex items-start gap-2">
										<span className={`${style.color} font-bold text-xl`}>
											{style.icon}
										</span>
										<span className="text-base text-gray-700">
											{(listItem.children || [])
												.map(
													(child: StrapiBlockChild, j: number) =>
														child.text || "",
												)
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
								.map((child: StrapiBlockChild, i: number) => child.text || "")
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
								.map((child: StrapiBlockChild, i: number) => child.text || "")
								.join("")}
						</blockquote>
					);
				}

				return null;
			})}
		</div>
	);
}

export default function IncludedTab({ contenido }: IncludedTabProps) {
	return <IncludedBlocks content={contenido} />;
}
