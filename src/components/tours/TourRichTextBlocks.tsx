import * as React from "react";
import { normalizeLists } from "@/lib/strapiBlocks";
import type { StrapiBlock, StrapiBlockChild } from "@/types/tours";

type Variant = "included" | "price" | "overview";

const tabHeadingClass =
  "mb-2 mt-4 text-xl font-extrabold leading-tight tracking-tight text-foreground";
const tabSubheadingClass =
  "mb-2 mt-3 text-lg font-bold leading-snug text-gray-800";

interface Props {
  content?: StrapiBlock[];
  variant?: Variant;
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

function getIncludedListStyle(
  normalizedContent: StrapiBlock[],
  blockIndex: number,
) {
  let headingIndex = 0;

  for (let index = blockIndex - 1; index >= 0; index--) {
    if (normalizedContent[index].type !== "heading") continue;

    const level = (normalizedContent[index] as { level?: number }).level;
    if (level === 2 || level === 3) {
      headingIndex = normalizedContent.slice(0, index).filter((block) => {
        const headingLevel = (block as { level?: number }).level;
        return (
          block.type === "heading" && (headingLevel === 2 || headingLevel === 3)
        );
      }).length;
    }
    break;
  }

  const styles = [
    { icon: "\u2713", color: "text-green-600" },
    { icon: "\u00d7", color: "text-secondary" },
    { icon: "!", color: "text-yellow-600" },
  ];

  return styles[headingIndex % styles.length];
}

function renderList(
  block: StrapiBlock,
  normalizedContent: StrapiBlock[],
  blockIndex: number,
  variant: Variant,
) {
  const format = (block as { format?: string }).format;
  const blockKey = JSON.stringify(block);
  const ListTag = format === "ordered" ? "ol" : "ul";
  const isOrdered = format === "ordered";
  const isOverview = variant === "overview";
  const includedStyle =
    variant === "included"
      ? getIncludedListStyle(normalizedContent, blockIndex)
      : null;
  const icon = variant === "included" ? includedStyle?.icon : "\u2022";
  const iconClass =
    variant === "included"
      ? `${includedStyle?.color} text-xl`
      : "text-green-600 text-2xl";

  return (
    <ListTag
      key={blockKey}
      className={`${isOrdered ? "list-decimal" : "list-none"} my-3 ml-0 space-y-2 ${isOverview ? "" : "p-3"}`}
    >
      {(block.children || []).map((listItem: StrapiBlockChild) => (
        <li key={JSON.stringify(listItem)} className="flex items-start gap-2">
          {!isOrdered && (
            <span className={`${iconClass} font-bold`}>{icon}</span>
          )}
          <span
            className={`text-base ${isOverview ? "mt-1 text-gray-600" : "text-gray-700"}`}
          >
            {renderTextNodes(listItem.children || [])}
          </span>
        </li>
      ))}
    </ListTag>
  );
}

export default function TourRichTextBlocks({
  content,
  variant = "price",
}: Props) {
  const normalizedContent = React.useMemo(
    () => (Array.isArray(content) ? normalizeLists(content) : []),
    [content],
  );

  if (normalizedContent.length === 0) return null;

  return (
    <div className="space-y-4">
      {normalizedContent.map((block, blockIndex) => {
        const blockKey = JSON.stringify(block);

        if (block.type === "heading") {
          const level = (block as { level?: number }).level;
          const HeadingTag = level && level >= 4 ? "h4" : "h3";

          return (
            <HeadingTag
              key={blockKey}
              className={
                level && level >= 4 ? tabSubheadingClass : tabHeadingClass
              }
            >
              {renderTextNodes(block.children || [])}
            </HeadingTag>
          );
        }

        if (block.type === "list") {
          return renderList(block, normalizedContent, blockIndex, variant);
        }

        if (block.type === "paragraph") {
          return (
            <p
              key={blockKey}
              className="mb-2 text-base leading-relaxed text-gray-600"
            >
              {renderTextNodes(block.children || [])}
            </p>
          );
        }

        if (block.type === "quote") {
          return (
            <blockquote
              key={blockKey}
              className="my-2 border-l-4 border-primary pl-4 text-base italic text-gray-600"
            >
              {renderTextNodes(block.children || [])}
            </blockquote>
          );
        }

        return null;
      })}
    </div>
  );
}
