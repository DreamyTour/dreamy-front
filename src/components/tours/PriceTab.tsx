import TourRichTextBlocks from "@/components/tours/TourRichTextBlocks";
import type { StrapiBlock } from "@/types/tours";

interface PriceTabProps {
	contenido: StrapiBlock[];
}

export default function PriceTab({ contenido }: PriceTabProps) {
	return <TourRichTextBlocks content={contenido} variant="price" />;
}
