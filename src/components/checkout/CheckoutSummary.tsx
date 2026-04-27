import React, { useEffect, useState } from "react";
import {
	Calendar,
	Users,
	AlertCircle,
	Check,
	ArrowLeft,
	ArrowRight,
	Shield,
	Lock,
} from "lucide-react";
import countriesData from "@/data/countries.json";

export default function CheckoutSummary() {
	const [cart, setCart] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [step, setStep] = useState(1);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// states for Passenger Step
	const [passengers, setPassengers] = useState<any[]>([]);
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
		if (savedCart) {
			try {
				const parsedCart = JSON.parse(savedCart);
				setCart(parsedCart);
				// Initialize passengers array based on count
				setPassengers(
					Array.from({ length: parsedCart.passengers || 1 }).map(() => ({
						name: "",
						lastname: "",
						gender: "Male",
						dob: "",
						documentType: "Passport",
						documentNumber: "",
						country: "US",
					})),
				);
			} catch (e) {
				console.error("Failed to parse cart", e);
			}
		}
		setLoading(false);
	}, []);

	// Clear error when user starts typing
	useEffect(() => {
		setError(null);
	}, [contact, passengers, acceptedTerms]);

	// Clear error when changing steps
	useEffect(() => {
		setError(null);
	}, [step]);

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
					href="/"
					className="px-8 py-3.5 bg-primary text-white font-semibold rounded-sm shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]"
				>
					Explorar Tours
				</a>
			</div>
		);
	}

	const handlePassengerChange = (
		index: number,
		field: string,
		value: string,
	) => {
		const newPax = [...passengers];
		newPax[index] = { ...newPax[index], [field]: value };
		setPassengers(newPax);
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
						amountPaid: payAmount,
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
				window.localStorage.removeItem("bookingCart");
				window.location.href = data.redirectUrl;
			} else {
				alert("Error Processing Checkout: " + (data.error || "Unknown"));
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
	const lang = cart.lang || "en";

	let startDateStr = "TBD";
	if (date) {
		try {
			startDateStr = new Date(date).toLocaleDateString(
				lang === "es" ? "es-ES" : "en-US",
				{
					weekday: "long",
					year: "numeric",
					month: "long",
					day: "numeric",
				},
			);
		} catch (e) {
			/* ignore */
		}
	}

	const paymentFee =
		paymentOption === "total" ? totalPrice * 0.08 : (totalPrice / 2) * 0.08;
	const payAmount = paymentOption === "total" ? totalPrice : totalPrice / 2;

	return (
		<div className="w-full max-w-8xl mx-auto p-4 md:p-8 font-sans">
			{/* MAIN CONTAINER */}
			<div className="bg-white rounded-sm shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
				{/* STEPS HEADER - Minimal and clean */}
				<div className="bg-gray-50/50 px-6 md:px-10 py-6 border-b border-gray-100">
					<div className="flex flex-col md:flex-row justify-between items-center gap-6">
						{/* Step 1 */}
						<button
							onClick={() => setStep(1)}
							className="flex items-center gap-3 group"
						>
							<div
								className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
									step >= 1
										? "bg-primary text-white shadow-lg shadow-primary/25"
										: "bg-gray-200 text-gray-400"
								}`}
							>
								{step > 1 ? <Check size={18} /> : "1"}
							</div>
							<span
								className={`font-medium text-sm ${step >= 1 ? "text-gray-800" : "text-gray-400"}`}
							>
								Itinerary
							</span>
						</button>

						{/* Connector */}
						<div className="hidden md:block w-16 h-px bg-gray-200"></div>

						{/* Step 2 */}
						<button
							onClick={() => step > 1 && setStep(2)}
							disabled={step <= 1}
							className={`flex items-center gap-3 ${step > 1 ? "group cursor-pointer" : "cursor-default"}`}
						>
							<div
								className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
									step >= 2
										? "bg-primary text-white shadow-lg shadow-primary/25"
										: "bg-gray-200 text-gray-400"
								}`}
							>
								{step > 2 ? <Check size={18} /> : "2"}
							</div>
							<span
								className={`font-medium text-sm ${step >= 2 ? "text-gray-800" : "text-gray-400"}`}
							>
								Passengers
							</span>
						</button>

						{/* Connector */}
						<div className="hidden md:block w-16 h-px bg-gray-200"></div>

						{/* Step 3 */}
						<div className="flex items-center gap-3">
							<div
								className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
									step >= 3
										? "bg-primary text-white shadow-lg shadow-primary/25"
										: "bg-gray-200 text-gray-400"
								}`}
							>
								3
							</div>
							<span
								className={`font-medium text-sm ${step >= 3 ? "text-gray-800" : "text-gray-400"}`}
							>
								Payment
							</span>
						</div>
					</div>
				</div>

				{/* ================= STEP 1: ITINERARY SUMMARY ================= */}
				{step === 1 && (
					<div className="p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
						<div className="flex items-start justify-between mb-8">
							<div>
								<h2 className="text-xs font-bold text-primary tracking-widest uppercase mb-2">
									Booking Summary
								</h2>
								<h3 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
									{tourName}
								</h3>
							</div>
						</div>

						{/* Tour Details Card */}
						<div className="bg-gray-50/50 rounded-sm p-6 mb-8 border border-gray-100">
							<div className="flex flex-col md:flex-row gap-8 items-center">
								{/* Date */}
								<div className="flex items-center gap-3">
									<div className="w-12 h-12 bg-primary/10 rounded-sm flex items-center justify-center">
										<Calendar className="w-6 h-6 text-primary" />
									</div>
									<div>
										<p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
											Start Date
										</p>
										<p className="text-gray-900 font-semibold">
											{startDateStr}
										</p>
									</div>
								</div>

								<div className="hidden md:block w-px h-12 bg-gray-200"></div>

								{/* Passengers */}
								<div className="flex items-center gap-3">
									<div className="w-12 h-12 bg-primary/10 rounded-sm flex items-center justify-center">
										<Users className="w-6 h-6 text-primary" />
									</div>
									<div>
										<p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
											Travelers
										</p>
										<p className="text-gray-900 font-semibold">
											{paxCount} {paxCount === 1 ? "Person" : "People"}
										</p>
									</div>
								</div>

								<div className="hidden md:block w-px h-12 bg-gray-200"></div>

								{/* Price per person */}
								<div className="flex items-center gap-3">
									<div className="w-12 h-12 bg-primary/10 rounded-sm flex items-center justify-center">
										<span className="text-primary font-bold">$</span>
									</div>
									<div>
										<p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
											Per Person
										</p>
										<p className="text-gray-900 font-semibold">
											US${pricePerPerson.toFixed(2)}
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* Total Box */}
						<div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 md:p-5 bg-primary/5 rounded-sm border border-primary/10">
							<div className="flex items-center gap-3">
								<div className="w-3 h-3 bg-primary rounded-full"></div>
								<span className="text-gray-600 font-medium">
									Total Tour Price
								</span>
							</div>
							<div className="text-right">
								<span className="text-2xl md:text-3xl font-black text-primary tracking-tight">
									US${totalPrice.toFixed(2)}
								</span>
							</div>
						</div>

						{/* Continue Button */}
						<div className="flex justify-end mt-8">
							<button
								onClick={() => setStep(2)}
								className="group flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-4 rounded-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]"
							>
								Continue
								<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
							</button>
						</div>
					</div>
				)}

				{/* ================= STEP 2: PASSENGER INFO ================= */}
				{step === 2 && (
					<div className="p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
						{/* Header */}
						<div className="flex items-center gap-3 mb-6">
							<div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
								<Users className="w-5 h-5 text-primary" />
							</div>
							<div>
								<h2 className="text-xl font-bold text-gray-900">
									Traveler Information
								</h2>
								<p className="text-gray-500 text-sm">
									Please fill in the details for all travelers
								</p>
							</div>
						</div>

						{/* Alert */}
						<div className="bg-amber-50/50 border border-amber-200/50 rounded-sm p-4 mb-6 flex gap-3">
							<AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
							<p className="text-sm text-amber-800">
								Your data and passport number must match exactly as they appear
								in your passport.
							</p>
						</div>

						{/* Error Banner */}
						{error && (
							<div className="bg-red-50/80 border border-red-200/50 rounded-sm p-4 mb-6 flex gap-3 animate-in fade-in slide-in-from-top-2">
								<AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
								<p className="text-sm text-red-700">{error}</p>
							</div>
						)}

						{/* Passengers */}
						<div className="space-y-6 mb-10">
							{passengers.map((pax, i) => (
								<div
									key={i}
									className="bg-gray-50/30 rounded-sm p-5 border border-gray-100"
								>
									<div className="flex items-center gap-2 mb-4">
										<div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
											{i + 1}
										</div>
										<span className="font-semibold text-gray-800">
											Traveler {i + 1}
										</span>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
										<label className="flex flex-col gap-1">
											<span className="text-xs text-gray-500 font-medium">
												First Name *
											</span>
											<input
												type="text"
												value={pax.name}
												onChange={(e) =>
													handlePassengerChange(i, "name", e.target.value)
												}
												className="px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
											/>
										</label>
										<label className="flex flex-col gap-1">
											<span className="text-xs text-gray-500 font-medium">
												Last Name *
											</span>
											<input
												type="text"
												value={pax.lastname}
												onChange={(e) =>
													handlePassengerChange(i, "lastname", e.target.value)
												}
												className="px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
											/>
										</label>
										<label className="flex flex-col gap-1">
											<span className="text-xs text-gray-500 font-medium">
												Gender *
											</span>
											<select
												value={pax.gender}
												onChange={(e) =>
													handlePassengerChange(i, "gender", e.target.value)
												}
												className="px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm bg-white"
											>
												<option value="Male">Male</option>
												<option value="Female">Female</option>
											</select>
										</label>
										<label className="flex flex-col gap-1">
											<span className="text-xs text-gray-500 font-medium">
												Date of Birth *
											</span>
											<input
												type="date"
												value={pax.dob}
												onChange={(e) =>
													handlePassengerChange(i, "dob", e.target.value)
												}
												className="px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
											/>
										</label>
										<label className="flex flex-col gap-1">
											<span className="text-xs text-gray-500 font-medium">
												Document Type *
											</span>
											<select
												value={pax.documentType}
												onChange={(e) =>
													handlePassengerChange(
														i,
														"documentType",
														e.target.value,
													)
												}
												className="px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm bg-white"
											>
												<option value="Passport">Passport</option>
												<option value="ID">ID Card</option>
											</select>
										</label>
										<label className="flex flex-col gap-1">
											<span className="text-xs text-gray-500 font-medium">
												Document Number *
											</span>
											<input
												type="text"
												value={pax.documentNumber}
												onChange={(e) =>
													handlePassengerChange(
														i,
														"documentNumber",
														e.target.value,
													)
												}
												className="px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
											/>
										</label>
										<label className="flex flex-col gap-1 md:col-span-2">
											<span className="text-xs text-gray-500 font-medium">
												Issuing Country *
											</span>
											<select
												value={pax.country}
												onChange={(e) =>
													handlePassengerChange(i, "country", e.target.value)
												}
												className="px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm bg-white"
											>
												{countriesData.map((c: any) => (
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
							<h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
								<span className="w-2 h-2 bg-primary rounded-full"></span>
								Contact Details
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<label className="flex flex-col gap-1">
									<span className="text-xs text-gray-500 font-medium">
										First Name *
									</span>
									<input
										type="text"
										placeholder="John"
										value={contact.firstname}
										onChange={(e) =>
											setContact({ ...contact, firstname: e.target.value })
										}
										className="px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
									/>
								</label>
								<label className="flex flex-col gap-1">
									<span className="text-xs text-gray-500 font-medium">
										Last Name *
									</span>
									<input
										type="text"
										placeholder="Doe"
										value={contact.lastname}
										onChange={(e) =>
											setContact({ ...contact, lastname: e.target.value })
										}
										className="px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
									/>
								</label>
								<label className="flex flex-col gap-1">
									<span className="text-xs text-gray-500 font-medium">
										Email Address *
									</span>
									<input
										type="email"
										placeholder="john@example.com"
										value={contact.email}
										onChange={(e) =>
											setContact({ ...contact, email: e.target.value })
										}
										className="px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
									/>
								</label>
								<div className="flex flex-col md:flex-row gap-4">
									<label className="flex flex-col gap-1 w-full md:w-5/12">
										<span className="text-xs text-gray-500 font-medium">
											Country Code *
										</span>
										<select
											value={contact.phoneCode}
											onChange={(e) =>
												setContact({ ...contact, phoneCode: e.target.value })
											}
											className="px-3 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm bg-white"
										>
											{countriesData
												.filter((c: any) => c.phoneCode)
												.map((c: any) => (
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
										<span className="text-xs text-gray-500 font-medium">
											Phone *
										</span>
										<input
											type="tel"
											placeholder="123 456 7890"
											value={contact.phone}
											onChange={(e) =>
												setContact({ ...contact, phone: e.target.value })
											}
											className="px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
										/>
									</label>
								</div>
							</div>
						</div>

						{/* Terms */}
						<label className="flex items-start gap-3 mb-8 cursor-pointer p-4 bg-gray-50/30 rounded-sm border border-gray-100">
							<input
								type="checkbox"
								checked={acceptedTerms}
								onChange={(e) => setAcceptedTerms(e.target.checked)}
								className="w-5 h-5 accent-primary cursor-pointer mt-0.5 rounded"
							/>
							<span className="text-gray-600 text-sm">
								I have read and accept the{" "}
								<a
									href="#"
									className="text-primary font-semibold hover:underline"
								>
									Terms and Conditions
								</a>{" "}
								and{" "}
								<a
									href="#"
									className="text-primary font-semibold hover:underline"
								>
									Booking Policies
								</a>
								.
							</span>
						</label>

						{/* Navigation */}
						<div className="flex justify-between items-center pt-6 border-t border-gray-100">
							<button
								onClick={() => setStep(1)}
								className="flex items-center gap-2 text-gray-500 font-medium hover:text-gray-800 transition-colors"
							>
								<ArrowLeft className="w-4 h-4" />
								Back to Itinerary
							</button>
							<button
								onClick={() => {
									if (validateStep2()) setStep(3);
								}}
								className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-4 rounded-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]"
							>
								Continue to Payment
								<ArrowRight className="w-5 h-5" />
							</button>
						</div>
					</div>
				)}

				{/* ================= STEP 3: PAYMENT ================= */}
				{step === 3 && (
					<div className="flex flex-col lg:flex-row animate-in fade-in slide-in-from-right-4 duration-300">
						{/* LEFT MAIN CONTENT - 40% */}
						<div className="w-full lg:w-[40%] p-4 md:p-6">
							{/* Info Banner */}
							<div className="bg-primary/5 border border-primary/10 rounded-sm p-5 mb-6 flex gap-4 items-start">
								<div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
									<Shield className="w-5 h-5 text-primary" />
								</div>
								<div className="text-sm text-gray-600 space-y-1">
									<p>
										You can make changes by writing to{" "}
										<strong className="text-primary">info@dreamy.tours</strong>
									</p>
									<p>PayPal charges an 8% fee for secure payment processing.</p>
								</div>
							</div>

							{/* Payment Method */}
							<h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
								<span className="w-2 h-2 bg-primary rounded-full"></span>
								Payment Method
							</h3>
							<div className="mb-8">
								<label
									className={`flex items-center justify-between p-5 rounded-sm border-2 cursor-pointer transition-all ${
										true // Always selected since only PayPal
											? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
											: "border-gray-200 hover:border-primary/50"
									}`}
								>
									<div className="flex items-center gap-4">
										<div className="w-12 h-12 bg-[#003087] rounded-lg flex items-center justify-center">
											<span className="text-white font-bold text-sm">
												PayPal
											</span>
										</div>
										<div>
											<span className="font-semibold text-gray-900">
												PayPal
											</span>
											<p className="text-xs text-gray-500">
												Secure payment • 8% fee applies
											</p>
										</div>
									</div>
									<div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
										<Check className="w-4 h-4 text-white" />
									</div>
								</label>
							</div>

							{/* Payment Amount - The stars of the show */}
							<h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
								<span className="w-2 h-2 bg-primary rounded-full"></span>
								Payment Amount
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
								{/* Minimum Payment */}
								<label
									onClick={() => setPaymentOption("minimum")}
									className={`relative flex flex-col min-h-[180px] p-5 rounded-sm border-2 cursor-pointer transition-all duration-300 ${
										paymentOption === "minimum"
											? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
											: "border-gray-200 hover:border-primary/30 hover:shadow-md"
									}`}
								>
									{paymentOption === "minimum" && (
										<div className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-primary text-white text-[10px] font-bold rounded-full">
											POPULAR
										</div>
									)}
									<div className="flex justify-between items-start mb-4">
										<div>
											<span className="font-semibold text-gray-900 text-sm">
												Pay Now
											</span>
											<p className="text-[11px] text-gray-500 mt-0.5">
												Secure your booking
											</p>
										</div>
										<div
											className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
												paymentOption === "minimum"
													? "border-primary bg-primary"
													: "border-gray-300"
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
													? "text-primary"
													: "text-gray-400"
											}`}
										>
											US${(totalPrice / 2).toFixed(2)}
										</span>
									</div>
									<div className="flex justify-between items-center pt-3 border-t border-gray-100">
										<span className="text-[11px] text-gray-500">
											PayPal Fee (8%)
										</span>
										<span className="text-xs font-medium text-gray-700">
											+US${((totalPrice / 2) * 0.08).toFixed(2)}
										</span>
									</div>
								</label>

								{/* Total Payment */}
								<label
									onClick={() => setPaymentOption("total")}
									className={`relative flex flex-col min-h-[180px] p-5 rounded-sm border-2 cursor-pointer transition-all duration-300 ${
										paymentOption === "total"
											? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
											: "border-gray-200 hover:border-primary/30 hover:shadow-md"
									}`}
								>
									<div className="flex justify-between items-start mb-4">
										<div>
											<span className="font-semibold text-gray-900 text-sm">
												Pay Full
											</span>
											<p className="text-[11px] text-gray-500 mt-0.5">
												Complete your payment
											</p>
										</div>
										<div
											className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
												paymentOption === "total"
													? "border-primary bg-primary"
													: "border-gray-300"
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
													? "text-primary"
													: "text-gray-400"
											}`}
										>
											US${totalPrice.toFixed(2)}
										</span>
									</div>
									<div className="flex justify-between items-center pt-3 border-t border-gray-100">
										<span className="text-[11px] text-gray-500">
											PayPal Fee (8%)
										</span>
										<span className="text-xs font-medium text-gray-700">
											+US${(totalPrice * 0.08).toFixed(2)}
										</span>
									</div>
								</label>
							</div>

							{/* Total to Pay */}
							<div className="bg-gray-900 rounded-sm p-4 md:p-5 mb-6 flex flex-col md:flex-row justify-between items-center gap-3">
								<div className="flex items-center gap-2">
									<Lock className="w-4 h-4 text-white/70" />
									<span className="text-white/70 text-sm font-medium">
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
							<div className="flex justify-between items-center">
								<button
									onClick={() => setStep(2)}
									className="flex items-center gap-2 text-gray-500 font-medium hover:text-gray-800 transition-colors"
								>
									<ArrowLeft className="w-4 h-4" />
									Back to Passengers
								</button>
								<button
									onClick={handlePayNow}
									disabled={isSubmitting}
									className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-4 px-10 rounded-sm shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-lg"
								>
									{isSubmitting ? (
										<>
											<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
											Processing...
										</>
									) : (
										<>
											<Lock className="w-5 h-5" />
											Pay Now
										</>
									)}
								</button>
							</div>
						</div>

						{/* RIGHT SIDEBAR - Order Summary */}
						<div className="w-full lg:flex-1 bg-gray-50/50 border-t lg:border-t-0 lg:border-l border-gray-100 p-6">
							<h4 className="text-sm font-bold text-primary tracking-widest uppercase mb-5">
								Summary
							</h4>

							<div className="space-y-2 mb-5">
								<p className="text-gray-900 font-semibold text-base leading-tight line-clamp-2">
									{tourName}
								</p>
								<p className="text-sm text-gray-500">
									{startDateStr} · {paxCount} Pax
								</p>
							</div>

							<div className="h-px bg-gray-200 my-5"></div>

							<div className="space-y-3">
								<div className="flex justify-between items-center text-base">
									<span className="text-gray-500">Total</span>
									<span className="text-gray-900 font-semibold">
										US${totalPrice.toFixed(2)}
									</span>
								</div>
								<div className="flex justify-between items-center text-base">
									<span className="text-gray-500">Fee</span>
									<span className="text-gray-900 font-semibold">
										US${paymentFee.toFixed(2)}
									</span>
								</div>
								<div className="h-px bg-gray-200 my-4"></div>
								<div className="flex justify-between items-center">
									<span className="text-primary font-bold text-lg">Total</span>
									<span className="text-primary font-bold text-xl">
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
