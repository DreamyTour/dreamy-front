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
	initialTickets?: TicketsByDate;
}

export default function BookingForm({
	tourId,
	tourName,
	basePrice = 620.0,
	lang,
	year,
	initialMonth,
	initialRoad = "1",
	initialTickets,
}: BookingFormProps) {
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
			alert("Por favor seleccione una fecha antes de reservar.");
			return;
		}

		const cartItem = {
			tourId,
			tourName,
			pricePerPerson: basePrice,
			totalPrice,
			passengers,
			date,
			road,
			availability: selectedAvailability,
			lang,
			tourPath: window.location.pathname,
		};

		window.localStorage.setItem("bookingCart", JSON.stringify(cartItem));
		window.localStorage.setItem("lastBookingTourPath", window.location.pathname);
		window.location.href = rewriteUrl("/checkout", lang);
	};

	return (
		<div className="mb-8 flex w-full flex-col overflow-hidden rounded-sm border border-gray-100 bg-white font-sans shadow-lg">
			<div className="bg-[#3a3a3a] py-4 text-center">
				<h2 className="text-2xl font-bold tracking-wide text-white">Reserva</h2>
			</div>

			<div className="flex flex-col items-center px-6 py-6 md:px-8">
				<p className="mb-2 text-center text-lg font-medium text-gray-800">
					{tourName}
				</p>
				<p className="mb-6 text-2xl font-bold text-[#8f3513]">
					US${(basePrice || 620).toFixed(2)}
				</p>

				<div className="mb-6 h-px w-full bg-gray-200" />

				<p className="mb-8 text-sm uppercase tracking-widest text-gray-500">
					Elija la fecha de su viaje
				</p>

				<div className="mb-8 w-full">
					<div className="mb-4 flex items-center gap-3">
						<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#db5b24] text-sm font-bold text-white">
							1
						</span>
						<span className="font-medium text-gray-800">
							Seleccione la fecha
						</span>
					</div>

					<IncaTrailAvailabilityCalendar
						lang={lang}
						year={year}
						initialMonth={initialMonth}
						initialRoad={initialRoad}
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

				<div className="mb-8 w-full">
					<div className="mb-4 flex items-center gap-3">
						<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#db5b24] text-sm font-bold text-white">
							2
						</span>
						<span className="flex items-center gap-2 font-medium text-gray-800">
							Pasajeros
							{!date && (
								<span className="text-sm font-normal text-[#8f3513]">
									(Primero seleccione una fecha)
								</span>
							)}
						</span>
					</div>

					<div className="mt-6 flex items-center justify-between">
						<span className="text-lg font-bold text-gray-900">Pax</span>
						<div className="flex items-center gap-4">
							<button
								type="button"
								onClick={handleMinus}
								disabled={passengers <= 1 || !date}
								aria-label="Reducir cantidad de pasajeros"
								className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
							>
								<Minus size={20} aria-hidden="true" />
							</button>
							<span className="w-4 text-center text-xl font-bold">
								{passengers}
							</span>
							<button
								type="button"
								onClick={handlePlus}
								disabled={!date}
								aria-label="Aumentar cantidad de pasajeros"
								className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
							>
								<Plus size={20} aria-hidden="true" />
							</button>
						</div>
					</div>
				</div>
			</div>

			<div className="border-t border-gray-100 bg-[#f9f9f9] p-6 md:p-8">
				<div className="mb-2 flex items-center justify-between">
					<span className="text-lg font-bold text-gray-800">Precio Total</span>
					<span className="text-xl font-bold text-gray-900">
						US${(totalPrice || 620).toFixed(2)}
					</span>
				</div>
				<div className="mb-6 flex items-center justify-between">
					<span className="font-medium text-gray-500">Precio por Persona</span>
					<span className="text-gray-600">
						US${(basePrice || 620).toFixed(2)}
					</span>
				</div>

				<button
					type="button"
					onClick={handleBookNow}
					disabled={!date}
					className="w-full rounded-sm bg-[#20b26b] py-4 text-lg font-bold text-white shadow-md transition-colors hover:bg-[#1a9358] disabled:cursor-not-allowed disabled:opacity-60"
				>
					Book Now
				</button>
			</div>
		</div>
	);
}
