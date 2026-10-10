import {
	CalendarCheck,
	CalendarDays,
	Check,
	ChevronLeft,
	ChevronRight,
	Loader2,
	MapPinned,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fetchCalendarAvailability } from "@/lib/calendarAvailability";
import type { Lang } from "@/lib/i18n";
import {
	INCA_TRAIL_PLACE_ID,
	INCA_TRAIL_ROUTES,
	shiftDateKey,
	type TicketsByDate,
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
	permitStartOffsetDays?: number;
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
		"Março",
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
		inactiveMonth: "mes no habilitado",
		spots: "cupos",
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
		moreThanTen: "Disponible (+50 cupos)",
		oneToTen: "Por agotarse (1–50 cupos)",
		noSpots: "Sin disponibilidad (0)",
		book: "Book",
	},
	en: {
		inactiveMonth: "month unavailable",
		spots: "spaces",
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
		moreThanTen: "Available (50+ spaces)",
		oneToTen: "Selling out (1–50 spaces)",
		noSpots: "No availability (0)",
		book: "Book",
	},
	pt: {
		inactiveMonth: "mês não habilitado",
		spots: "vagas",
		route: "Rota",
		month: "Mês",
		previous: "Mês anterior",
		next: "Próximo mês",
		loading: "Carregando...",
		error: "Não foi possível carregar a disponibilidade.",
		selected: "Data escolhida:",
		start: "Início",
		end: "Fim",
		availableLabel: "vagas disponíveis",
		unavailableLabel: "sem disponibilidade",
		moreThanTen: "Disponível (+50 vagas)",
		oneToTen: "Esgotando (1–50 vagas)",
		noSpots: "Sem disponibilidade (0)",
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
		shiftDateKey(dateKey, normalizedDuration - 1),
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
	return (
		await fetchCalendarAvailability({
			place: INCA_TRAIL_PLACE_ID,
			road,
			year,
			month,
			signal,
		})
	).dates;
}

