import {
	AlertCircle,
	ArrowLeft,
	ArrowRight,
	Calendar,
	Check,
	Lock,
	Shield,
	Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { countries } from "@/data/countries";

interface BookingCart {
	tourId?: string | number;
	tourName?: string;
	pricePerPerson?: number;
	totalPrice: number;
	passengers: number;
	date?: string;
	durationDays?: number;
	lang?: string;
	tourPath?: string;
}

interface Passenger {
	id: string;
	name: string;
	lastname: string;
	gender: string;
	dob: string;
	documentType: string;
	documentNumber: string;
	country: string;
}

interface CheckoutSummaryProps {
	initialLang?: "en" | "es" | "pt";
}

export default function CheckoutSummary({
	initialLang = "en",
}: CheckoutSummaryProps) {
	const [cart, setCart] = useState<BookingCart | null>(null);
	const [loading, setLoading] = useState(true);
	const [emptyCartHref, setEmptyCartHref] = useState("/");
	const [step, setStep] = useState(1);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const errorRef = useRef<HTMLDivElement>(null);
	const firstPassengerNameRef = useRef<HTMLInputElement>(null);
	const today = new Date();
	const todayDateValue = `${today.getFullYear()}-${String(
		today.getMonth() + 1,
	).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

	// states for Passenger Step
	const [passengers, setPassengers] = useState<Passenger[]>([]);
	const [contact, setContact] = useState({
		firstname: "",
		lastname: "",
		email: "",
		phoneCode: "+1",
		phone: "",
	});
	const [acceptedTerms, setAcceptedTerms] = useState(false);

	// States for Payment Step
	const [paymentOption, setPaymentOption] = useState<"minimum" | "total">(
		"minimum",
	);

	useEffect(() => {
		const savedCart = window.localStorage.getItem("bookingCart");
		const savedTourPath = window.localStorage.getItem("lastBookingTourPath");
		setEmptyCartHref(
			savedTourPath || (initialLang === "en" ? "/" : `/${initialLang}`),
		);
		if (savedCart) {
			try {
				const parsedCart = JSON.parse(savedCart) as BookingCart;
				setCart(parsedCart);
				// Initialize passengers array based on count
				setPassengers(
					Array.from({ length: parsedCart.passengers || 1 }).map(
						(_, index) => ({
							id: `passenger-${index + 1}`,
							name: "",
							lastname: "",
							gender: "Male",
							dob: "",
							documentType: "Passport",
							documentNumber: "",
							country: "US",
						}),
					),
				);
			} catch (e) {
				console.error("Failed to parse cart", e);
			}
		}
		setLoading(false);
	}, [initialLang]);

	// Clear error when user starts typing
	// biome-ignore lint/correctness/useExhaustiveDependencies: This effect intentionally clears stale errors when form state changes.
	useEffect(() => {
		setError(null);
	}, [contact, passengers, acceptedTerms]);

	// Clear error when changing steps
	// biome-ignore lint/correctness/useExhaustiveDependencies: This effect intentionally clears stale errors when the checkout step changes.
	useEffect(() => {
		setError(null);
	}, [step]);

	useEffect(() => {
		if (error) {
			errorRef.current?.focus();
		}
	}, [error]);

	useEffect(() => {
		if (step !== 2 || passengers.length === 0 || error) return;

		const focusTimer = window.setTimeout(() => {
			firstPassengerNameRef.current?.focus({ preventScroll: true });
		}, 0);

		return () => window.clearTimeout(focusTimer);
	}, [step, passengers.length, error]);

	// Loading state
	if (loading) {
		return (
			<div className="w-full max-w-5xl mx-auto p-4 md:p-8 text-center min-h-[50vh] flex flex-col justify-center items-center">
				<div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
				<p className="text-gray-500 mt-4">Loading...</p>
			</div>
		);
	}

	// Empty cart state
	if (!cart) {
		return (
			<div className="w-full max-w-5xl mx-auto p-4 md:p-8 text-center min-h-[50vh] flex flex-col justify-center items-center">
				<div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
					<Users className="w-10 h-10 text-primary" />
				</div>
				<h2 className="text-2xl font-bold text-gray-800 mb-3">
					Tu carrito está vacío
				</h2>
				<p className="text-gray-500 mb-6">
					Explora nuestros tours y comienza tu aventura
				</p>
				<a
					href={emptyCartHref}
					className="px-8 py-3.5 bg-primary text-white font-semibold rounded-sm shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]"
				>
					Explorar Tours
				</a>
			</div>
		);
	}

	const handlePassengerChange = (
		index: number,
		field: keyof Passenger,
		value: string,
	) => {
		const newPax = [...passengers];
		newPax[index] = { ...newPax[index], [field]: value };
		setPassengers(newPax);
	};

	const openDatePicker = (dateInput: HTMLInputElement | null) => {
		if (!dateInput) return;

		try {
			dateInput.showPicker();
		} catch {
			dateInput.focus();
		}
	};

	const validateStep2 = () => {
		setError(null);
		if (!acceptedTerms) {
			setError("Please accept the terms and conditions to continue");
			return false;
		}
		if (
			!contact.firstname ||
			!contact.lastname ||
			!contact.email ||
			!contact.phone
		) {
			setError("Please fill in all contact details");
			return false;
		}
		for (let i = 0; i < passengers.length; i++) {
			const p = passengers[i];
			if (!p.name || !p.lastname || !p.dob || !p.documentNumber) {
				setError(`Please complete all information for traveler ${i + 1}`);
				return false;
			}
		}
		return true;
	};

	const handlePayNow = async () => {
		setIsSubmitting(true);
		// recalculate amount based on total vs minimum
		const payAmount =
			paymentOption === "total" ? cart.totalPrice : cart.totalPrice / 2;
		const fee = payAmount * 0.08;

		try {
			const response = await fetch("/api/checkout", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					cart: {
						...cart,
						amountToPayLabel: paymentOption,
						amountPaid: payAmount + fee,
					},
					passengersInfo: passengers,
					contactInfo: contact,
				}),
			});
			const contentType = response.headers.get("content-type") || "";
			const data = contentType.includes("application/json")
				? await response.json()
				: { error: await response.text() };

			if (!response.ok) {
				throw new Error(
					data.error || `Checkout failed with status ${response.status}`,
				);
			}

			if (data.success && data.redirectUrl) {
				window.location.href = data.redirectUrl;
			} else {
				alert(`Error Processing Checkout: ${data.error || "Unknown"}`);
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : "Network Error";
			alert(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Safe extracting values with fallbacks to avoid crashes
	const tourName = cart.tourName || "Tour Name Unspecified";
	const paxCount = Number(cart.passengers) || 1;
	const totalPrice = Number(cart.totalPrice) || 620;
	const pricePerPerson = Number(cart.pricePerPerson) || totalPrice / paxCount;
	const date = cart.date || "";
	const durationDays = Math.max(1, Number(cart.durationDays) || 1);
	const lang = cart.lang || "en";

	let startDateStr = "TBD";
	let endDateStr = "";
	if (date) {
		try {
			const [y, m, d] = date.split("-").map(Number);
			const localDate = new Date(y, m - 1, d);
			const endDate = new Date(y, m - 1, d + durationDays - 1);
			const locale =
				lang === "es" ? "es-ES" : lang === "pt" ? "pt-BR" : "en-US";
			const dateFormatOptions = {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
			} as const;
			startDateStr = localDate.toLocaleDateString(locale, dateFormatOptions);
			endDateStr = endDate.toLocaleDateString(locale, dateFormatOptions);
		} catch {
			/* ignore */
		}
	}
	const travelDateStr =
		durationDays > 1 && endDateStr
			? `${startDateStr} - ${endDateStr}`
			: startDateStr;

	const paymentFee =
		paymentOption === "total" ? totalPrice * 0.08 : (totalPrice / 2) * 0.08;
	const payAmount = paymentOption === "total" ? totalPrice : totalPrice / 2;
	const fieldClass =
		"min-h-12 rounded-sm border border-[#d8cec2] bg-white px-4 py-3 text-base text-[#1f2d29] outline-none transition focus:border-[#1f6c43] focus:ring-2 focus:ring-[#1f6c43]/15";
	const labelClass = "text-xs font-bold uppercase tracking-wide text-[#5f5349]";
	const checkoutTitle =
		initialLang === "es"
			? "Completa tu reserva"
			: initialLang === "pt"
				? "Complete sua reserva"
				: "Complete your booking";

	return (
		<div className="w-full px-4 py-6 md:px-8 md:py-10">
			<div className="mx-auto mb-6 max-w-8xl">
				<p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-secondary">
					Checkout
				</p>
				<h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#1f2d29] md:text-4xl">
					{checkoutTitle}
				</h1>
			</div>
			{/* MAIN CONTAINER */}
			<div className="mx-auto max-w-8xl overflow-hidden rounded-lg border border-[#e7d7c8] bg-white shadow-[0_24px_80px_-54px_rgba(63,40,18,0.72)]">
				{/* STEPS HEADER - Minimal and clean */}
				<div className="border-b border-[#355548]/30 bg-[#244237] px-5 py-5 md:px-10">
					<div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center md:gap-6">
						{/* Step 1 */}
						<button
							type="button"
							onClick={() => setStep(1)}
							aria-current={step === 1 ? "step" : undefined}
							className="group flex items-center gap-3"
						>
							<div
								className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
									step >= 1
										? "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20"
										: "bg-white/12 text-white/45"
								}`}
							>
								{step > 1 ? <Check size={18} /> : "1"}
							</div>
							<span
								className={`text-sm font-semibold ${step >= 1 ? "text-white" : "text-white/45"}`}
							>
								Itinerary
							</span>
						</button>

						{/* Connector */}
						<div className="hidden h-px w-16 bg-white/18 md:block"></div>

						{/* Step 2 */}
						<button
							type="button"
							onClick={() => step > 1 && setStep(2)}
							disabled={step <= 1}
							aria-current={step === 2 ? "step" : undefined}
							className={`flex items-center gap-3 ${step > 1 ? "group cursor-pointer" : "cursor-default"}`}
						>
							<div
								className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
									step >= 2
										? "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20"
										: "bg-white/12 text-white/45"
								}`}
							>
								{step > 2 ? <Check size={18} /> : "2"}
							</div>
							<span
								className={`text-sm font-semibold ${step >= 2 ? "text-white" : "text-white/45"}`}
							>
								Passengers
							</span>
						</button>

						{/* Connector */}
						<div className="hidden h-px w-16 bg-white/18 md:block"></div>

						{/* Step 3 */}
						<div className="flex items-center gap-3">
							<div
								className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
									step >= 3
										? "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20"
										: "bg-white/12 text-white/45"
								}`}
							>
								3
							</div>
							<span
								className={`text-sm font-semibold ${step >= 3 ? "text-white" : "text-white/45"}`}
							>
								Payment
							</span>
						</div>
					</div>
				</div>

				{/* ================= STEP 1: ITINERARY SUMMARY ================= */}
				{step === 1 && (
					<div className="animate-in fade-in slide-in-from-bottom-4 p-6 duration-300 md:p-10">
						<div className="mb-8 flex items-start justify-between">
							<div>
								<h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-secondary">
									Booking Summary
								</h2>
								<h3 className="text-2xl font-extrabold leading-tight text-[#1f2d29] md:text-3xl">
									{tourName}
								</h3>
							</div>
						</div>

						{/* Tour Details Card */}
						<div className="mb-8 rounded-md border border-[#e7d7c8] bg-[#fffdf9] p-5 md:p-6">
							<div className="grid gap-5 md:grid-cols-3">
								{/* Date */}
								<div className="flex items-center gap-3">
									<div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#edf8f1]">
										<Calendar className="h-6 w-6 text-[#1f6c43]" />
									</div>
									<div>
										<p className="text-xs font-bold uppercase tracking-wide text-[#6f6258]">
											Travel Dates
										</p>
										<p className="font-semibold text-[#1f2d29]">
											{travelDateStr}
										</p>
									</div>
								</div>

								{/* Passengers */}
								<div className="flex items-center gap-3">
									<div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#edf8f1]">
										<Users className="h-6 w-6 text-[#1f6c43]" />
									</div>
									<div>
										<p className="text-xs font-bold uppercase tracking-wide text-[#6f6258]">
											Travelers
										</p>
										<p className="font-semibold text-[#1f2d29]">
											{paxCount} {paxCount === 1 ? "Person" : "People"}
										</p>
									</div>
								</div>

								{/* Price per person */}
								<div className="flex items-center gap-3">
									<div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#fff2ea]">
										<span className="font-bold text-[#9a2f0d]">$</span>
									</div>
									<div>
										<p className="text-xs font-bold uppercase tracking-wide text-[#6f6258]">
											Per Person
										</p>
										<p className="font-semibold text-[#1f2d29]">
											US${pricePerPerson.toFixed(2)}
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* Total Box */}
						<div className="flex flex-col items-start justify-between gap-4 rounded-sm border border-[#1f6c43]/15 bg-[#edf8f1] p-4 md:flex-row md:items-center md:p-5">
							<div className="flex items-center gap-3">
								<div className="h-3 w-3 rounded-full bg-[#1f6c43]"></div>
								<span className="font-semibold text-[#244237]">
									Total Tour Price
								</span>
							</div>
							<div className="text-right">
								<span className="text-2xl font-black tracking-tight text-[#1f6c43] md:text-3xl">
									US${totalPrice.toFixed(2)}
								</span>
							</div>
						</div>

						{/* Continue Button */}
						<div className="flex justify-end mt-8">
							<button
								type="button"
								onClick={() => setStep(2)}
								className="group flex min-h-12 items-center gap-2 rounded-sm bg-[#1f6c43] px-8 py-4 font-semibold text-white shadow-lg shadow-[#1f6c43]/20 transition-all hover:bg-[#185637] hover:shadow-xl hover:shadow-[#1f6c43]/25 active:scale-[0.98]"
							>
								Continue
								<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
							</button>
						</div>
					</div>
				)}

				{/* ================= STEP 2: PASSENGER INFO ================= */}
				{step === 2 && (
					<div className="animate-in fade-in slide-in-from-bottom-4 p-6 duration-300 md:p-10">
						{/* Header */}
						<div className="mb-6 flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf8f1]">
								<Users className="h-5 w-5 text-[#1f6c43]" />
							</div>
							<div>
								<h2 className="text-xl font-extrabold text-[#1f2d29]">
									Traveler Information
								</h2>
								<p className="text-sm font-medium text-[#6f6258]">
									Please fill in the details for all travelers
								</p>
							</div>
						</div>

						{/* Alert */}
						<div className="mb-6 flex gap-3 rounded-sm border border-[#f0d3a5] bg-[#fff8ef] p-4">
							<AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#9a2f0d]" />
							<p className="text-sm font-medium text-[#71300f]">
								Your data and passport number must match exactly as they appear
								in your passport.
							</p>
						</div>

						{/* Error Banner */}
						{error && (
							<div
								ref={errorRef}
								role="alert"
								tabIndex={-1}
								className="animate-in fade-in slide-in-from-top-2 mb-6 flex gap-3 rounded-sm border border-red-200 bg-red-50 p-4"
							>
								<AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
								<p className="text-sm font-medium text-red-700">{error}</p>
							</div>
						)}

						{/* Passengers */}
						<div className="mb-10 space-y-6">
							{passengers.map((pax, i) => (
								<div
									key={pax.id}
									className="rounded-md border border-[#e7d7c8] bg-[#fffdf9] p-5"
								>
									<div className="mb-4 flex items-center gap-2">
										<div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
											{i + 1}
										</div>
										<span className="font-bold text-[#1f2d29]">
											Traveler {i + 1}
										</span>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
										<label className="flex flex-col gap-1">
											<span className={labelClass}>First Name *</span>
											<input
												ref={i === 0 ? firstPassengerNameRef : undefined}
												type="text"
												name={`passenger-${i + 1}-given-name`}
												autoComplete="given-name"
												required
												value={pax.name}
												onChange={(e) =>
													handlePassengerChange(i, "name", e.target.value)
												}
												className={fieldClass}
											/>
										</label>
										<label className="flex flex-col gap-1">
											<span className={labelClass}>Last Name *</span>
											<input
												type="text"
												name={`passenger-${i + 1}-family-name`}
												autoComplete="family-name"
												required
												value={pax.lastname}
												onChange={(e) =>
													handlePassengerChange(i, "lastname", e.target.value)
												}
												className={fieldClass}
											/>
										</label>
										<label className="flex flex-col gap-1">
											<span className={labelClass}>Gender *</span>
											<select
												name={`passenger-${i + 1}-gender`}
												required
												value={pax.gender}
												onChange={(e) =>
													handlePassengerChange(i, "gender", e.target.value)
												}
												className={fieldClass}
											>
												<option value="Male">Male</option>
												<option value="Female">Female</option>
											</select>
										</label>
										<label className="flex flex-col gap-1">
											<span className={labelClass}>Date of Birth *</span>
											<div className="relative">
												<input
													id={`passenger-${i + 1}-birthdate`}
													type="date"
													name={`passenger-${i + 1}-birthdate`}
													autoComplete="bday"
													required
													value={pax.dob}
													onChange={(e) =>
														handlePassengerChange(i, "dob", e.target.value)
													}
													onClick={(e) => openDatePicker(e.currentTarget)}
													max={todayDateValue}
													className={`${fieldClass} w-full cursor-pointer pr-12`}
												/>
												<button
													type="button"
													onClick={() =>
														openDatePicker(
															document.getElementById(
																`passenger-${i + 1}-birthdate`,
															) as HTMLInputElement | null,
														)
													}
													aria-label="Open date of birth calendar"
													className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-sm text-[#1f6c43] transition-colors hover:bg-[#1f6c43]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6c43]/25"
												>
													<Calendar className="h-5 w-5" aria-hidden="true" />
												</button>
											</div>
										</label>
										<label className="flex flex-col gap-1">
											<span className={labelClass}>Document Type *</span>
											<select
												name={`passenger-${i + 1}-document-type`}
												required
												value={pax.documentType}
												onChange={(e) =>
													handlePassengerChange(
														i,
														"documentType",
														e.target.value,
													)
												}
												className={fieldClass}
											>
												<option value="Passport">Passport</option>
												<option value="ID">ID Card</option>
											</select>
										</label>
										<label className="flex flex-col gap-1">
											<span className={labelClass}>Document Number *</span>
											<input
												type="text"
												name={`passenger-${i + 1}-document-number`}
												autoComplete="off"
												required
												value={pax.documentNumber}
												onChange={(e) =>
													handlePassengerChange(
														i,
														"documentNumber",
														e.target.value,
													)
												}
												className={fieldClass}
											/>
										</label>
										<label className="flex flex-col gap-1 md:col-span-2">
											<span className={labelClass}>Issuing Country *</span>
											<select
												name={`passenger-${i + 1}-issuing-country`}
												autoComplete="country"
												required
												value={pax.country}
												onChange={(e) =>
													handlePassengerChange(i, "country", e.target.value)
												}
												className={fieldClass}
											>
												{countries.map((c) => (
													<option key={`country-${c.iso2}`} value={c.iso2}>
														{lang === "es" ? c.nameES : c.nameEN}
													</option>
												))}
											</select>
										</label>
									</div>
								</div>
							))}
						</div>

						{/* Contact Info */}
						<div className="mb-8">
							<h3 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-[#1f2d29]">
								<span className="h-2 w-2 rounded-full bg-[#1f6c43]"></span>
								Contact Details
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<label className="flex flex-col gap-1">
									<span className={labelClass}>First Name *</span>
									<input
										type="text"
										name="contact-given-name"
										autoComplete="given-name"
										required
										placeholder="John"
										value={contact.firstname}
										onChange={(e) =>
											setContact({ ...contact, firstname: e.target.value })
										}
										className={fieldClass}
									/>
								</label>
								<label className="flex flex-col gap-1">
									<span className={labelClass}>Last Name *</span>
									<input
										type="text"
										name="contact-family-name"
										autoComplete="family-name"
										required
										placeholder="Doe"
										value={contact.lastname}
										onChange={(e) =>
											setContact({ ...contact, lastname: e.target.value })
										}
										className={fieldClass}
									/>
								</label>
								<label className="flex flex-col gap-1">
									<span className={labelClass}>Email Address *</span>
									<input
										type="email"
										name="contact-email"
										autoComplete="email"
										inputMode="email"
										required
										placeholder="john@example.com"
										value={contact.email}
										onChange={(e) =>
											setContact({ ...contact, email: e.target.value })
										}
										className={fieldClass}
									/>
								</label>
								<div className="flex flex-col md:flex-row gap-4">
									<label className="flex flex-col gap-1 w-full md:w-5/12">
										<span className={labelClass}>Country Code *</span>
										<select
											name="contact-phone-code"
											autoComplete="tel-country-code"
											required
											value={contact.phoneCode}
											onChange={(e) =>
												setContact({ ...contact, phoneCode: e.target.value })
											}
											className={fieldClass}
										>
											{countries
												.filter((c) => c.phoneCode)
												.map((c) => (
													<option
														key={`phone-${c.iso2}`}
														value={`+${c.phoneCode}`}
													>
														{lang === "es" ? c.nameES : c.nameEN} (+
														{c.phoneCode})
													</option>
												))}
										</select>
									</label>
									<label className="flex flex-col gap-1 flex-1">
										<span className={labelClass}>Phone *</span>
										<input
											type="tel"
											name="contact-phone"
											autoComplete="tel-national"
											inputMode="tel"
											required
											placeholder="123 456 7890"
											value={contact.phone}
											onChange={(e) =>
												setContact({ ...contact, phone: e.target.value })
											}
											className={fieldClass}
										/>
									</label>
								</div>
							</div>
						</div>

						{/* Terms */}
						<label className="mb-8 flex cursor-pointer items-start gap-3 rounded-sm border border-[#e7d7c8] bg-[#fffdf9] p-4">
							<input
								type="checkbox"
								name="acceptedTerms"
								required
								checked={acceptedTerms}
								onChange={(e) => setAcceptedTerms(e.target.checked)}
								className="mt-0.5 h-5 w-5 cursor-pointer rounded accent-[#1f6c43]"
							/>
							<span className="text-sm font-medium text-[#5f5349]">
								I have read and accept the{" "}
								<a
									href="/terms-and-conditions"
									className="font-bold text-[#1f6c43] hover:underline"
								>
									Terms and Conditions
								</a>{" "}
								and{" "}
								<a
									href="/booking-policies"
									className="font-bold text-[#1f6c43] hover:underline"
								>
									Booking Policies
								</a>
								.
							</span>
						</label>

						{/* Navigation */}
						<div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-[#eadfd3] pt-6 sm:flex-row sm:items-center">
							<button
								type="button"
								onClick={() => setStep(1)}
								className="flex min-h-12 items-center justify-center gap-2 rounded-sm border border-[#e7d7c8] px-5 font-semibold text-[#5f5349] transition-colors hover:bg-[#fff8ef] hover:text-[#1f2d29] sm:justify-start sm:border-0 sm:px-0"
							>
								<ArrowLeft className="w-4 h-4" />
								Back to Itinerary
							</button>
							<button
								type="button"
								onClick={() => {
									if (validateStep2()) setStep(3);
								}}
								className="flex min-h-12 items-center justify-center gap-2 rounded-sm bg-[#1f6c43] px-8 py-4 font-semibold text-white shadow-lg shadow-[#1f6c43]/20 transition-all hover:bg-[#185637] hover:shadow-xl hover:shadow-[#1f6c43]/25 active:scale-[0.98]"
							>
								Continue to Payment
								<ArrowRight className="w-5 h-5" />
							</button>
						</div>
					</div>
				)}

				{/* ================= STEP 3: PAYMENT ================= */}
				{step === 3 && (
					<div className="animate-in fade-in slide-in-from-right-4 grid duration-300 lg:grid-cols-[minmax(0,1fr)_360px]">
						{/* LEFT MAIN CONTENT */}
						<div className="w-full p-5 md:p-8">
							{/* Info Banner */}
							<div className="mb-6 flex items-start gap-4 rounded-sm border border-[#1f6c43]/15 bg-[#edf8f1] p-5">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
									<Shield className="h-5 w-5 text-[#1f6c43]" />
								</div>
								<div className="space-y-1 text-sm font-medium text-[#244237]">
									<p>
										You can make changes by writing to{" "}
										<strong className="text-[#1f6c43]">
											info@dreamy.tours
										</strong>
									</p>
									<p>PayPal charges an 8% fee for secure payment processing.</p>
								</div>
							</div>

							{/* Payment Method */}
							<h3 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-[#1f2d29]">
								<span className="h-2 w-2 rounded-full bg-[#1f6c43]"></span>
								Payment Method
							</h3>
							<div className="mb-8">
								<div className="flex cursor-pointer items-center justify-between rounded-sm border-2 border-[#1f6c43] bg-[#edf8f1] p-5 shadow-lg shadow-[#1f6c43]/10 transition-all">
									<div className="flex items-center gap-4">
										<div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#003087]">
											<span className="text-sm font-bold text-white">
												PayPal
											</span>
										</div>
										<div>
											<span className="font-bold text-[#1f2d29]">PayPal</span>
											<p className="text-xs text-gray-500">
												Secure payment • 8% fee applies
											</p>
										</div>
									</div>
									<div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1f6c43]">
										<Check className="h-4 w-4 text-white" />
									</div>
								</div>
							</div>

							{/* Payment Amount - The stars of the show */}
							<h3 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-[#1f2d29]">
								<span className="h-2 w-2 rounded-full bg-[#1f6c43]"></span>
								Payment Amount
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
								{/* Minimum Payment */}
								<button
									type="button"
									onClick={() => setPaymentOption("minimum")}
									aria-pressed={paymentOption === "minimum"}
									className={`relative flex min-h-[180px] cursor-pointer flex-col rounded-sm border-2 p-5 text-left transition-all duration-300 ${
										paymentOption === "minimum"
											? "border-[#1f6c43] bg-[#edf8f1] shadow-lg shadow-[#1f6c43]/10"
											: "border-[#e7d7c8] bg-white hover:border-[#1f6c43]/35 hover:shadow-md"
									}`}
								>
									{paymentOption === "minimum" && (
										<div className="absolute -top-2.5 left-4 rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-secondary-foreground">
											POPULAR
										</div>
									)}
									<div className="flex justify-between items-start mb-4">
										<div>
											<span className="text-sm font-bold text-[#1f2d29]">
												Pay Now
											</span>
											<p className="mt-0.5 text-[11px] font-medium text-[#5f5349]">
												Secure your booking
											</p>
										</div>
										<div
											className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
												paymentOption === "minimum"
													? "border-[#1f6c43] bg-[#1f6c43]"
													: "border-[#cbbdac]"
											}`}
										>
											{paymentOption === "minimum" && (
												<Check className="w-3 h-3 text-white" />
											)}
										</div>
									</div>
									<div className="flex-1 flex items-center justify-center py-2">
										<span
											className={`text-2xl font-black tracking-tight ${
												paymentOption === "minimum"
													? "text-[#1f6c43]"
													: "text-[#6f6258]"
											}`}
										>
											US${(totalPrice / 2).toFixed(2)}
										</span>
									</div>
									<div className="flex justify-between items-center pt-3 border-t border-gray-100">
										<span className="text-[11px] font-medium text-[#6f6258]">
											PayPal Fee (8%)
										</span>
										<span className="text-xs font-bold text-[#1f2d29]">
											+US${((totalPrice / 2) * 0.08).toFixed(2)}
										</span>
									</div>
								</button>

								{/* Total Payment */}
								<button
									type="button"
									onClick={() => setPaymentOption("total")}
									aria-pressed={paymentOption === "total"}
									className={`relative flex min-h-[180px] cursor-pointer flex-col rounded-sm border-2 p-5 text-left transition-all duration-300 ${
										paymentOption === "total"
											? "border-[#1f6c43] bg-[#edf8f1] shadow-lg shadow-[#1f6c43]/10"
											: "border-[#e7d7c8] bg-white hover:border-[#1f6c43]/35 hover:shadow-md"
									}`}
								>
									<div className="flex justify-between items-start mb-4">
										<div>
											<span className="text-sm font-bold text-[#1f2d29]">
												Pay Full
											</span>
											<p className="mt-0.5 text-[11px] font-medium text-[#5f5349]">
												Complete your payment
											</p>
										</div>
										<div
											className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
												paymentOption === "total"
													? "border-[#1f6c43] bg-[#1f6c43]"
													: "border-[#cbbdac]"
											}`}
										>
											{paymentOption === "total" && (
												<Check className="w-3 h-3 text-white" />
											)}
										</div>
									</div>
									<div className="flex-1 flex items-center justify-center py-2">
										<span
											className={`text-2xl font-black tracking-tight ${
												paymentOption === "total"
													? "text-[#1f6c43]"
													: "text-[#6f6258]"
											}`}
										>
											US${totalPrice.toFixed(2)}
										</span>
									</div>
									<div className="flex justify-between items-center pt-3 border-t border-gray-100">
										<span className="text-[11px] font-medium text-[#6f6258]">
											PayPal Fee (8%)
										</span>
										<span className="text-xs font-bold text-[#1f2d29]">
											+US${(totalPrice * 0.08).toFixed(2)}
										</span>
									</div>
								</button>
							</div>

							{/* Total to Pay */}
							<div className="mb-6 flex flex-col items-center justify-between gap-3 rounded-sm bg-[#1f2d29] p-4 md:flex-row md:p-5">
								<div className="flex items-center gap-2">
									<Lock className="w-4 h-4 text-white/70" />
									<span className="text-sm font-medium text-white/70">
										Total to pay today
									</span>
								</div>
								<div className="text-right">
									<span className="text-2xl md:text-3xl font-black text-white tracking-tight">
										US${(payAmount + paymentFee).toFixed(2)}
									</span>
								</div>
							</div>

							{/* Pay Button */}
							<div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
								<button
									type="button"
									onClick={() => setStep(2)}
									className="flex min-h-12 items-center justify-center gap-2 rounded-sm border border-[#e7d7c8] px-5 font-semibold text-[#5f5349] transition-colors hover:bg-[#fff8ef] hover:text-[#1f2d29] sm:justify-start sm:border-0 sm:px-0"
								>
									<ArrowLeft className="w-4 h-4" />
									Back to Passengers
								</button>
								<button
									type="button"
									onClick={handlePayNow}
									disabled={isSubmitting}
									className="flex min-h-12 items-center justify-center gap-2 rounded-sm bg-[#1f6c43] px-8 py-4 text-lg font-bold text-white shadow-xl shadow-[#1f6c43]/20 transition-all hover:bg-[#185637] hover:shadow-2xl hover:shadow-[#1f6c43]/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
								>
									{isSubmitting ? (
										<>
											<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
											Processing...
										</>
									) : (
										<>
											<Lock className="w-5 h-5" />
											Pay US${(payAmount + paymentFee).toFixed(2)}
										</>
									)}
								</button>
							</div>
						</div>

						{/* RIGHT SIDEBAR - Order Summary */}
						<div className="w-full border-t border-[#eadfd3] bg-[#fffdf9] p-6 lg:border-l lg:border-t-0">
							<h4 className="mb-5 text-sm font-bold uppercase tracking-widest text-secondary">
								Summary
							</h4>

							<div className="mb-5 space-y-2">
								<p className="line-clamp-2 text-base font-bold leading-tight text-[#1f2d29]">
									{tourName}
								</p>
								<p className="text-sm font-medium text-[#5f5349]">
									{travelDateStr} · {paxCount} Pax
								</p>
							</div>

							<div className="my-5 h-px bg-[#eadfd3]"></div>

							<div className="space-y-3">
								<div className="flex items-center justify-between text-base">
									<span className="font-medium text-[#6f6258]">
										Selected payment
									</span>
									<span className="font-bold text-[#1f2d29]">
										US${payAmount.toFixed(2)}
									</span>
								</div>
								<div className="flex items-center justify-between text-base">
									<span className="font-medium text-[#6f6258]">PayPal fee</span>
									<span className="font-bold text-[#1f2d29]">
										US${paymentFee.toFixed(2)}
									</span>
								</div>
								<div className="my-4 h-px bg-[#eadfd3]"></div>
								<div className="flex items-center justify-between rounded-sm bg-[#edf8f1] px-3 py-3">
									<span className="text-lg font-bold text-[#1f6c43]">
										Pay today
									</span>
									<span className="text-xl font-extrabold text-[#1f6c43]">
										US${(payAmount + paymentFee).toFixed(2)}
									</span>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
