import {
	CalendarCheck,
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	Loader2,
	MapPinned,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Lang } from "@/lib/i18n";
import type { TicketsByDate } from "@/lib/incaTrailAvailability";
import {
	INCA_TRAIL_PLACE_ID,
	INCA_TRAIL_ROUTES,
} from "@/lib/incaTrailAvailability";

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
	allowedRoads?: readonly string[];
	selectionDurationDays?: number;
	initialTickets?: TicketsByDate;
	selectedDate?: string;
	onDateSelect?: (selection: CalendarSelection) => void;
	onViewChange?: (view: { road: string; month: number }) => void;
	compact?: boolean;
}

const EMPTY_TICKETS: TicketsByDate = {};
const ticketsCache = new Map<string, TicketsByDate>();

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
		start: "Inicio",
		end: "Fin",
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
		start: "Start",
		end: "End",
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
		start: "Inicio",
		end: "Fim",
		availableLabel: "vagas disponiveis",
		unavailableLabel: "sem disponibilidade",
		moreThanTen: "+10 vagas",
		oneToTen: "1-10 vagas",
		noSpots: "Sem vagas",
	},
} as const;

type DateParts = {
	year: string;
	month: string;
	day: string;
};

function formatDateKey(year: number, month: number, day: number) {
	return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getTone(availability: number) {
	if (availability > 10) return "available";
	if (availability > 0) return "limited";
	return "unavailable";
}

function getCacheKey(year: number, month: number, road: string) {
	return `${year}-${month}-${road}`;
}

function addDaysToDateKey(dateKey: string, daysToAdd: number) {
	const [year, month, day] = dateKey.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day + daysToAdd));

	return formatDateKey(
		date.getUTCFullYear(),
		date.getUTCMonth() + 1,
		date.getUTCDate(),
	);
}

function formatDisplayDate(dateKey: string) {
	const [year, month, day] = dateKey.split("-");
	return `${day}/${month}/${year}`;
}

function getDateParts(dateKey: string): DateParts {
	const [year, month, day] = dateKey.split("-");
	return { year, month, day };
}

function formatSelectedDateRange(dateKey: string, durationDays: number) {
	const normalizedDuration = Math.max(1, durationDays);
	const startDate = formatDisplayDate(dateKey);

	if (normalizedDuration === 1) return startDate;

	const endDate = formatDisplayDate(
		addDaysToDateKey(dateKey, normalizedDuration - 1),
	);

	return `${startDate} a ${endDate}`;
}

async function fetchTickets({
	year,
	month,
	road,
	signal,
}: {
	year: number;
	month: number;
	road: string;
	signal?: AbortSignal;
}) {
	const url = `/api/calendar-tickets?place=${INCA_TRAIL_PLACE_ID}&road=${road}&year=${year}&month=${month}`;
	const response = await fetch(url, { signal });

	if (!response.ok) throw new Error("Error fetching availability");

	const data = (await response.json()) as { tickets?: TicketsByDate };
	return data.tickets || {};
}

