import TourAccordionList from "@/components/tours/TourAccordionList";
import type { Acordeon } from "@/types/tours";

interface ItineraryTabProps {
	items: Acordeon[];
}

export default function ItineraryTab({ items }: ItineraryTabProps) {
	return <TourAccordionList items={items} openFirst asList />;
}
