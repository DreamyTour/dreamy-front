import {
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	Loader2,
	MapPinned,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Lang } from "@/lib/i18n";
import type { TicketsByDate } from "@/lib/incaTrailAvailability";
import { INCA_TRAIL_PLACE_ID } from "@/lib/incaTrailAvailability";

type LoadState = "idle" | "loading" | "error";

interface CalendarSelection {
	date: string;
	availability: number;
	road: string;
}

interface IncaTrailAvailabilityCalendarProps {
	lang: Lang;
	year?: number;
	initialMonth?: number;
	initialRoad?: string;
	initialTickets?: TicketsByDate;
	selectedDate?: string;
	onDateSelect?: (selection: CalendarSelection) => void;
	onViewChange?: (view: { road: string; month: number }) => void;
	compact?: boolean;
}

const EMPTY_TICKETS: TicketsByDate = {};

const monthNamesByLang: Record<Lang, string[]> = {
	es: [
		"Enero",
		"Febrero",
		"Marzo",
		"Abril",
		"Mayo",
		"Junio",
		"Julio",
		"Agosto",
		"Septiembre",
		"Octubre",
		"Noviembre",
		"Diciembre",
	],
	en: [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	],
	pt: [
		"Janeiro",
		"Fevereiro",
		"Marco",
		"Abril",
		"Maio",
		"Junho",
		"Julho",
		"Agosto",
		"Setembro",
		"Outubro",
		"Novembro",
		"Dezembro",
	],
};

const weekdayLabels = [
	{ key: "monday", label: "L" },
	{ key: "tuesday", label: "M" },
	{ key: "wednesday", label: "M" },
	{ key: "thursday", label: "J" },
	{ key: "friday", label: "V" },
	{ key: "saturday", label: "S" },
	{ key: "sunday", label: "D" },
];

const leadingDayKeys = [
	"monday-empty",
	"tuesday-empty",
	"wednesday-empty",
	"thursday-empty",
	"friday-empty",
	"saturday-empty",
	"sunday-empty",
];

const copyByLang = {
	es: {
		route: "Ruta",
		month: "Mes",
		previous: "Mes anterior",
		next: "Mes siguiente",
		loading: "Cargando...",
		error: "No se pudo cargar la disponibilidad.",
		selected: "Fecha elegida:",
		availableLabel: "cupos disponibles",
		unavailableLabel: "sin disponibilidad",
		moreThanTen: "+10 cupos",
		oneToTen: "1-10 cupos",
		noSpots: "Sin cupos",
	},
	en: {
		route: "Route",
		month: "Month",
		previous: "Previous month",
		next: "Next month",
		loading: "Loading...",
		error: "Availability could not be loaded.",
		selected: "Selected date:",
		availableLabel: "spaces available",
		unavailableLabel: "no availability",
		moreThanTen: "+10 spaces",
		oneToTen: "1-10 spaces",
		noSpots: "No spaces",
	},
	pt: {
		route: "Rota",
		month: "Mes",
		previous: "Mes anterior",
		next: "Proximo mes",
		loading: "Carregando...",
		error: "Nao foi possivel carregar a disponibilidade.",
		selected: "Data escolhida:",
		availableLabel: "vagas disponiveis",
		unavailableLabel: "sem disponibilidade",
		moreThanTen: "+10 vagas",
		oneToTen: "1-10 vagas",
		noSpots: "Sem vagas",
	},
} as const;

