import { getIncaTrailBookingConfig } from "./incaTrailBooking";
import type { Tour } from "@/types/tours";

// The public booking card and schema must advertise the same starting price.
export function getTourStartingPrice(
	tour: Pick<Tour, "slug" | "priceTour">,
): number | null {
	const config = getIncaTrailBookingConfig(tour.slug);
	// Other tours render a contact form, so priceTour is not a published offer.
	if (!config || config.durationDays === 1) return null;
	return typeof tour.priceTour === "number" &&
		Number.isFinite(tour.priceTour) &&
		tour.priceTour > 0
		? tour.priceTour
		: null;
}
