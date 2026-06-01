import {
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	Loader2,
	MapPinned,
	Minus,
	Plus,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { rewriteUrl } from "@/lib/utils";

interface BookingFormProps {
	tourId: string | number;
	tourName: string;
	basePrice?: number;
	lang: Lang;
}

type TicketsByDate = Record<string, number | undefined>;
type LoadState = "idle" | "loading" | "error";

const PLACE_ID = 2;
const CURRENT_YEAR = new Date().getFullYear();

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

function formatDateKey(year: number, month: number, day: number) {
	return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getTone(availability: number) {
	if (availability > 10) return "available";
	if (availability > 0) return "limited";
	return "unavailable";
}

export default function BookingForm({
	tourId,
	tourName,
	basePrice = 620.0,
	lang,
}: BookingFormProps) {
	const [date, setDate] = useState<string>("");
	const [selectedAvailability, setSelectedAvailability] = useState<
		number | null
	>(null);
	const [road, setRoad] = useState<string>("1");
	const [currentMonth, setCurrentMonth] = useState<number>(
		new Date().getMonth() + 1,
	);
	const [minMonth] = useState(() => new Date().getMonth() + 1);
	const [tickets, setTickets] = useState<TicketsByDate>({});
	const [loadState, setLoadState] = useState<LoadState>("idle");
	const [passengers, setPassengers] = useState<number>(1);
	const [totalPrice, setTotalPrice] = useState<number>(basePrice || 620);
	const monthNames = monthNamesByLang[lang] ?? monthNamesByLang.es;

	useEffect(() => {
		const price = basePrice || 620;
		setTotalPrice(price * passengers);
	}, [passengers, basePrice]);

	useEffect(() => {
		const controller = new AbortController();

		async function loadAvailability() {
			setLoadState("loading");
			setTickets({});
			setDate("");
			setSelectedAvailability(null);

			const url = `/api/calendar-tickets?place=${PLACE_ID}&road=${road}&year=${CURRENT_YEAR}&month=${currentMonth}`;

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
	}, [road, currentMonth]);

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
		};

		window.localStorage.setItem("bookingCart", JSON.stringify(cartItem));
		window.location.href = rewriteUrl("/checkout", lang);
	};

	const firstDay = new Date(CURRENT_YEAR, currentMonth - 1, 1);
	const daysInMonth = new Date(CURRENT_YEAR, currentMonth, 0).getDate();
	const startDay = (firstDay.getDay() + 6) % 7;
	const emptyCells = leadingDayKeys.slice(0, startDay);
	const calendarDays = Array.from({ length: daysInMonth }, (_, index) => {
		const day = index + 1;
		const dateKey = formatDateKey(CURRENT_YEAR, currentMonth, day);
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
		<div className="w-full bg-white rounded-sm shadow-lg border border-gray-100 overflow-hidden flex flex-col font-sans mb-8">
			{/* HEADER */}
			<div className="bg-[#3a3a3a] py-4 text-center">
				<h2 className="text-white text-2xl font-bold tracking-wide">Reserva</h2>
			</div>

			<div className="px-6 md:px-8 py-6 flex flex-col items-center">
				<p className="text-gray-800 text-lg text-center mb-2 font-medium">
					{tourName}
				</p>
				<p className="text-[#8f3513] text-2xl font-bold mb-6">
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

					<div className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
						<div className="grid grid-cols-1 gap-3 border-b border-gray-100 bg-[#faf8f5] p-4 sm:grid-cols-2">
							<label className="block">
								<span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
									<MapPinned size={14} aria-hidden="true" />
									Ruta
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
									Mes
								</span>
								<select
									name="travel-month"
									value={currentMonth}
									onChange={(event) =>
										setCurrentMonth(Number(event.target.value))
									}
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
								aria-label="Mes anterior"
								className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-35"
							>
								<ChevronLeft size={20} aria-hidden="true" />
							</button>

							<div className="text-center">
								<p className="text-base font-bold text-gray-900">
									{monthNames[currentMonth - 1]} {CURRENT_YEAR}
								</p>
							</div>

							<button
								type="button"
								onClick={() =>
									setCurrentMonth((month) => Math.min(12, month + 1))
								}
								disabled={currentMonth === 12}
								aria-label="Mes siguiente"
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
										Cargando...
									</div>
								</div>
							)}

							{emptyCells.map((key) => (
								<div
									key={key}
									className="h-14 border-b border-r border-gray-100 bg-gray-50/80"
								/>
							))}

							{loadState === "error" ? (
								<div className="col-span-7 px-5 py-8 text-center text-sm font-medium text-red-600">
									No se pudo cargar la disponibilidad.
								</div>
							) : (
								calendarDays.map(
									({ day, dateKey, availability, tone, isSelectable }) => {
										const isSelected = date === dateKey;
										const toneStyles: Record<string, string> = {
											available:
												"bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
											limited: "bg-red-50 text-red-700 hover:bg-red-100",
											unavailable:
												"bg-gray-50 text-gray-400 cursor-not-allowed",
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
												onClick={() => {
													setDate(dateKey);
													setSelectedAvailability(availability);
													setPassengers(1);
												}}
												className={`relative flex h-14 flex-col items-center justify-center gap-px border-b border-r border-gray-100 transition ${toneStyles[tone]} ${
													isSelected
														? "z-[1] ring-2 ring-inset ring-[#db5b24]"
														: ""
												}`}
												aria-label={`${dateKey}${isSelectable ? `, ${availability} cupos disponibles` : ", sin disponibilidad"}`}
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
					</div>

					{date && (
						<div
							className="mt-3 rounded-sm border border-[#db5b24]/20 bg-[#db5b24]/5 px-4 py-3 text-sm text-gray-700"
							aria-live="polite"
						>
							<span className="font-semibold text-gray-900">
								Fecha elegida:
							</span>{" "}
							{date}
						</div>
					)}

					<div className="mt-3 flex items-center gap-4 text-[11px] text-gray-500">
						<span className="flex items-center gap-1.5">
							<span className="inline-block h-3 w-3 rounded-sm border border-emerald-200 bg-emerald-50" />
							+10 cupos
						</span>
						<span className="flex items-center gap-1.5">
							<span className="inline-block h-3 w-3 rounded-sm border border-red-200 bg-red-50" />
							1-10 cupos
						</span>
						<span className="flex items-center gap-1.5">
							<span className="inline-block h-3 w-3 rounded-sm border border-gray-200 bg-gray-50" />
							Sin cupos
						</span>
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
								<span className="text-[#8f3513] text-sm font-normal">
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
								aria-label="Reducir cantidad de pasajeros"
								className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								<Minus size={20} aria-hidden="true" />
							</button>
							<span className="text-xl font-bold w-4 text-center">
								{passengers}
							</span>
							<button
								type="button"
								onClick={handlePlus}
								disabled={!date}
								aria-label="Aumentar cantidad de pasajeros"
								className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								<Plus size={20} aria-hidden="true" />
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
					type="button"
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
