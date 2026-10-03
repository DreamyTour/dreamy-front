// biome-ignore-all lint/suspicious/noArrayIndexKey: This renders static table positions with no IDs or component state.
import StrapiRichTextInline from "./StrapiRichTextInline";

type TableCell = {
	header?: boolean;
	children?: React.ComponentProps<typeof StrapiRichTextInline>["nodes"];
};
type TableBlock = { children?: { children?: TableCell[] }[] };

export default function StrapiRichTextTable({ block }: { block: TableBlock }) {
	if (!block.children?.length) return null;
	return (
		<div className="my-6 max-w-full overflow-x-auto rounded-lg border border-gray-200">
			<table className="w-full border-collapse text-left text-base">
				<tbody>
					{block.children.map((row, rowIndex) => (
						<tr key={rowIndex}>
							{row.children?.map((cell, cellIndex) => {
								const Tag = cell.header ? "th" : "td";
								return (
									<Tag
										key={cellIndex}
										scope={cell.header ? "col" : undefined}
										className={`min-w-36 whitespace-pre-wrap border border-gray-200 px-4 py-3 align-top ${cell.header ? "bg-gray-100 font-semibold text-gray-900" : "text-gray-700"}`}
									>
										<StrapiRichTextInline nodes={cell.children || []} />
									</Tag>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