export default function IncaTrailAvailabilityCalendar({
	lang,
	year = new Date().getFullYear(),
	initialMonth,
	initialRoad = "1",
	allowedRoads,
	selectionDurationDays = 1,
	initialTickets = EMPTY_TICKETS,
	selectedDate = "",
	onDateSelect,
	onViewChange,
	compact = false,
}: IncaTrailAvailabilityCalendarProps) {
	const now = useMemo(() => new Date(), []);
	const minMonth = year === now.getFullYear() ? now.getMonth() + 1 : 1;
	const startingMonth = initialMonth ?? minMonth;
	const roadOptions = useMemo(() => {
		const options =
			allowedRoads && allowedRoads.length > 0
				? allowedRoads
				: INCA_TRAIL_ROUTES;

		return options.filter((option, index) => options.indexOf(option) === index);
	}, [allowedRoads]);
	const isRoadLocked = roadOptions.length === 1;
	const [road, setRoad] = useState<string>(initialRoad);
	const [currentMonth, setCurrentMonth] = useState<number>(startingMonth);
	const [tickets, setTickets] = useState<TicketsByDate>(initialTickets);
	const [loadState, setLoadState] = useState<LoadState>("idle");
	const monthNames = monthNamesByLang[lang] ?? monthNamesByLang.es;
	const copy = copyByLang[lang] ?? copyByLang.es;
	const selectedDateRange = selectedDate
		? formatSelectedDateRange(selectedDate, selectionDurationDays)
		: "";
	const selectedEndDate = selectedDate
		? addDaysToDateKey(selectedDate, Math.max(1, selectionDurationDays) - 1)
		: "";
	const selectedStartParts = selectedDate ? getDateParts(selectedDate) : null;
	const selectedEndParts = selectedEndDate
		? getDateParts(selectedEndDate)
		: null;
	const selectedDateKeys = useMemo(() => {
		if (!selectedDate) return new Set<string>();

		return new Set(
			Array.from(
				{ length: Math.max(1, selectionDurationDays) },
				(_, index) => addDaysToDateKey(selectedDate, index),
			),
		);
	}, [selectedDate, selectionDurationDays]);

	useEffect(() => {
		if (roadOptions.includes(road)) return;

		setRoad(roadOptions[0] ?? "1");
	}, [road, roadOptions]);

	useEffect(() => {
		if (Object.keys(initialTickets).length === 0) return;

		ticketsCache.set(
			getCacheKey(year, startingMonth, initialRoad),
			initialTickets,
		);
	}, [year, startingMonth, initialRoad, initialTickets]);

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

		const cacheKey = getCacheKey(year, currentMonth, road);
		const cachedTickets = ticketsCache.get(cacheKey);

		if (cachedTickets) {
			setTickets(cachedTickets);
			setLoadState("idle");
			return;
		}

		const controller = new AbortController();

		async function loadAvailability() {
			setLoadState("loading");

			try {
				const nextTickets = await fetchTickets({
					year,
					month: currentMonth,
					road,
					signal: controller.signal,
				});
				ticketsCache.set(cacheKey, nextTickets);
				setTickets(nextTickets);
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

	useEffect(() => {
		const nextMonth = currentMonth + 1;

		if (nextMonth > 12) return;

		const cacheKey = getCacheKey(year, nextMonth, road);

		if (ticketsCache.has(cacheKey)) return;

		const controller = new AbortController();

		fetchTickets({
			year,
			month: nextMonth,
			road,
			signal: controller.signal,
		})
			.then((nextTickets) => ticketsCache.set(cacheKey, nextTickets))
			.catch(() => {});

		return () => controller.abort();
	}, [road, currentMonth, year]);

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
			<div
				className={`grid grid-cols-1 gap-3 border-b border-gray-100 bg-[#faf8f5] p-4 ${
					isRoadLocked ? "" : "sm:grid-cols-2"
				}`}
			>
				{!isRoadLocked && (
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
							{roadOptions.map((roadOption) => (
								<option key={roadOption} value={roadOption}>
									Route {roadOption}
								</option>
							))}
						</select>
					</label>
				)}

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
							const isSelectedRange = selectedDateKeys.has(dateKey);
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
										isSelectedRange
											? "!border-[#db5b24]/30 !bg-[#fff4ed] !text-[#8f3513] shadow-[inset_0_0_0_1px_rgba(219,91,36,0.18)]"
											: ""
									} ${
										isSelected ? "z-[1] ring-2 ring-inset ring-[#db5b24]" : ""
									}`}
									aria-pressed={isSelectedRange}
									aria-label={`${dateKey}, ${
										isSelectable
											? `${availability} ${copy.availableLabel}`
											: copy.unavailableLabel
									}`}
								>
									<span
										className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold leading-none ${
											isSelectedRange
												? "bg-[#db5b24] text-white"
												: tone === "available"
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
										} ${
											isSelectedRange ? "!text-[#8f3513]" : ""
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
					className="mx-4 mt-3 overflow-hidden rounded-md border border-[#db5b24]/25 bg-[#fffaf6] text-sm text-gray-700 shadow-sm"
					aria-live="polite"
				>
					<div className="flex gap-3 border-l-4 border-[#db5b24] px-4 py-3">
						<div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#db5b24] text-white shadow-sm">
							<CalendarCheck size={18} aria-hidden="true" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="text-[11px] font-bold uppercase tracking-wide text-[#8f3513]">
								{copy.selected}
							</p>
							<p className="mt-0.5 text-base font-extrabold leading-tight text-gray-950">
								{selectedDateRange}
							</p>
							{selectedStartParts && selectedEndParts && (
								<div className="mt-3 grid grid-cols-2 gap-2">
									<div className="rounded-sm border border-[#db5b24]/20 bg-white px-3 py-2">
										<span className="block text-[10px] font-bold uppercase tracking-wide text-gray-500">
											{copy.start}
										</span>
										<span className="mt-1 block text-sm font-bold text-gray-900">
											{selectedStartParts.day}/{selectedStartParts.month}/
											{selectedStartParts.year}
										</span>
									</div>
									<div className="rounded-sm border border-[#db5b24]/20 bg-white px-3 py-2">
										<span className="block text-[10px] font-bold uppercase tracking-wide text-gray-500">
											{copy.end}
										</span>
										<span className="mt-1 block text-sm font-bold text-gray-900">
											{selectedEndParts.day}/{selectedEndParts.month}/
											{selectedEndParts.year}
										</span>
									</div>
								</div>
							)}
						</div>
					</div>
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
