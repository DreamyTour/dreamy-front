import TourRichTextBlocks from "@/components/tours/TourRichTextBlocks";
import type { StrapiBlock } from "@/types/tours";

interface IncludedTabProps {
	contenido: StrapiBlock[];
}

export default function IncludedTab({ contenido }: IncludedTabProps) {
	return <TourRichTextBlocks content={contenido} variant="included" />;
}
