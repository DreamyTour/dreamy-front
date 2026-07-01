import { Minus, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import IncaTrailAvailabilityCalendar from "@/components/tours/IncaTrailAvailabilityCalendar";
import type { Lang } from "@/lib/i18n";
import type { TicketsByDate } from "@/lib/incaTrailAvailability";
import { rewriteUrl } from "@/lib/utils";

interface AvailabilityBookingTour {
	road: string;
	durationDays: number;
	tourId: string | number;
	tourName: string;
	basePrice?: number;
	slug: string;
}

interface CalendarSelection {
	date: string;
	availability: number;
	road: string;
}

interface IncaTrailAvailabilityBookingProps {
	lang: Lang;
	year: number;
	initialMonth: number;
	initialRoad: string;
	roadLabels?: Record<string, string>;
	initialTickets?: TicketsByDate;
	tours: AvailabilityBookingTour[];
}

const copyByLang = {
	es: {
		stepPeople: "Cantidad de personas",
		bookNow: "Reservar ahora",
		selectDate: "Selecciona una fecha para continuar",
		selectedDate: "Fecha elegida",
		route: "Ruta",
		days: "dias",
		alertDate: "Por favor seleccione una fecha antes de reservar.",
		decreasePassengers: "Reducir cantidad de pasajeros",
		increasePassengers: "Aumentar cantidad de pasajeros",
	},
	en: {
		stepPeople: "Number of people",
		bookNow: "Book now",
		selectDate: "Select a date to continue",
		selectedDate: "Selected date",
		route: "Route",
		days: "days",
		alertDate: "Please select a date before booking.",
		decreasePassengers: "Decrease passenger count",
		increasePassengers: "Increase passenger count",
	},
	pt: {
		stepPeople: "Quantidade de pessoas",
		bookNow: "Reservar agora",
		selectDate: "Selecione uma data para continuar",
		selectedDate: "Data escolhida",
		route: "Rota",
		days: "dias",
		alertDate: "Selecione uma data antes de reservar.",
		decreasePassengers: "Reduzir quantidade de passageiros",
		increasePassengers: "Aumentar quantidade de passageiros",
	},
} as const;

function formatDateKey(year: number, month: number, day: number) {
	return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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

function formatSelectedDateRange(dateKey: string, durationDays: number) {
	const normalizedDuration = Math.max(1, durationDays);
	const startDate = formatDisplayDate(dateKey);

	if (normalizedDuration === 1) return startDate;

	return `${startDate} - ${formatDisplayDate(addDaysToDateKey(dateKey, normalizedDuration - 1))}`;
}

export default function IncaTrailAvailabilityBooking({
	lang,
	year,
	initialMonth,
	initialRoad,
	roadLabels = {},
	initialTickets,
	tours,
}: IncaTrailAvailabilityBookingProps) {
	const copy = copyByLang[lang] ?? copyByLang.en;
	const [date, setDate] = useState("");
	const [road, setRoad] = useState(initialRoad);
	const [availability, setAvailability] = useState<number | null>(null);
	const [passengers, setPassengers] = useState(1);

	const tourByRoad = useMemo(() => {
		return new Map(tours.map((tour) => [tour.road, tour]));
	}, [tours]);
	const allowedRoads = useMemo(
		() =>
			tours
				.map((tour) => tour.road)
				.filter((item, index, list) => list.indexOf(item) === index),
		[tours],
	);

	const selectedTour = tourByRoad.get(road) ?? tours[0];
	const selectionDurationDays = selectedTour?.durationDays ?? 1;
	const pricePerPerson = selectedTour?.basePrice || 620;
	const totalPrice = pricePerPerson * passengers;
	const tourPath = selectedTour
		? rewriteUrl(`/${selectedTour.slug}`, lang)
		: "";
	const maxPassengers = availability && availability > 0 ? availability : null;
	const selectedDateRange = date
		? formatSelectedDateRange(date, selectionDurationDays)
		: "";

	const handleViewChange = useCallback(
		({ road: nextRoad }: { road: string; month: number }) => {
			setRoad(nextRoad);
			setDate("");
			setAvailability(null);
			setPassengers(1);
		},
		[],
	);

	const handleDateSelect = useCallback((selection: CalendarSelection) => {
		setDate(selection.date);
		setRoad(selection.road);
		setAvailability(selection.availability);
		setPassengers(1);
	}, []);

	const handleMinus = () => {
		setPassengers((current) => Math.max(1, current - 1));
	};

	const handlePlus = () => {
		setPassengers((current) =>
			maxPassengers ? Math.min(maxPassengers, current + 1) : current + 1,
		);
	};

	const handleBookNow = () => {
		if (!date || !selectedTour) {
			alert(copy.alertDate);
			return;
		}

		const cartItem = {
			tourId: selectedTour.tourId,
			tourName: selectedTour.tourName,
			pricePerPerson,
			totalPrice,
			passengers,
			date,
			durationDays: selectedTour.durationDays,
			road,
			availability,
			lang,
			tourPath,
		};

		window.localStorage.setItem("bookingCart", JSON.stringify(cartItem));
		window.localStorage.setItem("lastBookingTourPath", tourPath);
		window.location.href = rewriteUrl("/checkout", lang);
	};

	return (
		<div>
			<IncaTrailAvailabilityCalendar
				lang={lang}
				year={year}
				initialMonth={initialMonth}
				initialRoad={initialRoad}
				allowedRoads={allowedRoads}
				roadLabels={roadLabels}
				selectionDurationDays={selectionDurationDays}
				initialTickets={initialTickets}
				selectedDate={date}
				showSelectedSummary={false}
				onViewChange={handleViewChange}
				onDateSelect={handleDateSelect}
			/>

			<div className="mt-4 overflow-hidden rounded-lg border border-[#e7d7c8] bg-white shadow-[0_18px_54px_-42px_rgba(63,40,18,0.7)]">
				<div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_auto]">
					<div className="border-b border-[#eadfd3] bg-[#faf8f5] px-4 py-3 lg:border-b-0 lg:border-r">
						<p className="text-[0.68rem] font-extrabold uppercase tracking-[0.18em] text-secondary">
							{date ? copy.selectedDate : copy.route}
						</p>
						<p className="mt-1 text-sm font-extrabold leading-snug text-[#1f2d29]">
							{date
								? selectedDateRange
								: (roadLabels[road] ??
									selectedTour?.tourName ??
									copy.selectDate)}
						</p>
						<p className="mt-1 text-xs font-semibold text-[#6f6258]">
							{roadLabels[road] ?? `${copy.route} ${road}`}
						</p>
					</div>

					<div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
						<div className="flex items-center justify-between gap-3 sm:justify-start">
							<span className="text-xs font-extrabold uppercase tracking-wide text-[#244237]">
								{copy.stepPeople}
							</span>
							<div className="flex items-center overflow-hidden rounded-full border border-[#e6d4c1] bg-white shadow-sm">
								<button
									type="button"
									onClick={handleMinus}
									disabled={passengers <= 1 || !date}
									aria-label={copy.decreasePassengers}
									className="flex h-10 w-10 items-center justify-center text-[#244237] transition-colors hover:bg-secondary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary disabled:cursor-not-allowed disabled:opacity-35"
								>
									<Minus size={18} aria-hidden="true" />
								</button>
								<span className="flex h-10 min-w-11 items-center justify-center border-x border-[#eadfd3] px-3 text-center text-lg font-extrabold text-[#1f2d29]">
									{passengers}
								</span>
								<button
									type="button"
									onClick={handlePlus}
									disabled={
										!date ||
										(maxPassengers !== null && passengers >= maxPassengers)
									}
									aria-label={copy.increasePassengers}
									className="flex h-10 w-10 items-center justify-center text-[#244237] transition-colors hover:bg-secondary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary disabled:cursor-not-allowed disabled:opacity-35"
								>
									<Plus size={18} aria-hidden="true" />
								</button>
							</div>
						</div>

						<button
							type="button"
							onClick={handleBookNow}
							disabled={!date || !selectedTour}
							className="min-h-10 rounded-sm bg-[#1f6c43] px-5 text-sm font-extrabold text-white shadow-[0_12px_28px_-20px_rgba(31,108,67,0.85)] transition-colors hover:bg-[#185637] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6c43] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-36"
						>
							{copy.bookNow}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
