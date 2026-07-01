import { Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import IncaTrailAvailabilityCalendar from "@/components/tours/IncaTrailAvailabilityCalendar";
import type { Lang } from "@/lib/i18n";
import type { TicketsByDate } from "@/lib/incaTrailAvailability";
import { rewriteUrl } from "@/lib/utils";

interface BookingFormProps {
	tourId: string | number;
	tourName: string;
	basePrice?: number;
	lang: Lang;
	year?: number;
	initialMonth?: number;
	initialRoad?: string;
	allowedRoads?: string[];
	selectionDurationDays?: number;
	initialTickets?: TicketsByDate;
}

const bookingFormCopy = {
	es: {
		title: "Reserva",
		selectDate: "Seleccione la fecha",
		passengers: "Pasajeros",
		selectDateFirst: "Primero seleccione una fecha",
		pax: "Pax",
		peopleForDeparture: "Personas para esta salida",
		decreasePassengers: "Reducir cantidad de pasajeros",
		increasePassengers: "Aumentar cantidad de pasajeros",
		pricePerPerson: "Precio por persona",
		totalPrice: "Precio total",
		bookNow: "Reservar ahora",
		alertDate: "Por favor seleccione una fecha antes de reservar.",
	},
	en: {
		title: "Booking",
		selectDate: "Select date",
		passengers: "Passengers",
		selectDateFirst: "Select a date first",
		pax: "Pax",
		peopleForDeparture: "People for this departure",
		decreasePassengers: "Decrease passenger count",
		increasePassengers: "Increase passenger count",
		pricePerPerson: "Price per person",
		totalPrice: "Total price",
		bookNow: "Book now",
		alertDate: "Please select a date before booking.",
	},
	pt: {
		title: "Reserva",
		selectDate: "Selecione a data",
		passengers: "Passageiros",
		selectDateFirst: "Primeiro selecione uma data",
		pax: "Pax",
		peopleForDeparture: "Pessoas para esta saida",
		decreasePassengers: "Reduzir quantidade de passageiros",
		increasePassengers: "Aumentar quantidade de passageiros",
		pricePerPerson: "Preco por pessoa",
		totalPrice: "Preco total",
		bookNow: "Reservar agora",
		alertDate: "Selecione uma data antes de reservar.",
	},
} as const;

export default function BookingForm({
	tourId,
	tourName,
	basePrice = 620.0,
	lang,
	year,
	initialMonth,
	initialRoad = "1",
	allowedRoads,
	selectionDurationDays = 1,
	initialTickets,
}: BookingFormProps) {
	const copy = bookingFormCopy[lang] ?? bookingFormCopy.en;
	const [date, setDate] = useState<string>("");
	const [selectedAvailability, setSelectedAvailability] = useState<
		number | null
	>(null);
	const [road, setRoad] = useState<string>(initialRoad);
	const [passengers, setPassengers] = useState<number>(1);
	const [totalPrice, setTotalPrice] = useState<number>(basePrice || 620);

	useEffect(() => {
		const price = basePrice || 620;
		setTotalPrice(price * passengers);
	}, [passengers, basePrice]);

	const handleCalendarViewChange = useCallback(
		({ road }: { road: string; month: number }) => {
			setRoad(road);
			setDate("");
			setSelectedAvailability(null);
			setPassengers(1);
		},
		[],
	);

	const handleMinus = () => {
		if (passengers > 1) setPassengers(passengers - 1);
	};

	const handlePlus = () => {
		setPassengers(passengers + 1);
	};

	const handleBookNow = () => {
		if (!date) {
			alert(copy.alertDate);
			return;
		}

		const cartItem = {
			tourId,
			tourName,
			pricePerPerson: basePrice,
			totalPrice,
			passengers,
			date,
			durationDays: selectionDurationDays,
			road,
			availability: selectedAvailability,
			lang,
			tourPath: window.location.pathname,
		};

		window.localStorage.setItem("bookingCart", JSON.stringify(cartItem));
		window.localStorage.setItem(
			"lastBookingTourPath",
			window.location.pathname,
		);
		window.location.href = rewriteUrl("/checkout", lang);
	};

	return (
		<section
			aria-labelledby="booking-form-title"
			className="mb-8 flex w-full flex-col overflow-hidden rounded-lg border border-[#e7d7c8] bg-white shadow-[0_24px_70px_-48px_rgba(63,40,18,0.68)]"
		>
			<header className="border-b border-[#355548]/30 bg-[#244237] px-5 py-5 text-white md:px-6">
				<h2
					id="booking-form-title"
					className="text-2xl font-extrabold tracking-tight text-white"
				>
					{copy.title}
				</h2>
				<p className="mt-1 text-sm font-semibold leading-6 text-[#f0dbc8]">
					{tourName}
				</p>
			</header>

			<div className="flex flex-col px-4 py-5 md:px-5">
				<div className="mb-5 w-full">
					<div className="mb-3 flex items-center gap-3">
						<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-extrabold text-secondary-foreground shadow-sm">
							1
						</span>
						<span className="text-sm font-extrabold uppercase tracking-wide text-[#244237]">
							{copy.selectDate}
						</span>
					</div>

					<IncaTrailAvailabilityCalendar
						lang={lang}
						year={year}
						initialMonth={initialMonth}
						initialRoad={initialRoad}
						allowedRoads={allowedRoads}
						selectionDurationDays={selectionDurationDays}
						initialTickets={initialTickets}
						selectedDate={date}
						compact
						onViewChange={handleCalendarViewChange}
						onDateSelect={({ date, availability, road }) => {
							setDate(date);
							setSelectedAvailability(availability);
							setRoad(road);
							setPassengers(1);
						}}
					/>
				</div>

				<div className="w-full rounded-md border border-[#e8e2da] bg-white p-4 shadow-sm">
					<div className="mb-3 flex items-center gap-3">
						<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-extrabold text-secondary-foreground shadow-sm">
							2
						</span>
						<span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-extrabold uppercase tracking-wide text-[#244237]">
							{copy.passengers}
							{!date && (
								<span className="text-xs font-bold normal-case tracking-normal text-secondary">
									{copy.selectDateFirst}
								</span>
							)}
						</span>
					</div>

					<div className="mt-4 flex items-center justify-between gap-4">
						<div>
							<span className="block text-lg font-extrabold text-[#1f2d29]">
								{copy.pax}
							</span>
							<span className="text-sm font-semibold text-[#5f5349]">
								{copy.peopleForDeparture}
							</span>
						</div>
						<div className="flex items-center overflow-hidden rounded-full border border-[#e6d4c1] bg-white shadow-sm">
							<button
								type="button"
								onClick={handleMinus}
								disabled={passengers <= 1 || !date}
								aria-label={copy.decreasePassengers}
								className="flex h-11 w-11 items-center justify-center text-[#244237] transition-colors hover:bg-secondary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary disabled:cursor-not-allowed disabled:opacity-35"
							>
								<Minus size={20} aria-hidden="true" />
							</button>
							<span className="flex h-11 min-w-12 items-center justify-center border-x border-[#eadfd3] px-3 text-center text-xl font-extrabold text-[#1f2d29]">
								{passengers}
							</span>
							<button
								type="button"
								onClick={handlePlus}
								disabled={!date}
								aria-label={copy.increasePassengers}
								className="flex h-11 w-11 items-center justify-center text-[#244237] transition-colors hover:bg-secondary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary disabled:cursor-not-allowed disabled:opacity-35"
							>
								<Plus size={20} aria-hidden="true" />
							</button>
						</div>
					</div>
				</div>
			</div>

			<footer className="border-t border-[#eadfd3] bg-white p-5 md:p-6">
				<div className="mb-3 flex items-center justify-between rounded-sm border border-[#e8e2da] bg-[#faf8f5] px-3 py-2">
					<span className="text-sm font-semibold text-[#5f5349]">
						{copy.pricePerPerson}
					</span>
					<span className="text-sm font-extrabold text-[#1f2d29]">
						US${(basePrice || 620).toFixed(2)}
					</span>
				</div>
				<div className="mb-3 flex items-center justify-between gap-4">
					<span className="text-sm font-extrabold uppercase tracking-wide text-[#244237]">
						{copy.totalPrice}
					</span>
					<span className="text-2xl font-extrabold tracking-tight text-[#1f2d29]">
						US${(totalPrice || 620).toFixed(2)}
					</span>
				</div>
				<button
					type="button"
					onClick={handleBookNow}
					disabled={!date}
					className="w-full rounded-sm bg-[#1f6c43] py-4 text-lg font-extrabold text-white shadow-[0_18px_40px_-26px_rgba(31,108,67,0.9)] transition-all hover:-translate-y-0.5 hover:bg-[#185637] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6c43] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
				>
					{copy.bookNow}
				</button>
			</footer>
		</section>
	);
}
