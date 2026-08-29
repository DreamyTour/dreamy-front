export type TicketsByDate = Record<string, number | undefined>;

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
	const url = new URL("https://calendar.dreamy.tours/v1/tickets");
	url.searchParams.set("place", String(place));
	url.searchParams.set("road", road);
	url.searchParams.set("year", String(year));
	url.searchParams.set("month", String(month));

	const response = await fetch(url.toString(), { signal });

	if (!response.ok) {
		throw new Error(`Calendar request failed (${response.status})`);
	}

	const data = (await response.json()) as { tickets?: TicketsByDate };

	return data.tickets || {};
}
