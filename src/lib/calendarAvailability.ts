export type TicketsByDate = Record<string, number | undefined>;
export type TicketsByTime = Record<string, TicketsByDate>;

export const CALENDAR_PLACES = {
	1: {
		name: "Llaqta Machupicchu",
		routes: [
			{
				code: "1A",
				road: "7",
				circuit: "Circuito 1 - Panorámico",
				name: "Montaña Machupicchu",
			},
			{
				code: "1B",
				road: "8",
				circuit: "Circuito 1 - Panorámico",
				name: "Terraza superior",
			},
			{
				code: "1C",
				road: "9",
				circuit: "Circuito 1 - Panorámico",
				name: "Portada Intipunku",
			},
			{
				code: "1D",
				road: "10",
				circuit: "Circuito 1 - Panorámico",
				name: "Puente Inka",
			},
			{
				code: "2A",
				road: "11",
				circuit: "Circuito 2 - Clásico",
				name: "Clásico diseñada",
			},
			{
				code: "2B",
				road: "12",
				circuit: "Circuito 2 - Clásico",
				name: "Terraza inferior",
			},
			{
				code: "3A",
				road: "13",
				circuit: "Circuito 3 - Machupicchu Realeza",
				name: "Montaña Waynapicchu",
			},
			{
				code: "3B",
				road: "14",
				circuit: "Circuito 3 - Machupicchu Realeza",
				name: "Realeza diseñada",
			},
			{
				code: "3C",
				road: "15",
				circuit: "Circuito 3 - Machupicchu Realeza",
				name: "Gran Caverna",
			},
			{
				code: "3D",
				road: "16",
				circuit: "Circuito 3 - Machupicchu Realeza",
				name: "Huchuypicchu",
			},
		],
	},
	2: {
		name: "Red de Camino Inka - Circuito único",
		routes: [
			{ road: "1", name: "Piskakucho KM 82" },
			{ road: "2", name: "Qoriwayrachina" },
			{ road: "3", name: "Salkantay/Pawkarkancha" },
			{ road: "5", name: "Chachabamba" },
			{
				road: "6",
				name: "Paukarkancha - Wayllabamba - Qoriwayrachina (km 88)",
			},
		],
	},
} as const;
export const MACHU_PICCHU_PLACE_ID = 1;
export const MACHU_PICCHU_ROUTES = CALENDAR_PLACES[1].routes;

export interface FetchCalendarParams {
	place: number;
	road: string;
	year: number;
	month: number;
	signal?: AbortSignal;
}

export function isCalendarQueryValid({
	place,
	road,
	year,
	month,
}: FetchCalendarParams) {
	const destination = CALENDAR_PLACES[place as keyof typeof CALENDAR_PLACES];
	return (
		Boolean(destination?.routes.some((route) => route.road === road)) &&
		Number.isInteger(year) &&
		year >= 2000 &&
		year <= 2100 &&
		Number.isInteger(month) &&
		month >= 1 &&
		month <= 12
	);
}

export function normalizeTime(label: string): string {
	const match = label.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
	if (!match) throw new Error("Invalid calendar time");
	let hour = Number(match[1]);
	if (match[3]) hour = (hour % 12) + (match[3].toUpperCase() === "PM" ? 12 : 0);
	if (hour > 23 || Number(match[2]) > 59)
		throw new Error("Invalid calendar time");
	return `${String(hour).padStart(2, "0")}:${match[2]}`;
}

export function normalizeTickets(value: unknown): {
	dates: TicketsByDate;
	times: TicketsByTime;
} {
	if (!value || typeof value !== "object" || Array.isArray(value))
		throw new Error("Invalid calendar response");
	const dates: TicketsByDate = {};
	const times: TicketsByTime = {};
	const count = (value: unknown) => {
		if (typeof value !== "number" || !Number.isInteger(value) || value < 0)
			throw new Error("Invalid ticket count");
		return value;
	};
	for (const [key, entry] of Object.entries(value)) {
		if (/^\d{4}-\d{2}-\d{2}$/.test(key)) dates[key] = count(entry);
		else {
			const time = normalizeTime(key);
			if (!entry || typeof entry !== "object" || Array.isArray(entry))
				throw new Error("Invalid calendar response");
			times[time] = {};
			for (const [date, available] of Object.entries(entry)) {
				if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
					throw new Error("Invalid calendar date");
				times[time][date] = count(available);
				dates[date] = (dates[date] ?? 0) + count(available);
			}
		}
	}
	return { dates, times };
}

export async function fetchCalendarResponse(params: FetchCalendarParams) {
	if (!isCalendarQueryValid(params)) throw new Error("Invalid calendar query");
	const endpoint =
		typeof window === "undefined"
			? "https://calendar.dreamy.tours/v1/tickets"
			: "/api/calendar-tickets";
	const query = new URLSearchParams({
		place: String(params.place),
		road: params.road,
		year: String(params.year),
		month: String(params.month),
	});
	return fetch(`${endpoint}?${query}`, { signal: params.signal });
}

export async function fetchCalendarAvailability(params: FetchCalendarParams) {
	const response = await fetchCalendarResponse(params);
	if (!response.ok)
		throw new Error(`Calendar request failed (${response.status})`);
	const data = (await response.json()) as { tickets?: unknown };
	return normalizeTickets(data.tickets);
}
