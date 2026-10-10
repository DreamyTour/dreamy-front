import {
	ArrowRight,
	CalendarDays,
	Clock3,
	MapPinned,
	Minus,
	Mountain,
	Plus,
	ShieldCheck,
	Users,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import IncaTrailAvailabilityCalendar from "@/components/tours/IncaTrailAvailabilityCalendar";
import type { Lang } from "@/lib/i18n";
import { shiftDateKey, type TicketsByDate } from "@/lib/incaTrailAvailability";
import { MAX_PASSENGERS_PER_BOOKING } from "@/lib/prebooking";
import { createRequestId } from "@/lib/requestId";
import { rewriteUrl } from "@/lib/utils";

interface AvailabilityBookingTour {
	road: string;
	durationDays: number;
	permitStartOffsetDays?: number;
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
	initialTourSlug?: string;
	roadLabels?: Record<string, string>;
	initialTickets?: TicketsByDate;
	tours: AvailabilityBookingTour[];
}

const copyByLang = {
	es: {
		dateTitle: "Elige tu fecha de viaje",
		summary: "Tu próxima aventura",
		summaryIntro: "Todo listo para dar el primer paso.",
		step: "Paso",
		of: "de",
		perPerson: "por persona",
		start: "Inicio del viaje",
		permit: "Ingreso al Camino Inca",
		spaces: "cupos disponibles",
		pending: "Fecha por elegir",
		next: "Continúa con los datos de los viajeros",
		note: "Solicitud sin cobro. Nuestro equipo verifica los permisos antes de confirmar tu reserva.",
		routeHint: "Encuentra el recorrido que va contigo.",
		calendarHint:
			"Los números indican los permisos disponibles para cada fecha.",
		duration: "Duración",
		stepPeople: "Cantidad de personas",
		tour: "Elige tu experiencia",
		total: "Precio total",
		bookNow: "Reservar ahora",
		selectDate: "Selecciona una fecha para continuar",
		selectedDate: "Fecha elegida",
		route: "Ruta",
		days: "días",
		alertDate: "Por favor seleccione una fecha antes de reservar.",
		decreasePassengers: "Reducir cantidad de pasajeros",
		increasePassengers: "Aumentar cantidad de pasajeros",
	},
	en: {
		dateTitle: "Choose your travel date",
		summary: "Your next adventure",
		summaryIntro: "Ready to take the first step.",
		step: "Step",
		of: "of",
		perPerson: "per person",
		start: "Trip starts",
		permit: "Inca Trail entry",
		spaces: "spaces available",
		pending: "Choose a date",
		next: "Continue with traveler details",
		note: "No payment now. Our team checks permits before confirming your booking.",
		routeHint: "Find the journey that suits you.",
		calendarHint: "Numbers show the available permits for each date.",
		duration: "Duration",
		stepPeople: "Number of people",
		tour: "Choose your experience",
		total: "Total price",
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
		dateTitle: "Escolha sua data de viagem",
		summary: "Sua próxima aventura",
		summaryIntro: "Tudo pronto para dar o primeiro passo.",
		step: "Etapa",
		of: "de",
		perPerson: "por pessoa",
		start: "Início da viagem",
		permit: "Entrada na Trilha Inca",
		spaces: "vagas disponíveis",
		pending: "Escolha uma data",
		next: "Continue com os dados dos viajantes",
		note: "Sem cobrança agora. Nossa equipe verifica as permissões antes de confirmar sua reserva.",
		routeHint: "Encontre o roteiro ideal para você.",
		calendarHint: "Os números indicam as permissões disponíveis em cada data.",
		duration: "Duração",
		stepPeople: "Quantidade de pessoas",
		tour: "Escolha sua experiência",
		total: "Preço total",
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
	initialTourSlug,
	roadLabels = {},
	initialTickets,
	tours,
}: IncaTrailAvailabilityBookingProps) {
	const copy = copyByLang[lang] ?? copyByLang.en;
	const isContextTour = tours.some((tour) => tour.slug === initialTourSlug);
	const [date, setDate] = useState("");
	const [road, setRoad] = useState(initialRoad);
	const [tourSlug, setTourSlug] = useState(initialTourSlug ?? "");
	const [availability, setAvailability] = useState<number | null>(null);
	const [passengers, setPassengers] = useState(1);

	const tourByRoad = useMemo(() => {
		const result = new Map<string, AvailabilityBookingTour>();
		for (const tour of tours) {
			if (
				!result.has(tour.road) ||
				(tour.road === "1" && tour.durationDays === 4) ||
				(tour.road === "5" && tour.durationDays === 2)
			)
				result.set(tour.road, tour);
		}
		return result;
	}, [tours]);
	const allowedRoads = useMemo(
		() =>
			tours
				.map((tour) => tour.road)
				.filter((item, index, list) => list.indexOf(item) === index),
		[tours],
	);

	const selectedTour =
		tours.find((tour) => tour.slug === tourSlug) ??
		tourByRoad.get(road) ??
		tours[0];
	const permitStartOffsetDays = selectedTour?.permitStartOffsetDays ?? 0;
	const selectionDurationDays = selectedTour?.durationDays ?? 1;
	const pricePerPerson = selectedTour?.basePrice || 620;
	const totalPrice = pricePerPerson * passengers;
	const tourPath = selectedTour
		? rewriteUrl(`/${selectedTour.slug}`, lang)
		: "";
	const maxPassengers =
		availability && availability > 0
			? Math.min(availability, MAX_PASSENGERS_PER_BOOKING)
			: MAX_PASSENGERS_PER_BOOKING;

	const handleViewChange = useCallback(
		({ road: nextRoad }: { road: string; month: number }) => {
			setRoad(nextRoad);
			setTourSlug((slug) =>
				tours.find((tour) => tour.slug === slug)?.road === nextRoad
					? slug
					: (tourByRoad.get(nextRoad)?.slug ?? ""),
			);
			setDate("");
			setAvailability(null);
			setPassengers(1);
		},
		[tours, tourByRoad],
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
		setPassengers((current) => Math.min(maxPassengers, current + 1));
	};

	const handleBookNow = () => {
		if (!date || !selectedTour) {
			alert(copy.alertDate);
			return;
		}

		const cartItem = {
			quoteRequestId: createRequestId(),
			tourId: selectedTour.tourId,
			tourName: selectedTour.tourName,
			pricePerPerson,
			totalPrice,
			passengers,
			date: shiftDateKey(date, -permitStartOffsetDays),
			permitDate: date,
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

	const displayDate = (key: string) =>
		new Intl.DateTimeFormat(lang, {
			day: "2-digit",
			month: "short",
			year: "numeric",
			timeZone: "UTC",
		}).format(new Date(`${key}T12:00:00Z`));
	const stepHeading = (number: number, title: string) => (
		<div className="mb-5 flex items-center justify-between gap-3">
			<h2 className="flex items-center gap-3 text-lg font-bold text-foreground">
				<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
					{number}
				</span>
				{title}
			</h2>
			<span className="shrink-0 rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
				{copy.step} {number} {copy.of} 3
			</span>
		</div>
	);
	return (
		<div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-8">
			<div className="min-w-0 space-y-6">
				{!isContextTour && (
					<section className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm sm:p-7">
						{stepHeading(1, copy.tour)}
						<p className="mb-4 text-sm text-muted-foreground">
							{copy.routeHint}
						</p>
						{
							<>
								<label htmlFor="availability-tour" className="sr-only">
									{copy.tour}
								</label>
								<select
									id="availability-tour"
									value={selectedTour?.slug ?? ""}
									className="min-h-12 w-full cursor-pointer rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
									onChange={(event) => {
										const tour = tours.find(
											(item) => item.slug === event.target.value,
										);
										if (!tour) return;
										setTourSlug(tour.slug);
										setRoad(tour.road);
										setDate("");
										setAvailability(null);
										setPassengers(1);
									}}
								>
									{tours.map((tour) => (
										<option key={tour.slug} value={tour.slug}>
											{tour.tourName}
										</option>
									))}
								</select>
							</>
						}
						<div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 rounded-xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-primary">
							<span className="flex items-center gap-2">
								<MapPinned size={16} aria-hidden="true" />
								{roadLabels[road] ?? `${copy.route} ${road}`}
							</span>
							<span className="flex items-center gap-2">
								<Clock3 size={16} aria-hidden="true" />
								{selectionDurationDays} {copy.days}
							</span>
						</div>
					</section>
				)}
				<section className="min-w-0 rounded-2xl border border-border/60 bg-white p-4 shadow-sm sm:p-7">
					{stepHeading(2, copy.dateTitle)}
					<p className="mb-5 text-sm text-muted-foreground">
						{copy.calendarHint}
					</p>
					<IncaTrailAvailabilityCalendar
						key={road}
						lang={lang}
						year={year}
						initialMonth={initialMonth}
						initialRoad={road}
						allowedRoads={allowedRoads}
						roadLabels={roadLabels}
						selectionDurationDays={selectionDurationDays}
						permitStartOffsetDays={permitStartOffsetDays}
						initialTickets={road === initialRoad ? initialTickets : undefined}
						selectedDate={date}
						showSelectedSummary={true}
						onViewChange={handleViewChange}
						onDateSelect={handleDateSelect}
					/>
				</section>
			</div>
			<aside className="min-w-0 overflow-hidden rounded-2xl border border-primary/15 bg-white shadow-[0_12px_35px_-20px_rgba(0,112,32,0.25)] lg:sticky lg:top-6">
				<div className="border-b border-primary/10 bg-primary/5 p-6">
					<span className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-white text-primary">
						<Mountain size={23} aria-hidden="true" />
					</span>
					<h2 className="text-xl font-extrabold text-foreground">
						{copy.summary}
					</h2>
					<p className="mt-1 text-xs text-muted-foreground">
						{copy.summaryIntro}
					</p>
				</div>
				<div className="p-6">
					<p className="text-base font-bold leading-snug text-foreground">
						{selectedTour?.tourName}
					</p>
					<div className="mt-4 flex items-baseline gap-2">
						<span className="text-3xl font-extrabold tracking-tight text-primary">
							US${pricePerPerson.toFixed(2)}
						</span>
						<span className="text-xs text-muted-foreground">
							{copy.perPerson}
						</span>
					</div>
					<dl className="my-5 space-y-3 border-y border-border/70 py-5 text-sm">
						<div className="flex justify-between gap-3">
							<dt className="flex items-center gap-2 text-muted-foreground">
								<Clock3 size={15} aria-hidden="true" />
								{copy.duration}
							</dt>
							<dd className="font-semibold">
								{selectionDurationDays} {copy.days}
							</dd>
						</div>
						<div className="flex justify-between gap-3">
							<dt className="flex items-center gap-2 text-muted-foreground">
								<CalendarDays size={15} aria-hidden="true" />
								{copy.start}
							</dt>
							<dd
								className={
									date
										? "text-right font-semibold text-primary"
										: "text-right text-muted-foreground"
								}
							>
								{date
									? displayDate(shiftDateKey(date, -permitStartOffsetDays))
									: copy.pending}
							</dd>
						</div>
						{date && permitStartOffsetDays > 0 && (
							<div className="flex justify-between gap-3">
								<dt className="text-muted-foreground">{copy.permit}</dt>
								<dd className="text-right font-semibold">
									{displayDate(date)}
								</dd>
							</div>
						)}
					</dl>
					<h3 className="mb-4 flex items-center gap-2 text-sm font-bold">
						<span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-white">
							3
						</span>
						<Users size={16} aria-hidden="true" />
						{copy.stepPeople}
					</h3>
					<div className="flex items-center justify-between gap-3">
						<span className="text-sm text-muted-foreground">
							{copy.stepPeople}
						</span>
						<div className="inline-grid shrink-0 grid-cols-3 overflow-hidden rounded-xl border border-border">
							<button
								type="button"
								onClick={handleMinus}
								disabled={passengers <= 1 || !date}
								aria-label={copy.decreasePassengers}
								className="flex size-11 items-center justify-center text-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-35"
							>
								<Minus size={16} aria-hidden="true" />
							</button>
							<span className="flex size-11 items-center justify-center border-x border-border font-bold">
								{passengers}
							</span>
							<button
								type="button"
								onClick={handlePlus}
								disabled={!date || passengers >= maxPassengers}
								aria-label={copy.increasePassengers}
								className="flex size-11 items-center justify-center text-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-35"
							>
								<Plus size={16} aria-hidden="true" />
							</button>
						</div>
					</div>
					{date && (
						<p className="mt-3 text-right text-xs font-medium text-primary">
							{availability} {copy.spaces}
						</p>
					)}
					<div className="mt-6 flex items-center justify-between border-t border-border pt-5">
						<span className="text-sm font-semibold">{copy.total}</span>
						<strong className="text-2xl font-extrabold text-primary">
							US${totalPrice.toFixed(2)}
						</strong>
					</div>
					<button
						type="button"
						onClick={handleBookNow}
						disabled={!date || !selectedTour}
						className="mt-5 flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary disabled:cursor-not-allowed disabled:opacity-45"
					>
						{copy.bookNow}
						<ArrowRight size={17} aria-hidden="true" />
					</button>
					<p className="mt-2 text-center text-xs text-muted-foreground">
						{date ? copy.next : copy.selectDate}
					</p>
					<div className="mt-5 flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-[11px] leading-relaxed text-muted-foreground">
						<ShieldCheck
							size={17}
							className="mt-0.5 shrink-0 text-primary"
							aria-hidden="true"
						/>
						{copy.note}
					</div>
				</div>
			</aside>
		</div>
	);
}
