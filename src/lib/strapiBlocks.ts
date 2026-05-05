import type { StrapiBlock } from "@/interface/tours";

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
			(block as any).format === (lastBlock as any).format
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
