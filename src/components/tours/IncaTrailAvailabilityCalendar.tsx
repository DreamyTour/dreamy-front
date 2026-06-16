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
	roadLabels?: Record<string, string>;
	selectionDurationDays?: number;
	initialTickets?: TicketsByDate;
	selectedDate?: string;
	onDateSelect?: (selection: CalendarSelection) => void;
	onViewChange?: (view: { road: string; month: number }) => void;
	compact?: boolean;
	showSelectedSummary?: boolean;
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
		moreThanTen: "+50 cupos",
		oneToTen: "1-50 cupos",
		noSpots: "Sin cupos",
		book: "Book",
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
		moreThanTen: "+50 spaces",
		oneToTen: "1-50 spaces",
		noSpots: "No spaces",
		book: "Book",
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
		moreThanTen: "+50 vagas",
		oneToTen: "1-50 vagas",
		noSpots: "Sem vagas",
		book: "Book",
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
	if (availability > 50) return "available";
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
	roadLabels = {},
	selectionDurationDays = 1,
	initialTickets = EMPTY_TICKETS,
	selectedDate = "",
	onDateSelect,
	onViewChange,
	compact = false,
	showSelectedSummary = true,
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
			Array.from({ length: Math.max(1, selectionDurationDays) }, (_, index) =>
				addDaysToDateKey(selectedDate, index),
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
		<div className="w-full overflow-hidden rounded-lg border border-[#e7d7c8] bg-neutral-50 font-[inherit] shadow-[0_18px_60px_-42px_rgba(63,40,18,0.7)]">
			<div
				className={`grid grid-cols-1 gap-3 border-b border-[#355548]/30 bg-[#244237] p-4 ${
					isRoadLocked ? "" : "sm:grid-cols-2"
				}`}
			>
				{!isRoadLocked && (
					<label className="block">
						<span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#f0dbc8]">
							<MapPinned size={14} aria-hidden="true" />
							{copy.route}
						</span>
						<select
							name="machu-picchu-route"
							value={road}
							onChange={(event) => setRoad(event.target.value)}
							className="h-11 w-full rounded-sm border border-white/20 bg-white px-3 text-sm font-semibold text-[#1f2d29] shadow-sm outline-none transition focus-visible:border-secondary focus-visible:ring-2 focus-visible:ring-secondary/35"
						>
							{roadOptions.map((roadOption) => (
								<option key={roadOption} value={roadOption}>
									{roadLabels[roadOption] ?? `${copy.route} ${roadOption}`}
								</option>
							))}
						</select>
					</label>
				)}

				<label className="block">
					<span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#f0dbc8]">
						<CalendarDays size={14} aria-hidden="true" />
						{copy.month}
					</span>
					<select
						name="travel-month"
						value={currentMonth}
						onChange={(event) => setCurrentMonth(Number(event.target.value))}
						className="h-11 w-full rounded-sm border border-white/20 bg-white px-3 text-sm font-semibold text-[#1f2d29] shadow-sm outline-none transition focus-visible:border-secondary focus-visible:ring-2 focus-visible:ring-secondary/35"
					>
						{monthNames.slice(minMonth - 1).map((monthName, index) => (
							<option key={monthName} value={minMonth + index}>
								{monthName}
							</option>
						))}
					</select>
				</label>
			</div>

			<div className="flex items-center justify-between border-b border-[#eadfd3] bg-neutral-50 px-3 py-3">
				<button
					type="button"
					onClick={() =>
						setCurrentMonth((month) => Math.max(minMonth, month - 1))
					}
					disabled={currentMonth <= minMonth}
					aria-label={copy.previous}
					className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e6d4c1] bg-white text-[#244237] shadow-sm transition hover:border-secondary/40 hover:text-secondary disabled:cursor-not-allowed disabled:opacity-35"
				>
					<ChevronLeft size={20} aria-hidden="true" />
				</button>

				<div className="text-center">
					<p className="text-base font-extrabold text-[#1f2d29]">
						{monthNames[currentMonth - 1]} {year}
					</p>
				</div>

				<button
					type="button"
					onClick={() => setCurrentMonth((month) => Math.min(12, month + 1))}
					disabled={currentMonth === 12}
					aria-label={copy.next}
					className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e6d4c1] bg-white text-[#244237] shadow-sm transition hover:border-secondary/40 hover:text-secondary disabled:cursor-not-allowed disabled:opacity-35"
				>
					<ChevronRight size={20} aria-hidden="true" />
				</button>
			</div>

			<div className="grid grid-cols-7 border-b border-[#eadfd3] bg-neutral-50 text-center text-[0.7rem] font-bold uppercase tracking-wide text-secondary">
				{weekdayLabels.map(({ key, label }) => (
					<div key={key} className="py-2">
						{label}
					</div>
				))}
			</div>

			<div className="relative grid grid-cols-7 gap-1.5 bg-white p-2 sm:gap-2">
				{loadState === "loading" && (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-white/75 backdrop-blur-[1px]">
						<div className="flex items-center gap-2 rounded-full border border-[#ead9c7] bg-white px-4 py-2 text-sm font-semibold text-[#244237] shadow-sm">
							<Loader2
								size={16}
								className="animate-spin text-secondary"
								aria-hidden="true"
							/>
							{copy.loading}
						</div>
					</div>
				)}

				{emptyCells.map((key) => (
					<div
						key={key}
						className={`${compact ? "h-[64px] sm:h-[72px]" : "h-[68px] sm:h-[82px]"} rounded-md bg-neutral-50`}
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
									"border-[#bfe6ce] bg-white text-[#0f5f35] hover:border-[#8fd8aa] hover:bg-[#f4fbf7]",
								limited:
									"border-amber-300 bg-white text-amber-700 hover:border-amber-400 hover:bg-amber-50",
								unavailable:
									"border-secondary/25 bg-white text-secondary cursor-not-allowed opacity-75",
							};
							const toneHeader: Record<string, string> = {
								available: "bg-[#8fd8aa] text-[#064324]",
								limited: "bg-amber-300 text-amber-900",
								unavailable: "bg-secondary/45 text-white",
							};
							const toneIcon: Record<string, string> = {
								available: "text-[#064324]",
								limited: "text-amber-800",
								unavailable: "text-secondary",
							};
							const toneText: Record<string, string> = {
								available: "text-[#0f5f35]",
								limited: "text-amber-700",
								unavailable: "text-secondary/65",
							};

							return (
								<button
									key={dateKey}
									type="button"
									disabled={!isSelectable}
									onClick={() =>
										onDateSelect?.({ date: dateKey, availability, road })
									}
									className={`relative flex ${compact ? "h-[64px] sm:h-[72px]" : "h-[68px] sm:h-[82px]"} flex-col overflow-hidden rounded-md border shadow-[0_8px_20px_-18px_rgba(31,45,41,0.62)] transition focus-visible:z-[2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#244237] ${toneStyles[tone]} ${
										isSelectedRange
											? "!border-secondary/55 !bg-white !text-secondary shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--secondary)_28%,transparent),0_14px_28px_-22px_color-mix(in_oklab,var(--secondary)_55%,transparent)]"
											: ""
									} ${
										isSelected ? "z-[1] ring-2 ring-inset ring-secondary" : ""
									}`}
									aria-pressed={isSelectedRange}
									aria-label={`${dateKey}, ${
										isSelectable
											? `${availability} ${copy.availableLabel}`
											: copy.unavailableLabel
									}`}
								>
									<span
										className={`flex h-6 w-full items-center justify-end px-2 text-sm font-extrabold leading-none ${isSelectedRange ? "bg-secondary text-secondary-foreground" : toneHeader[tone]}`}
									>
										{String(day).padStart(2, "0")}
									</span>
									<span className="flex min-h-0 flex-1 flex-col items-center justify-center gap-0.5 px-1.5 py-1.5">
										<span
											className={`inline-flex max-w-full items-center text-sm font-black leading-none tracking-normal [text-box:trim-both_cap_alphabetic] sm:text-xl ${
												isSelectedRange ? "text-secondary" : toneIcon[tone]
											}`}
										>
											<span>{availability}</span>
										</span>
										<span
											className={`text-[10px] font-semibold leading-none ${isSelectedRange ? "text-secondary" : toneText[tone]}`}
										>
											{copy.book}
										</span>
									</span>
								</button>
							);
						},
					)
				)}
			</div>

			{showSelectedSummary && selectedDate && (
				<div
					className={
						compact
							? "mx-4 mt-3 pb-4 text-sm text-gray-700"
							: "mx-4 mt-3 overflow-hidden rounded-md border border-secondary/25 bg-neutral-50 text-sm text-gray-700 shadow-[0_14px_40px_-30px_color-mix(in_oklab,var(--secondary)_34%,transparent)]"
					}
					aria-live="polite"
				>
					{compact ? (
						<p className="text-sm leading-tight text-gray-950">
							<span className="font-semibold text-[#6f6258]">
								{copy.selected}{" "}
							</span>
							<span className="font-bold">{selectedDateRange}</span>
						</p>
					) : (
						<div className="flex gap-3 border-l-4 border-secondary px-4 py-3">
							<div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-sm">
								<CalendarCheck size={18} aria-hidden="true" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-[11px] font-bold uppercase tracking-wide text-secondary">
									{copy.selected}
								</p>
								<p className="mt-0.5 text-base font-extrabold leading-tight text-gray-950">
									{selectedDateRange}
								</p>
								{selectedStartParts && selectedEndParts && (
									<div className="mt-3 grid grid-cols-2 gap-2">
										<div className="rounded-sm border border-secondary/20 bg-white px-3 py-2">
											<span className="block text-[10px] font-bold uppercase tracking-wide text-gray-500">
												{copy.start}
											</span>
											<span className="mt-1 block text-sm font-bold text-gray-900">
												{selectedStartParts.day}/{selectedStartParts.month}/
												{selectedStartParts.year}
											</span>
										</div>
										<div className="rounded-sm border border-secondary/20 bg-white px-3 py-2">
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
					)}
				</div>
			)}

			<div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#f0e5d9] bg-neutral-50 px-4 py-3 text-base font-medium text-[#6f6258]">
				<span className="flex items-center gap-1.5">
					<span className="inline-block h-3 w-3 rounded-sm border border-[#bfe6ce] bg-[#edf8f1]" />
					{copy.moreThanTen}
				</span>
				<span className="flex items-center gap-1.5">
					<span className="inline-block h-3 w-3 rounded-sm border border-amber-300 bg-amber-100" />
					{copy.oneToTen}
				</span>
				<span className="flex items-center gap-1.5">
					<span className="inline-block h-3 w-3 rounded-sm border border-secondary/35 bg-secondary/20" />
					{copy.noSpots}
				</span>
			</div>
		</div>
	);
}
