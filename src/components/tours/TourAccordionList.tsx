import * as React from "react";
import { ChevronIcon } from "@/components/icons/NavigationIcons";
import { normalizeLists } from "@/lib/strapiBlocks";
import { cn } from "@/lib/utils";
import type { Lang } from "@/lib/i18n";
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

function renderTextNodes(children: StrapiBlockChild[]) {
  return children.map((child) => {
    if (!child.text) return null;

    let textElement: React.ReactNode = child.text;
    if (child.bold) textElement = <strong>{textElement}</strong>;
    if (child.italic) textElement = <em>{textElement}</em>;
    if (child.underline) textElement = <u>{textElement}</u>;
    if (child.strikethrough) textElement = <s>{textElement}</s>;
    if (child.code) {
      textElement = (
        <code className="rounded bg-gray-100 px-1 text-sm">{textElement}</code>
      );
    }

    return (
      <React.Fragment key={JSON.stringify(child)}>{textElement}</React.Fragment>
    );
  });
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
          const className =
            level === 1
              ? "text-xl font-bold text-foreground"
              : level === 2
                ? "text-lg font-bold text-foreground"
                : "text-base font-semibold text-foreground";

          return (
            <h2 key={blockKey} className={className}>
              {renderTextNodes(block.children || [])}
            </h2>
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
  lang = "es",
}: {
  item: AcordeonType;
  defaultOpen: boolean;
  variant?: "default" | "timeline";
  index: number;
  lang?: Lang;
}) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const contentId = React.useId();
  const dayLabels: Record<Lang, string> = {
    en: "DAY",
    es: "DÍA",
    pt: "DIA",
  };
  const dayLabel = dayLabels[lang] ?? dayLabels.es;

  if (variant === "timeline") {
    return (
      <div className="group relative grid grid-cols-[3.25rem_minmax(0,1fr)] gap-0 md:grid-cols-[3.75rem_minmax(0,1fr)]">
        <div className="relative flex justify-center">
          <span className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-border" />
          <span
            className={cn(
              "relative z-10 mt-4 flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold shadow-sm transition-colors duration-200 md:h-10 md:w-10 md:text-sm",
              isOpen
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground",
            )}
          >
            {index + 1}
          </span>
        </div>

        <div className="min-w-0 border-b border-border/80 px-1 py-7 first:pt-1 md:px-2 md:py-8">
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls={contentId}
            className="group flex w-full cursor-pointer items-center justify-between gap-5 text-left"
            onClick={() => setIsOpen((current) => !current)}
          >
            <span className="min-w-0">
              <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.18em] text-secondary">
                {dayLabel} {index + 1}
              </span>
              <span className="block text-xl font-extrabold leading-tight tracking-tight text-foreground md:text-2xl">
                {item.titulo}
              </span>
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground transition-colors duration-200 group-hover:text-primary">
              <ChevronIcon
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
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
              <div className="pt-5 md:pt-6">
                <AccordionContent content={item.contenido} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <AccordionContent content={item.contenido} />
          </div>
        </div>
      </div>
    </div>
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

  return <div className="space-y-4">{content}</div>;
}
