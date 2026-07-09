import TourAccordionList from "@/components/tours/TourAccordionList";
import type { Lang } from "@/lib/i18n";
import type { Acordeon } from "@/types/tours";

interface ItineraryTabProps {
	items: Acordeon[];
	lang: Lang;
}

export default function ItineraryTab({ items, lang }: ItineraryTabProps) {
	return (
		<TourAccordionList
			items={items}
			openFirst
			asList
			variant="timeline"
			lang={lang}
		/>
	);
}
