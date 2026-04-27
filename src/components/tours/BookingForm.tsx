import React, { useState, useEffect } from "react";
import { Minus, Plus } from "lucide-react";
import { rewriteUrl } from "@/lib/utils";

interface BookingFormProps {
	tourId: string | number;
	tourName: string;
	basePrice?: number;
	lang: string;
}

export default function BookingForm({
	tourId,
	tourName,
	basePrice = 620.0,
	lang,
}: BookingFormProps) {
	const [date, setDate] = useState<string>("");
	const [passengers, setPassengers] = useState<number>(1);
	const [totalPrice, setTotalPrice] = useState<number>(basePrice || 620);

	useEffect(() => {
		const price = basePrice || 620;
		setTotalPrice(price * passengers);
	}, [passengers, basePrice]);

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
			lang,
		};

		window.localStorage.setItem("bookingCart", JSON.stringify(cartItem));
		window.location.href = rewriteUrl("/checkout", lang as any);
	};

	return (
		<div className="w-full bg-white rounded-sm shadow-lg border border-gray-100 overflow-hidden flex flex-col font-sans mb-8">
			{/* HEADER */}
			<div className="bg-[#3a3a3a] py-4 text-center">
				<h2 className="text-white text-2xl font-bold tracking-wide">Reserva</h2>
			</div>

			<div className="px-6 md:px-8 py-6 flex flex-col items-center">
				<h3 className="text-gray-800 text-lg text-center mb-2 font-medium">
					{tourName}
				</h3>
				<p className="text-[#db5b24] text-2xl font-bold mb-6">
					US${(basePrice || 620).toFixed(2)}
				</p>

				<div className="w-full h-px bg-gray-200 mb-6"></div>

				<p className="text-gray-500 text-sm tracking-widest uppercase mb-8">
					Elija la fecha de su viaje
				</p>

				{/* STEP 1: DATE */}
				<div className="w-full mb-8">
					<div className="flex items-center gap-3 mb-4">
						<span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#db5b24] text-white text-sm font-bold shrink-0">
							1
						</span>
						<span className="text-gray-800 font-medium">
							Seleccione la fecha
						</span>
					</div>

					<div className="w-full bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
						<input
							type="date"
							className="w-full outline-none text-gray-700 bg-transparent text-lg font-medium cursor-pointer"
							value={date}
							onChange={(e) => setDate(e.target.value)}
							min={new Date().toISOString().split("T")[0]}
						/>
					</div>
				</div>

				{/* STEP 2: PASSENGERS */}
				<div className="w-full mb-8">
					<div className="flex items-center gap-3 mb-4">
						<span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#db5b24] text-white text-sm font-bold shrink-0">
							2
						</span>
						<span className="text-gray-800 font-medium flex items-center gap-2">
							Pasajeros
							{!date && (
								<span className="text-[#db5b24] text-sm font-normal">
									(Primero seleccione una fecha)
								</span>
							)}
						</span>
					</div>

					<div className="flex items-center justify-between mt-6">
						<span className="text-gray-900 font-bold text-lg">Pax</span>
						<div className="flex items-center gap-4">
							<button
								type="button"
								onClick={handleMinus}
								disabled={passengers <= 1 || !date}
								className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								<Minus size={20} />
							</button>
							<span className="text-xl font-bold w-4 text-center">
								{passengers}
							</span>
							<button
								type="button"
								onClick={handlePlus}
								disabled={!date}
								className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								<Plus size={20} />
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* SUMMARY */}
			<div className="bg-[#f9f9f9] border-t border-gray-100 p-6 md:p-8">
				<div className="flex justify-between items-center mb-2">
					<span className="text-gray-800 font-bold text-lg">Precio Total</span>
					<span className="text-gray-900 font-bold text-xl">
						US${(totalPrice || 620).toFixed(2)}
					</span>
				</div>
				<div className="flex justify-between items-center mb-6">
					<span className="text-gray-500 font-medium">Precio por Persona</span>
					<span className="text-gray-600">
						US${(basePrice || 620).toFixed(2)}
					</span>
				</div>

				<button
					onClick={handleBookNow}
					disabled={!date}
					className="w-full bg-[#20b26b] hover:bg-[#1a9358] text-white font-bold text-lg py-4 rounded-sm shadow-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
				>
					Book Now
				</button>
			</div>
		</div>
	);
}
