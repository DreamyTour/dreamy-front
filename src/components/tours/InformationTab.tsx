import TourAccordionList from "@/components/tours/TourAccordionList";
import type { Acordeon } from "@/types/tours";

interface InformationTabProps {
	items: Acordeon[];
}

export default function InformationTab({ items }: InformationTabProps) {
	return <TourAccordionList items={items} />;
}
