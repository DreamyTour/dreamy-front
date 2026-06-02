export type TicketsByDate = Record<string, number | undefined>;

export const INCA_TRAIL_PLACE_ID = 2;
export const INCA_TRAIL_ROUTES = ["1", "5"] as const;

interface FetchTicketsParams {
	place?: number;
	road: string;
	year: number;
	month: number;
}

export async function fetchIncaTrailTickets({
	place = INCA_TRAIL_PLACE_ID,
	road,
	year,
	month,
}: FetchTicketsParams): Promise<TicketsByDate> {
	const url = new URL("https://calendar.dreamy.tours/v1/tickets");
	url.searchParams.set("place", String(place));
	url.searchParams.set("road", road);
	url.searchParams.set("year", String(year));
	url.searchParams.set("month", String(month));

	const response = await fetch(url.toString());

	if (!response.ok) {
		throw new Error(`Calendar request failed (${response.status})`);
	}

	const data = (await response.json()) as { tickets?: TicketsByDate };

	return data.tickets || {};
}