function formatDateKey(year: number, month: number, day: number) {
	return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getTone(availability: number) {
	if (availability > 10) return "available";
	if (availability > 0) return "limited";
	return "unavailable";
}

export default function IncaTrailAvailabilityCalendar({
	lang,
	year = new Date().getFullYear(),
	initialMonth,
	initialRoad = "1",
	initialTickets = EMPTY_TICKETS,
	selectedDate = "",
	onDateSelect,
	onViewChange,
	compact = false,
}: IncaTrailAvailabilityCalendarProps) {
	const now = useMemo(() => new Date(), []);
	const minMonth = year === now.getFullYear() ? now.getMonth() + 1 : 1;
	const startingMonth = initialMonth ?? minMonth;
	const [road, setRoad] = useState<string>(initialRoad);
	const [currentMonth, setCurrentMonth] = useState<number>(startingMonth);
	const [tickets, setTickets] = useState<TicketsByDate>(initialTickets);
	const [loadState, setLoadState] = useState<LoadState>("idle");
	const monthNames = monthNamesByLang[lang] ?? monthNamesByLang.es;
	const copy = copyByLang[lang] ?? copyByLang.es;

	useEffect(() => {
		onViewChange?.({ road, month: currentMonth });
	}, [road, currentMonth, onViewChange]);

	useEffect(() => {
		const isInitialPayload =
			road === initialRoad && currentMonth === startingMonth;

		if (isInitialPayload && Object.keys(initialTickets).length > 0) {
			setTickets(initialTickets);
			setLoadState("idle");
			return;
		}

		const controller = new AbortController();

		async function loadAvailability() {
			setLoadState("loading");
			setTickets({});

			const url = `/api/calendar-tickets?place=${INCA_TRAIL_PLACE_ID}&road=${road}&year=${year}&month=${currentMonth}`;

			try {
				const response = await fetch(url, { signal: controller.signal });
				if (!response.ok) throw new Error("Error fetching availability");

				const data = (await response.json()) as { tickets?: TicketsByDate };
				setTickets(data.tickets || {});
				setLoadState("idle");
			} catch (error) {
				if (controller.signal.aborted) return;
				console.error(error);
				setLoadState("error");
			}
		}

		loadAvailability();

		return () => controller.abort();
	}, [road, currentMonth, year, initialRoad, startingMonth, initialTickets]);

	const firstDay = new Date(year, currentMonth - 1, 1);
	const daysInMonth = new Date(year, currentMonth, 0).getDate();
	const startDay = (firstDay.getDay() + 6) % 7;
	const emptyCells = leadingDayKeys.slice(0, startDay);
	const calendarDays = Array.from({ length: daysInMonth }, (_, index) => {
		const day = index + 1;
		const dateKey = formatDateKey(year, currentMonth, day);
		const availability = tickets[dateKey] ?? 0;
		const tone = getTone(availability);

		return {
			day,
			dateKey,
			availability,
			tone,
			isSelectable: availability > 0,
		};
	});

	return (
		<div className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
			<div className="grid grid-cols-1 gap-3 border-b border-gray-100 bg-[#faf8f5] p-4 sm:grid-cols-2">
				<label className="block">
					<span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
						<MapPinned size={14} aria-hidden="true" />
						{copy.route}
					</span>
					<select
						name="machu-picchu-route"
						value={road}
						onChange={(event) => setRoad(event.target.value)}
						className="h-10 w-full rounded-sm border border-[#db5b24] bg-white px-3 text-sm text-gray-800 outline-none"
					>
						<option value="1">Route 1</option>
						<option value="5">Route 5</option>
					</select>
				</label>

				<label className="block">
					<span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
						<CalendarDays size={14} aria-hidden="true" />
						{copy.month}
					</span>
					<select
						name="travel-month"
						value={currentMonth}
						onChange={(event) => setCurrentMonth(Number(event.target.value))}
						className="h-10 w-full rounded-sm border border-[#db5b24] bg-white px-3 text-sm text-gray-800 outline-none"
					>
						{monthNames.slice(minMonth - 1).map((monthName, index) => (
							<option key={monthName} value={minMonth + index}>
								{monthName}
							</option>
						))}
					</select>
				</label>
			</div>

			<div className="flex items-center justify-between border-b border-gray-100 px-3 py-3">
				<button
					type="button"
					onClick={() =>
						setCurrentMonth((month) => Math.max(minMonth, month - 1))
					}
					disabled={currentMonth <= minMonth}
					aria-label={copy.previous}
					className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-35"
				>
					<ChevronLeft size={20} aria-hidden="true" />
				</button>

				<div className="text-center">
					<p className="text-base font-bold text-gray-900">
						{monthNames[currentMonth - 1]} {year}
					</p>
				</div>

				<button
					type="button"
					onClick={() => setCurrentMonth((month) => Math.min(12, month + 1))}
					disabled={currentMonth === 12}
					aria-label={copy.next}
					className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-35"
				>
					<ChevronRight size={20} aria-hidden="true" />
				</button>
			</div>

			<div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50 text-center text-[0.7rem] font-bold uppercase tracking-wide text-[#8f3513]">
				{weekdayLabels.map(({ key, label }) => (
					<div key={key} className="py-2">
						{label}
					</div>
				))}
			</div>

			<div className="relative grid grid-cols-7 bg-white">
				{loadState === "loading" && (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-white/75 backdrop-blur-[1px]">
						<div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm">
							<Loader2
								size={16}
								className="animate-spin text-[#db5b24]"
								aria-hidden="true"
							/>
							{copy.loading}
						</div>
					</div>
				)}

				{emptyCells.map((key) => (
					<div
						key={key}
						className={`${compact ? "h-14" : "h-16"} border-b border-r border-gray-100 bg-gray-50/80`}
					/>
				))}

				{loadState === "error" ? (
					<div className="col-span-7 px-5 py-8 text-center text-sm font-medium text-red-600">
						{copy.error}
					</div>
				) : (
					calendarDays.map(
						({ day, dateKey, availability, tone, isSelectable }) => {
							const isSelected = selectedDate === dateKey;
							const toneStyles: Record<string, string> = {
								available:
									"bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
								limited: "bg-red-50 text-red-700 hover:bg-red-100",
								unavailable: "bg-gray-50 text-gray-400 cursor-not-allowed",
							};
							const toneLabel: Record<string, string> = {
								available: "text-emerald-700",
								limited: "text-red-600",
								unavailable: "text-gray-400",
							};

							return (
								<button
									key={dateKey}
									type="button"
									disabled={!isSelectable}
									onClick={() =>
										onDateSelect?.({ date: dateKey, availability, road })
									}
									className={`relative flex ${compact ? "h-14" : "h-16"} flex-col items-center justify-center gap-px border-b border-r border-gray-100 transition ${toneStyles[tone]} ${
										isSelected ? "z-[1] ring-2 ring-inset ring-[#db5b24]" : ""
									}`}
									aria-label={`${dateKey}, ${
										isSelectable
											? `${availability} ${copy.availableLabel}`
											: copy.unavailableLabel
									}`}
								>
									<span
										className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold leading-none ${
											tone === "available"
												? "bg-emerald-200 text-emerald-900"
												: tone === "limited"
													? "bg-red-200 text-red-900"
													: "bg-gray-200 text-gray-500"
										}`}
									>
										{day}
									</span>
									<span
										className={`text-[10px] font-bold leading-none ${toneLabel[tone]} ${
											!isSelectable ? "line-through" : ""
										}`}
									>
										{availability}
									</span>
								</button>
							);
						},
					)
				)}
			</div>

			{selectedDate && (
				<div
					className="mx-4 mt-3 rounded-sm border border-[#db5b24]/20 bg-[#db5b24]/5 px-4 py-3 text-sm text-gray-700"
					aria-live="polite"
				>
					<span className="font-semibold text-gray-900">{copy.selected}</span>{" "}
					{selectedDate}
				</div>
			)}

			<div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-[11px] text-gray-500">
				<span className="flex items-center gap-1.5">
					<span className="inline-block h-3 w-3 rounded-sm border border-emerald-200 bg-emerald-50" />
					{copy.moreThanTen}
				</span>
				<span className="flex items-center gap-1.5">
					<span className="inline-block h-3 w-3 rounded-sm border border-red-200 bg-red-50" />
					{copy.oneToTen}
				</span>
				<span className="flex items-center gap-1.5">
					<span className="inline-block h-3 w-3 rounded-sm border border-gray-200 bg-gray-50" />
					{copy.noSpots}
				</span>
			</div>
		</div>
	);
}
