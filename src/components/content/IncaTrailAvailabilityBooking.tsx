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

			<div className="mt-4 overflow-hidden rounded-sm border border-[#e7d7c8] bg-white shadow-[0_18px_54px_-42px_rgba(63,40,18,0.7)]">
				<div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-end sm:justify-between">
					<div className="flex items-center justify-between gap-3 sm:block">
						<span className="text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-[#244237] sm:mb-1.5 sm:block">
							{copy.stepPeople}
						</span>
						<div className="inline-grid shrink-0 grid-cols-3 overflow-hidden rounded-sm border border-[#e6d4c1] bg-white">
							<button
								type="button"
								onClick={handleMinus}
								disabled={passengers <= 1 || !date}
								aria-label={copy.decreasePassengers}
								className="flex size-9 shrink-0 items-center justify-center p-0 text-[#244237] transition-colors hover:bg-secondary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary disabled:cursor-not-allowed disabled:opacity-35"
							>
								<Minus size={15} aria-hidden="true" />
							</button>
							<span className="flex size-9 shrink-0 items-center justify-center border-x border-[#eadfd3] text-center text-base font-extrabold text-[#1f2d29]">
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
								className="flex size-9 shrink-0 items-center justify-center p-0 text-[#244237] transition-colors hover:bg-secondary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary disabled:cursor-not-allowed disabled:opacity-35"
							>
								<Plus size={15} aria-hidden="true" />
							</button>
						</div>
					</div>

					<button
						type="button"
						onClick={handleBookNow}
						disabled={!date || !selectedTour}
						className="min-h-9 rounded-sm bg-[#1f6c43] px-4 text-sm font-extrabold text-white shadow-[0_12px_28px_-20px_rgba(31,108,67,0.85)] transition-colors hover:bg-[#185637] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6c43] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-32"
					>
						{copy.bookNow}
					</button>
				</div>
			</div>
		</div>
	);
}
