import * as React from "react";
import { ChevronIcon } from "@/components/icons/NavigationIcons";
import { normalizeLists } from "@/lib/strapiBlocks";
import { cn } from "@/lib/utils";
import type {
	Acordeon as AcordeonType,
	StrapiBlock,
	StrapiBlockChild,
} from "@/types/tours";

interface ItineraryTabProps {
	items: AcordeonType[];
}

export default function ItineraryTab({ items }: ItineraryTabProps) {
	return (
		<div className="space-y-4">
			{items.map((item, index) => (
				<AccordionItem
					key={item.titulo}
					item={item}
					defaultOpen={index === 0}
				/>
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
	const [isOpen, setIsOpen] = React.useState(defaultOpen);
	const contentId = React.useId();

	// Componente para renderizar blocks del acordeón
	const AcordeonContent = ({ content }: { content: StrapiBlock[] }) => {
		if (!content || !Array.isArray(content)) return null;

		const getChildKey = (child: StrapiBlockChild) => JSON.stringify(child);

		const getBlockKey = (block: StrapiBlock) => JSON.stringify(block);

		const renderTextNodes = (children: StrapiBlockChild[]) => {
			return children.map((child) => {
				if (!child.text) return null;
				let textElement: React.ReactNode = child.text;
				if (child.bold) textElement = <strong>{textElement}</strong>;
				if (child.italic) textElement = <em>{textElement}</em>;
				if (child.underline) textElement = <u>{textElement}</u>;
				if (child.strikethrough) textElement = <s>{textElement}</s>;
				if (child.code)
					textElement = (
						<code className="bg-gray-100 px-1 rounded text-sm">
							{textElement}
						</code>
					);
				return (
					<React.Fragment key={getChildKey(child)}>
						{textElement}
					</React.Fragment>
				);
			});
		};

		const normalized = normalizeLists(content);

		return (
			<div className="space-y-2">
				{normalized.map((block) => {
					if (block.type === "paragraph") {
						return (
							<p
								key={getBlockKey(block)}
								className="text-base leading-7 text-muted-foreground"
							>
								{renderTextNodes(block.children || [])}
							</p>
						);
					}

					if (block.type === "heading") {
						const level = block.level as number | undefined;
						if (level === 1) {
							return (
								<h2
									key={getBlockKey(block)}
									className="text-xl font-bold text-foreground"
								>
									{renderTextNodes(block.children || [])}
								</h2>
							);
						}
						if (level === 2) {
							return (
								<h2
									key={getBlockKey(block)}
									className="text-lg font-bold text-foreground"
								>
									{renderTextNodes(block.children || [])}
								</h2>
							);
						}
						return (
							<h2
								key={getBlockKey(block)}
								className="text-base font-semibold text-foreground"
							>
								{renderTextNodes(block.children || [])}
							</h2>
						);
					}

					if (block.type === "list") {
						const format = (block as StrapiBlock & { format?: string }).format;
						const ListTag = format === "ordered" ? "ol" : "ul";

						return (
							<ListTag
								key={getBlockKey(block)}
								className={`${format === "ordered" ? "list-decimal" : "list-disc"} ml-4 space-y-1 text-base text-muted-foreground`}
							>
								{(block.children || []).map((listItem: StrapiBlockChild) => (
									<li
										key={getChildKey(listItem)}
										className="text-muted-foreground"
									>
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
		<div className="overflow-hidden rounded-sm border border-border/80 bg-background shadow-[0_22px_50px_-38px_color-mix(in_oklab,var(--foreground)_24%,transparent)]">
			<button
				type="button"
				aria-expanded={isOpen}
				aria-controls={contentId}
				className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-5 text-left transition-colors duration-200 hover:bg-primary/[0.03] md:px-6"
				onClick={() => setIsOpen((current) => !current)}
			>
				<span className="text-left text-sm font-semibold text-foreground md:text-base">
					{item.titulo}
				</span>
				<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-primary/10 bg-primary/[0.06] text-primary">
					<ChevronIcon
						className={cn(
							"h-5 w-5 transition-transform duration-200",
							isOpen && "rotate-180",
						)}
					/>
				</span>
			</button>
			<div
				id={contentId}
				className={cn(
					"grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
					isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
				)}
			>
				<div className="overflow-hidden">
					<div className="border-t border-primary/10 px-5 pb-5 pt-4 md:px-6 md:pb-6">
						<AcordeonContent content={item.contenido} />
					</div>
				</div>
			</div>
		</div>
	);
}
