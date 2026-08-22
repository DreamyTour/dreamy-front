import * as React from "react";
import StrapiRichTextInline from "@/components/content/StrapiRichTextInline";
import { ChevronIcon } from "@/components/icons/NavigationIcons";
import type { Lang } from "@/lib/i18n";
import { normalizeLists } from "@/lib/strapiBlocks";
import { cn } from "@/lib/utils";
import type {
	Acordeon as AcordeonType,
	StrapiBlock,
	StrapiBlockChild,
} from "@/types/tours";

interface Props {
	items: AcordeonType[];
	openFirst?: boolean;
	asList?: boolean;
	variant?: "default" | "timeline";
	lang?: Lang;
}

const tabContentHeadingClass =
	"mb-2 mt-4 text-xl font-medium leading-tight tracking-tight text-foreground md:font-extrabold";
const tabContentSubheadingClass =
	"mb-2 mt-3 text-lg font-bold leading-snug text-foreground";

function renderTextNodes(children: StrapiBlockChild[]) {
	return <StrapiRichTextInline nodes={children} />;
}

function AccordionContent({ content }: { content: StrapiBlock[] }) {
	if (!Array.isArray(content)) return null;

	const normalized = normalizeLists(content);

	return (
		<div className="space-y-2">
			{normalized.map((block) => {
				const blockKey = JSON.stringify(block);

				if (block.type === "paragraph") {
					return (
						<p
							key={blockKey}
							className="text-base leading-7 text-muted-foreground"
						>
							{renderTextNodes(block.children || [])}
						</p>
					);
				}

				if (block.type === "heading") {
					const level = block.level as number | undefined;
					const HeadingTag = level && level >= 4 ? "h4" : "h3";

					return (
						<HeadingTag
							key={blockKey}
							className={
								level && level >= 4
									? tabContentSubheadingClass
									: tabContentHeadingClass
							}
						>
							{renderTextNodes(block.children || [])}
						</HeadingTag>
					);
				}

				if (block.type === "list") {
					const format = (block as StrapiBlock & { format?: string }).format;
					const ListTag = format === "ordered" ? "ol" : "ul";

					return (
						<ListTag
							key={blockKey}
							className={`${format === "ordered" ? "list-decimal" : "list-disc"} ml-4 space-y-1 text-base text-muted-foreground`}
						>
							{(block.children || []).map((listItem: StrapiBlockChild) => (
								<li
									key={JSON.stringify(listItem)}
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
}

function AccordionItem({
	item,
	defaultOpen,
	variant = "default",
	index,
	isLast,
	lang = "es",
}: {
	item: AcordeonType;
	defaultOpen: boolean;
	variant?: "default" | "timeline";
	index: number;
	isLast?: boolean;
	lang?: Lang;
}) {
	const [isOpen, setIsOpen] = React.useState(defaultOpen);
	const contentId = React.useId();
	const triggerId = React.useId();
	const dayLabels: Record<Lang, string> = {
		en: "DAY",
		es: "DÍA",
		pt: "DIA",
	};
	const dayLabel = dayLabels[lang] ?? dayLabels.es;

	if (variant === "timeline") {
		return (
			<div
				className={cn(
					"group relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[2.75rem_minmax(0,1fr)] sm:gap-x-4",
					!isLast && "mb-3",
				)}
			>
				<div className="relative flex justify-center">
					{isOpen && (
						<span
							className={cn(
								"tour-itinerary-connector absolute top-[1.875rem] left-1/2 -translate-x-1/2 sm:top-9",
								isLast ? "bottom-5" : "bottom-[-0.75rem]",
							)}
							aria-hidden="true"
						/>
					)}
					<span
						className="relative z-10 mt-4 grid h-7 w-7 place-items-center sm:mt-5 sm:h-8 sm:w-8"
						aria-hidden="true"
					>
						<span className="absolute h-5 w-5 rounded-full bg-primary/15 sm:h-6 sm:w-6" />
						{isOpen && (
							<span className="absolute h-5 w-5 rounded-full border border-primary/55 motion-safe:animate-ping motion-reduce:animate-none sm:h-6 sm:w-6" />
						)}
						<span
							className={cn(
								"relative h-2.5 w-2.5 rounded-full border-2 border-background bg-primary",
								isOpen && "h-3 w-3",
							)}
						/>
					</span>
				</div>

				<article
					className={cn(
						"min-w-0 overflow-hidden rounded-xl border border-border bg-background transition-[border-color,background-color] duration-300 motion-reduce:transition-none",
						isOpen ? "border-primary/30" : "hover:border-primary/25",
					)}
				>
					<h3>
						<button
							id={triggerId}
							type="button"
							aria-expanded={isOpen}
							aria-controls={contentId}
							className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-4 text-left outline-none transition-colors duration-300 hover:bg-primary/[0.035] focus-visible:bg-primary/[0.06] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary/65 sm:gap-6 sm:px-5 sm:py-4.5"
							onClick={() => setIsOpen((current) => !current)}
						>
							<span className="min-w-0">
								<span className="mb-1 block text-[0.66rem] font-bold uppercase tracking-[0.14em] text-secondary sm:text-[0.72rem]">
									{dayLabel} {String(index + 1).padStart(2, "0")}
								</span>
								<span className="block text-[0.93rem] font-bold leading-snug tracking-[-0.012em] text-foreground sm:text-[1rem]">
									{item.titulo}
								</span>
							</span>
							<span
								className={cn(
									"grid h-9 w-9 shrink-0 place-items-center text-secondary transition-[color,transform] duration-300 motion-reduce:transition-none sm:h-10 sm:w-10",
									isOpen
										? "rotate-180"
										: "group-hover:text-secondary/70",
								)}
								aria-hidden="true"
							>
								<ChevronIcon className="h-5 w-5 sm:h-6 sm:w-6" />
							</span>
						</button>
					</h3>
					<div
						id={contentId}
						role="region"
						aria-labelledby={triggerId}
						aria-hidden={!isOpen}
						inert={!isOpen}
						className={cn(
							"grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
							isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
						)}
					>
						<div className="overflow-hidden">
							<div className="border-t border-border bg-background px-4 pb-5 pt-4 sm:px-5 sm:pb-6 sm:pt-5">
								<AccordionContent content={item.contenido} />
							</div>
						</div>
					</div>
				</article>
			</div>
		);
	}

	return (
		<details
			className="group relative isolate overflow-hidden rounded-[1.125rem] border border-border/80 bg-card shadow-[0_20px_48px_-40px_color-mix(in_oklab,var(--foreground)_42%,transparent)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_28px_58px_-42px_color-mix(in_oklab,var(--foreground)_46%,transparent)] open:border-primary/30 open:shadow-[0_28px_64px_-44px_color-mix(in_oklab,var(--primary)_36%,transparent)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
			open={defaultOpen}
		>
			<span
				className="absolute inset-y-0 left-0 w-1 origin-top scale-y-0 bg-primary transition-transform duration-300 group-open:scale-y-100 motion-reduce:transition-none"
				aria-hidden="true"
			/>
			<summary className="relative flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 pr-3 text-left outline-none transition-colors duration-300 hover:bg-primary/[0.025] focus-visible:bg-primary/[0.04] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/55 sm:px-5 sm:py-5 [&::-webkit-details-marker]:hidden">
				<span className="flex min-w-0 items-center gap-3.5 sm:gap-4">
					<span
						className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/15 bg-primary/[0.055] text-[0.66rem] font-extrabold tracking-[0.08em] text-primary transition-colors duration-300 group-open:border-primary group-open:bg-primary group-open:text-primary-foreground motion-reduce:transition-none sm:h-11 sm:w-11"
						aria-hidden="true"
					>
						{String(index + 1).padStart(2, "0")}
					</span>
					<span className="min-w-0 text-[0.98rem] font-semibold leading-snug tracking-[-0.012em] text-foreground sm:text-base">
						{item.titulo}
					</span>
				</span>
				<span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-primary/15 bg-background text-primary shadow-[0_6px_16px_-12px_color-mix(in_oklab,var(--foreground)_72%,transparent)] transition-[background-color,border-color,color,transform] duration-300 group-hover:border-primary/35 group-open:rotate-180 group-open:border-primary group-open:bg-primary group-open:text-primary-foreground motion-reduce:transition-none">
					<ChevronIcon className="h-[1.1rem] w-[1.1rem]" />
				</span>
			</summary>
			<div className="border-t border-border/70 bg-primary/[0.018] px-4 py-5 sm:px-5 sm:py-6">
				<div className="border-l border-primary/20 pl-4 sm:pl-5">
					<AccordionContent content={item.contenido} />
				</div>
			</div>
		</details>
	);
}

export default function TourAccordionList({
	items,
	openFirst = false,
	asList = false,
	variant = "default",
	lang,
}: Props) {
	const content = items.map((item, index) => (
		<AccordionItem
			key={item.titulo}
			item={item}
			defaultOpen={openFirst && index === 0}
			variant={variant}
			index={index}
			isLast={index === items.length - 1}
			lang={lang}
		/>
	));

	if (asList) {
		return (
			<ul
				className={cn(
					"m-0 list-none p-0",
					variant === "timeline" ? "space-y-0" : "space-y-4",
				)}
			>
				{content.map((item, index) => (
					<li key={items[index].titulo}>{item}</li>
				))}
			</ul>
		);
	}

	return <div className={variant === "timeline" ? "space-y-0" : "space-y-4"}>{content}</div>;
}