export default function IncaTrailAvailabilityCalendar({
	lang,
	year = new Date().getFullYear(),
	initialMonth,
	initialRoad = "1",
	allowedRoads,
	roadLabels = {},
	selectionDurationDays = 1,
	permitStartOffsetDays = 0,
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
	const selectedStartDate = selectedDate
		? shiftDateKey(selectedDate, -Math.max(0, permitStartOffsetDays))
		: "";
	const selectedDateRange = selectedStartDate
		? formatSelectedDateRange(selectedStartDate, selectionDurationDays)
		: "";
	const selectedEndDate = selectedStartDate
		? shiftDateKey(selectedStartDate, Math.max(1, selectionDurationDays) - 1)
		: "";
	const selectedStartParts = selectedStartDate
		? getDateParts(selectedStartDate)
		: null;
	const selectedEndParts = selectedEndDate
		? getDateParts(selectedEndDate)
		: null;
	const selectedDateKeys = useMemo(() => {
		if (!selectedStartDate) return new Set<string>();

		return new Set(
			Array.from({ length: Math.max(1, selectionDurationDays) }, (_, index) =>
				shiftDateKey(selectedStartDate, index),
			),
		);
	}, [selectedStartDate, selectionDurationDays]);

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
		<div className="@container w-full overflow-hidden rounded-xl border border-border/70 bg-white font-[inherit]">
			<div className="space-y-4 border-b border-border/60 bg-white p-4">
				{!isRoadLocked && (
					<label className="block">
						<span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							<MapPinned size={14} aria-hidden="true" />
							{copy.route}
						</span>
						<select
							name="machu-picchu-route"
							value={road}
							onChange={(event) => setRoad(event.target.value)}
							className="h-11 w-full cursor-pointer rounded-xl border border-border bg-white px-3 text-sm font-semibold text-foreground outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
						>
							{roadOptions.map((roadOption) => (
								<option key={roadOption} value={roadOption}>
									{roadLabels[roadOption] ?? `${copy.route} ${roadOption}`}
								</option>
							))}
						</select>
					</label>
				)}

				<fieldset>
					<legend className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						<CalendarDays size={14} aria-hidden="true" />
						{copy.month}
					</legend>
					<div
						data-calendar-months
						className="grid grid-cols-3 gap-1 rounded-xl bg-muted/50 p-1 @min-[480px]:grid-cols-6"
					>
						{monthNames.map((monthName, index) => {
							const month = index + 1;
							const isInactive = year < now.getFullYear() || month < minMonth;
							const isActive = currentMonth === month;
							return (
								<button
									key={monthName}
									type="button"
									data-calendar-month={month}
									disabled={isInactive}
									aria-pressed={isActive}
									aria-label={`${monthName} ${year}${isInactive ? `: ${copy.inactiveMonth}` : ""}`}
									onClick={() => setCurrentMonth(month)}
									className={`min-h-11 min-w-0 rounded-lg px-1.5 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary ${isInactive ? "cursor-not-allowed text-muted-foreground/40" : isActive ? "bg-secondary font-semibold text-secondary-foreground shadow-sm" : "bg-white text-foreground hover:bg-secondary/10 hover:text-secondary"}`}
								>
									{monthName}
								</button>
							);
						})}
					</div>
				</fieldset>
			</div>

			<div className="flex items-center justify-between border-b border-border/60 bg-white px-4 py-4">
				<button
					type="button"
					onClick={() =>
						setCurrentMonth((month) => Math.max(minMonth, month - 1))
					}
					disabled={currentMonth <= minMonth}
					aria-label={copy.previous}
					className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-white text-primary transition hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-35"
				>
					<ChevronLeft size={20} aria-hidden="true" />
				</button>

				<div className="text-center">
					<p className="text-lg font-extrabold text-foreground">
						{monthNames[currentMonth - 1]} {year}
					</p>
				</div>

				<button
					type="button"
					onClick={() => setCurrentMonth((month) => Math.min(12, month + 1))}
					disabled={currentMonth === 12}
					aria-label={copy.next}
					className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-white text-primary transition hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-35"
				>
					<ChevronRight size={20} aria-hidden="true" />
				</button>
			</div>

			<div className="grid grid-cols-7 border-b border-border/60 bg-muted/40 text-center text-[0.7rem] font-bold uppercase tracking-wide text-muted-foreground">
				{weekdayLabels.map(({ key, label }) => (
					<div key={key} className="py-2">
						{label}
					</div>
				))}
			</div>

			<div className="relative grid grid-cols-7 gap-1.5 overflow-hidden bg-white p-1.5 @min-[480px]:gap-2 @min-[480px]:p-2">
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
						className={`${compact ? "h-[58px]" : "h-[68px] @min-[480px]:h-[84px]"} rounded-lg bg-muted/25`}
					/>
				))}

				{loadState === "error" ? (
					<div className="col-span-7 px-5 py-8 text-center text-sm font-medium text-secondary">
						{copy.error}
					</div>
				) : (
					calendarDays.map(
						({ day, dateKey, availability, tone, isSelectable }) => {
							const isSelected = selectedDate === dateKey;
							const isSelectedRange = selectedDateKeys.has(dateKey);
							const toneStyles: Record<string, string> = {
								available: "border-primary/20 bg-primary/5 text-primary",
								limited: "border-orange-200 bg-orange-50 text-orange-800",
								unavailable:
									"border-red-200 bg-red-50 text-red-700 cursor-not-allowed",
							};
							const selectedToneStyles: Record<string, string> = {
								available: "border-primary bg-primary text-white",
								limited: "border-orange-700 bg-orange-700 text-white",
								unavailable:
									"border-red-700 bg-red-700 text-white cursor-not-allowed",
							};

							return (
								<button
									key={dateKey}
									data-calendar-date={dateKey}
									type="button"
									disabled={!isSelectable}
									onClick={() =>
										onDateSelect?.({ date: dateKey, availability, road })
									}
									className={`relative flex ${compact ? "h-[58px]" : "h-[68px] @min-[480px]:h-[84px]"} flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border p-1 transition-colors focus-visible:z-[2] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary ${isSelectedRange ? selectedToneStyles[tone] : `${toneStyles[tone]} enabled:hover:brightness-95 enabled:hover:cursor-pointer motion-safe:[&:enabled:hover_.day-number]:-translate-y-1 motion-safe:[&:enabled:hover_.cupos]:-translate-y-1`} ${isSelected ? "z-[1] ring-2 ring-foreground ring-offset-2" : ""}`}
									aria-pressed={isSelectedRange}
									aria-label={`${dateKey}, ${
										isSelectable
											? `${availability} ${copy.availableLabel}`
											: copy.unavailableLabel
									}`}
								>
									{isSelected && (
										<Check
											size={14}
											strokeWidth={3}
											aria-hidden="true"
											className="absolute right-1 top-1"
										/>
									)}
									<span className="day-number text-sm font-bold motion-safe:transition-transform motion-safe:duration-200 @min-[480px]:text-base">
										{String(day).padStart(2, "0")}
									</span>
									<span
										className={`cupos rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-tight motion-safe:transition-transform motion-safe:duration-200 @min-[480px]:text-xs ${isSelectedRange ? "bg-white/20" : "bg-white/80"}`}
									>
										{availability}
										{isSelectable && (
											<span className="ml-1 hidden @min-[480px]:inline">
												{copy.spots}
											</span>
										)}
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
							: "mx-4 my-4 overflow-hidden rounded-xl border border-primary/15 bg-primary/5 text-sm text-foreground"
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
						<div className="flex gap-3 border-l-4 border-primary px-4 py-3">
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

			<div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 bg-white px-4 py-4 text-xs font-medium text-muted-foreground">
				<span className="flex items-center gap-1.5">
					<span className="inline-block h-3 w-3 rounded-full bg-primary" />
					{copy.moreThanTen}
				</span>
				<span className="flex items-center gap-1.5">
					<span className="inline-block h-3 w-3 rounded-full bg-orange-400" />
					{copy.oneToTen}
				</span>
				<span className="flex items-center gap-1.5">
					<span className="inline-block h-3 w-3 rounded-full bg-red-600" />
					{copy.noSpots}
				</span>
			</div>
		</div>
	);
}
