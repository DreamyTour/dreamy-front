import type { TicketsByDate } from "./calendarAvailability";
import { fetchCalendarAvailability } from "./calendarAvailability";

export type { TicketsByDate } from "./calendarAvailability";

export const INCA_TRAIL_PLACE_ID = 2;
export const INCA_TRAIL_ROUTES = ["1", "5"] as const;

export function shiftDateKey(dateKey: string, daysToAdd: number) {
	const [year, month, day] = dateKey.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day + daysToAdd));

	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
		2,
		"0",
	)}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

interface FetchTicketsParams {
	place?: number;
	road: string;
	year: number;
	month: number;
	signal?: AbortSignal;
}

export async function fetchIncaTrailTickets({
	place = INCA_TRAIL_PLACE_ID,
	road,
	year,
	month,
	signal,
}: FetchTicketsParams): Promise<TicketsByDate> {
	return (await fetchCalendarAvailability({ place, road, year, month, signal }))
		.dates;
}
