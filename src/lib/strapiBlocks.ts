import type { StrapiBlock } from "@/types/tours";

type ListBlock = StrapiBlock & { format?: string };

export type GalleryBlock = {
	type: "gallery";
	images: StrapiBlock[];
};

/**
 * Agrupa bloques de lista consecutivos del mismo formato en un único bloque.
 * El backend de Strapi v5 a veces devuelve cada item de lista como un bloque
 * separado, generando múltiples <ul> o <ol> en lugar de uno solo.
 */
export function normalizeLists(content: StrapiBlock[]): StrapiBlock[] {
	return content.reduce((acc: StrapiBlock[], block: StrapiBlock) => {
		const lastBlock = acc[acc.length - 1];
		if (
			block.type === "list" &&
			lastBlock &&
			lastBlock.type === "list" &&
			(block as ListBlock).format === (lastBlock as ListBlock).format
		) {
			lastBlock.children = [
				...(lastBlock.children || []),
				...(block.children || []),
			];
			return acc;
		}
		if (block.type === "list") {
			acc.push({ ...block, children: [...(block.children || [])] });
		} else {
			acc.push(block);
		}
		return acc;
	}, []);
}

/**
 * Agrupa bloques de imágenes consecutivas en un único bloque de tipo 'gallery'.
 * Esto permite mostrarlas en un grid en lugar de una debajo de la otra.
 */
export function groupStrapiRichTextBlocks(
	blocks: StrapiBlock[] = [],
): Array<StrapiBlock | GalleryBlock> {
	const grouped: Array<StrapiBlock | GalleryBlock> = [];
	const imageBuffer: StrapiBlock[] = [];

	function flushImages() {
		while (imageBuffer.length > 0) {
			if (imageBuffer.length === 1) {
				const image = imageBuffer.shift();
				if (image) grouped.push(image);
			} else {
				grouped.push({
					type: "gallery",
					images: imageBuffer.splice(0, 3),
				});
			}
		}
	}

	for (const block of blocks) {
		if (block.type === "image") {
			imageBuffer.push(block);
			continue;
		}

		flushImages();
		grouped.push(block);
	}

	flushImages();

	return grouped;
}
