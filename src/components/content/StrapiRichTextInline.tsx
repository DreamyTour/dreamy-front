import * as React from "react";

type RichTextNode = {
	type?: string;
	text?: string;
	bold?: boolean;
	italic?: boolean;
	underline?: boolean;
	strikethrough?: boolean;
	code?: string;
	url?: string;
	children?: RichTextNode[];
};

interface Props {
	nodes: RichTextNode[];
}

const linkClassName =
	"font-medium text-primary underline decoration-primary/45 underline-offset-4 transition-colors hover:text-primary/75 hover:decoration-primary focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function getSafeLinkHref(url: string | undefined): string | undefined {
	const href = url?.trim();
	if (!href) return undefined;

	const scheme = href.match(/^([a-z][a-z\d+.-]*):/i)?.[1]?.toLowerCase();
	return !scheme || ["http", "https", "mailto", "tel"].includes(scheme)
		? href
		: undefined;
}

export default function StrapiRichTextInline({ nodes }: Props) {
	return nodes.map((node, index) => {
		const text =
			node.children && node.children.length > 0 ? (
				<StrapiRichTextInline nodes={node.children} />
			) : (
				node.text
			);

		if (text === undefined || text === "") return null;

		let textElement: React.ReactNode = text;
		if (node.bold) textElement = <strong>{textElement}</strong>;
		if (node.italic) textElement = <em>{textElement}</em>;
		if (node.underline) textElement = <u>{textElement}</u>;
		if (node.strikethrough) textElement = <s>{textElement}</s>;
		if (node.code) {
			textElement = (
				<code className="rounded bg-gray-100 px-1 text-sm">{textElement}</code>
			);
		}

		const href = node.type === "link" ? getSafeLinkHref(node.url) : undefined;
		if (href) {
			textElement = (
				<a href={href} className={linkClassName}>
					{textElement}
				</a>
			);
		}

		return <React.Fragment key={`${node.type}-${index}`}>{textElement}</React.Fragment>;
	});
}
