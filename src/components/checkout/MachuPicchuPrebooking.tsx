import {
	ArrowLeft,
	ArrowRight,
	CalendarDays,
	Check,
	CheckCircle2,
	Clock3,
	FileCheck2,
	Loader2,
	Mountain,
	Send,
	Users,
} from "lucide-react";
import { type SubmitEvent, useEffect, useRef, useState } from "react";
import { countries } from "@/data/countries";
import {
	MACHU_PICCHU_ROUTES,
	type MachuPicchuSelection,
	type MachuPicchuTraveler,
	type MachuPicchuPrebooking as Payload,
	validateMachuPicchuPrebooking,
	validateMachuPicchuSelection,
} from "@/lib/machuPicchuPrebooking";
import {
	getDateKeyInTimeZone,
	MAX_PASSENGERS_PER_BOOKING,
} from "@/lib/prebooking";

type TravelerDraft = MachuPicchuTraveler & { id: string };
const emptyTraveler = (): TravelerDraft => ({
	id: crypto.randomUUID(),
	name: "",
	lastname: "",
	dob: "",
	country: "",
	documentType: "passport",
	documentNumber: "",
});
const fieldClass =
	"mt-1.5 h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-[#007020] focus:ring-2 focus:ring-[#007020]/15";
const primary =
	"inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#B71532] px-5 py-3 text-sm font-semibold text-white hover:bg-[#98112a] disabled:cursor-wait disabled:opacity-60";
const secondary =
	"inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50";

export default function MachuPicchuPrebooking() {
	const [selection, setSelection] = useState<MachuPicchuSelection | null>(null);
	const [loaded, setLoaded] = useState(false);
	const [step, setStep] = useState(0);
	const [travelers, setTravelers] = useState<TravelerDraft[]>([
		emptyTraveler(),
	]);
	const [contact, setContact] = useState({ email: "", phone: "" });
	const [preference, setPreference] = useState<Payload["preference"]>("advice");
	const [acceptedTerms, setAcceptedTerms] = useState(false);
	const [error, setError] = useState("");
	const [sending, setSending] = useState(false);
	const [reference, setReference] = useState("");
	const requestId = useRef("");
	const lastRequest = useRef("");
	const heading = useRef<HTMLHeadingElement>(null);
	useEffect(() => {
		try {
			const value = JSON.parse(
				sessionStorage.getItem("machuPicchuSelection") || "null",
			);
			if (validateMachuPicchuSelection(value)) setSelection(value);
		} catch {
			/* Missing or expired selection. */
		}
		requestId.current = crypto.randomUUID();
		setLoaded(true);
	}, []);
	function goTo(next: number) {
		setStep(next);
		setError("");
		requestAnimationFrame(() => {
			heading.current?.focus();
			heading.current?.scrollIntoView({ block: "start", behavior: "smooth" });
		});
	}
	function updateTraveler(
		index: number,
		key: keyof MachuPicchuTraveler,
		value: string,
	) {
		setTravelers((current) =>
			current.map((traveler, i) =>
				i === index ? { ...traveler, [key]: value } : traveler,
			),
		);
	}
	function payload(): Payload {
		return {
			requestId: requestId.current,
			selection: selection as MachuPicchuSelection,
			travelers,
			contact,
			preference,
			acceptedTerms,
		};
	}
	async function submit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		if (step === 2) {
			const fingerprint = JSON.stringify({
				selection,
				travelers,
				contact,
				preference,
				acceptedTerms,
			});
			if (lastRequest.current !== fingerprint) {
				requestId.current = crypto.randomUUID();
				lastRequest.current = fingerprint;
			}
		}
		const data = payload();
		const validation = validateMachuPicchuPrebooking({
			...data,
			acceptedTerms: step === 1 ? true : acceptedTerms,
		});
		if (validation) {
			setError(validation);
			return;
		}
		if (step === 1) {
			goTo(2);
			return;
		}
		if (sending || reference) return;
		setSending(true);
		setError("");
		try {
			const response = await fetch("/api/machu-picchu-prebooking", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
				signal: AbortSignal.timeout(20000),
			});
			const result = await response.json();
			if (
				!response.ok ||
				result.status !== "pending_review" ||
				typeof result.reference !== "string"
			)
				throw new Error(result.error || "No pudimos enviar la solicitud.");
			setReference(result.reference);
			sessionStorage.removeItem("machuPicchuSelection");
			setTravelers([emptyTraveler()]);
			setContact({ email: "", phone: "" });
		} catch (failure) {
			setError(
				failure instanceof Error && failure.name !== "TimeoutError"
					? failure.message
					: "El envío tardó demasiado. Vuelve a intentarlo; tus datos siguen en pantalla.",
			);
		} finally {
			setSending(false);
		}
	}
	if (!loaded)
		return (
			<p className="py-12 text-center text-gray-500">Preparando tu visita…</p>
		);
	if (reference)
		return (
			<div
				className="mx-auto max-w-xl rounded-2xl border border-[#007020]/15 bg-white p-8 text-center sm:p-12"
				role="status"
			>
				<CheckCircle2 className="mx-auto mb-5 text-[#007020]" size={48} />
				<p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#007020]">
					Solicitud enviada
				</p>
				<h1 className="mb-4 text-3xl font-bold text-gray-900">
					Tu viaje está un paso más cerca
				</h1>
				<p className="text-sm leading-7 text-gray-600">
					El equipo de Dreamy Tours revisará tu fecha, circuito y horario y se
					comunicará contigo para confirmar disponibilidad y precio.
				</p>
				<p className="my-6 rounded-lg bg-gray-50 p-4 font-semibold text-gray-800">
					Referencia: {reference}
				</p>
				<p className="mb-6 text-xs text-gray-500">
					Es una pre-reserva pendiente de revisión. No garantiza cupos y no se
					ha realizado ningún cobro.
				</p>
				<a href="/es/disponibilidad-machu-picchu/" className={primary}>
					Volver al calendario
				</a>
			</div>
		);
	if (!selection)
		return (
			<div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-10 text-center">
				<CalendarDays className="mx-auto mb-4 text-[#007020]" size={32} />
				<h1 className="mb-3 text-2xl font-bold">Primero, elige tu visita</h1>
				<p className="mb-6 text-sm text-gray-500">
					Selecciona una fecha, circuito y horario en el calendario para
					comenzar.
				</p>
				<a href="/es/disponibilidad-machu-picchu/" className={primary}>
					Elegir mi visita
				</a>
			</div>
		);
	const date = new Date(`${selection.date}T12:00:00Z`).toLocaleDateString(
		"es-PE",
		{
			day: "numeric",
			month: "long",
			year: "numeric",
			timeZone: "America/Lima",
		},
	);
	return (
		<div>
			<a
				href="/es/disponibilidad-machu-picchu/"
				className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#007020]"
			>
				<ArrowLeft size={15} />
				Volver al calendario
			</a>
			<p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#007020]">
				Machu Picchu · Tu próxima aventura
			</p>
			<h1 className="mb-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
				Prepara tu pre-reserva
			</h1>
			<p className="mb-8 text-sm text-gray-500">
				Tu visita, tus viajeros y una solicitud para nuestro equipo. Sin cobros
				en esta página.
			</p>
			<ol
				className="mb-8 grid grid-cols-3 gap-2 rounded-xl border border-gray-200 bg-white p-3 sm:gap-4 sm:p-4"
				aria-label="Pasos de pre-reserva"
			>
				{["Tu visita", "Viajeros", "Pre-reserva"].map((label, index) => (
					<li
						key={label}
						aria-current={step === index ? "step" : undefined}
						className={`flex items-center gap-2 text-xs font-semibold sm:text-sm ${step === index ? "text-[#B71532]" : index < step ? "text-[#007020]" : "text-gray-400"}`}
					>
						<span
							className={`grid size-7 shrink-0 place-items-center rounded-full ${step === index ? "bg-[#fbeaed]" : index < step ? "bg-[#e6f2e8]" : "bg-gray-100"}`}
						>
							{index < step ? <Check size={14} /> : index + 1}
						</span>
						{label}
					</li>
				))}
			</ol>
			<div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
				<section
					className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8"
					aria-labelledby="mp-booking-step-title"
				>
					<h2
						id="mp-booking-step-title"
						ref={heading}
						tabIndex={-1}
						className="mb-2 scroll-mt-8 text-xl font-bold text-gray-900 outline-none"
					>
						{
							[
								"Una visita para recordar",
								"¿Quiénes te acompañan?",
								"Todo listo para solicitar tu visita",
							][step]
						}
					</h2>
					{step === 0 ? (
						<>
							<p className="mb-6 text-sm text-gray-500">
								Revisa tu selección y dinos cuántos viajeros serán.
							</p>
							<div className="mb-6 grid gap-4 rounded-xl bg-[#007020]/5 p-5 sm:grid-cols-2">
								{[
									["Fecha de visita", date],
									["Horario de ingreso", `${selection.time} h · Perú`],
									["Circuito", MACHU_PICCHU_ROUTES[selection.route]],
									["Ruta", selection.route],
								].map(([label, value]) => (
									<div key={label}>
										<p className="mb-1 text-xs text-gray-500">{label}</p>
										<p className="text-sm font-semibold text-gray-900">
											{value}
										</p>
									</div>
								))}
							</div>
							<label
								htmlFor="mp-booking-count"
								className="text-sm font-medium text-gray-700"
							>
								Número de viajeros
							</label>
							<select
								id="mp-booking-count"
								className={fieldClass}
								value={travelers.length}
								onChange={(event) => {
									const count = Number(event.target.value);
									setTravelers((current) =>
										Array.from(
											{ length: count },
											(_, i) => current[i] || emptyTraveler(),
										),
									);
								}}
							>
								{Array.from(
									{ length: MAX_PASSENGERS_PER_BOOKING },
									(_, i) => i + 1,
								).map((count) => (
									<option key={count} value={count}>
										{count} {count === 1 ? "viajero" : "viajeros"}
									</option>
								))}
							</select>
							<p className="my-5 rounded-lg border border-amber-100 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
								La fecha y el horario son una preferencia de visita. Los cupos
								del calendario son de demostración; un agente verificará
								disponibilidad y precio antes de confirmar.
							</p>
							<button type="button" className={primary} onClick={() => goTo(1)}>
								Continuar a viajeros
								<ArrowRight size={16} />
							</button>
						</>
					) : (
						<form onSubmit={submit}>
							{step === 1 ? (
								<>
									<p className="mb-6 text-sm leading-6 text-gray-500">
										Escribe los datos tal como aparecen en el documento. El
										primer viajero será el titular y debe tener al menos 18
										años.
									</p>
									{travelers.map((traveler, index) => (
										<fieldset
											key={traveler.id}
											className="mb-6 rounded-xl border border-gray-200 p-4 sm:p-5"
										>
											<legend className="px-2 text-sm font-semibold text-[#007020]">
												Viajero {index + 1}
												{index === 0 ? " · Titular" : ""}
											</legend>
											<div className="grid gap-4 sm:grid-cols-2">
												{(
													[
														["name", "Nombres", "text", "given-name"],
														["lastname", "Apellidos", "text", "family-name"],
														["dob", "Fecha de nacimiento", "date", "bday"],
													] as const
												).map(([key, label, type, autoComplete]) => (
													<label
														key={key}
														className="text-xs font-medium text-gray-600"
													>
														{label}
														<input
															required
															type={type}
															max={
																type === "date"
																	? getDateKeyInTimeZone()
																	: undefined
															}
															maxLength={100}
															value={traveler[key]}
															autoComplete={`section-traveler${index + 1} ${autoComplete}`}
															className={fieldClass}
															onChange={(event) =>
																updateTraveler(index, key, event.target.value)
															}
														/>
													</label>
												))}
												<label className="text-xs font-medium text-gray-600">
													País emisor
													<select
														required
														className={fieldClass}
														value={traveler.country}
														onChange={(event) =>
															updateTraveler(
																index,
																"country",
																event.target.value,
															)
														}
													>
														<option value="">Selecciona un país</option>
														{countries.map((country) => (
															<option key={country.iso2} value={country.iso2}>
																{country.nameES}
															</option>
														))}
													</select>
												</label>
												<label className="text-xs font-medium text-gray-600">
													Tipo de documento
													<select
														className={fieldClass}
														value={traveler.documentType}
														onChange={(event) =>
															updateTraveler(
																index,
																"documentType",
																event.target.value,
															)
														}
													>
														<option value="passport">Pasaporte</option>
														<option value="id">Documento de identidad</option>
													</select>
												</label>
												<label className="text-xs font-medium text-gray-600">
													Número de documento
													<input
														required
														maxLength={30}
														className={fieldClass}
														value={traveler.documentNumber}
														onChange={(event) =>
															updateTraveler(
																index,
																"documentNumber",
																event.target.value,
															)
														}
													/>
												</label>
											</div>
										</fieldset>
									))}
									<div className="mb-6">
										<h3 className="mb-4 text-sm font-semibold">
											Contacto del titular
										</h3>
										<div className="grid gap-4 sm:grid-cols-2">
											<label className="text-xs font-medium text-gray-600">
												Correo electrónico
												<input
													type="email"
													autoComplete="email"
													required
													maxLength={254}
													className={fieldClass}
													value={contact.email}
													onChange={(event) =>
														setContact({
															...contact,
															email: event.target.value,
														})
													}
												/>
											</label>
											<label className="text-xs font-medium text-gray-600">
												Teléfono con código de país
												<input
													type="tel"
													autoComplete="tel"
													required
													maxLength={30}
													placeholder="+51 987 654 321"
													className={fieldClass}
													value={contact.phone}
													onChange={(event) =>
														setContact({
															...contact,
															phone: event.target.value,
														})
													}
												/>
											</label>
										</div>
									</div>
								</>
							) : (
								<>
									<p className="mb-6 text-sm leading-6 text-gray-500">
										Enviaremos tu solicitud en PDF al equipo de reservas. Te
										contactaremos para revisar disponibilidad, precio y los
										siguientes pasos.
									</p>
									<div className="mb-6 rounded-xl border border-[#007020]/15 bg-[#007020]/5 p-5">
										<FileCheck2 size={24} className="mb-3 text-[#007020]" />
										<p className="text-sm font-semibold text-gray-900">
											Una solicitud, sin compromiso de pago
										</p>
										<p className="mt-2 text-xs leading-6 text-gray-600">
											La pre-reserva no bloquea cupos ni emite boletos. El
											precio está pendiente de cotización y el pago se coordina
											después de la revisión del equipo.
										</p>
									</div>
									<fieldset className="mb-6">
										<legend className="mb-3 text-sm font-semibold">
											¿Cómo prefieres pagar después?
										</legend>
										<div className="grid gap-2">
											{(
												[
													[
														"advice",
														"Prefiero asesoría",
														"Quiero conocer la cotización antes de decidir.",
													],
													[
														"minimum",
														"Adelanto del 50%",
														"Preferencia sujeta a las condiciones de la cotización.",
													],
													[
														"total",
														"Pago total",
														"Después de confirmar disponibilidad y precio.",
													],
												] as const
											).map(([value, label, hint]) => (
												<label
													key={value}
													className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${preference === value ? "border-[#007020] bg-[#007020]/5" : "border-gray-200"}`}
												>
													<input
														type="radio"
														name="mp-preference"
														value={value}
														checked={preference === value}
														onChange={() => setPreference(value)}
														className="mt-1 accent-[#007020]"
													/>
													<span>
														<strong className="block text-sm font-semibold">
															{label}
														</strong>
														<span className="mt-1 block text-xs text-gray-500">
															{hint}
														</span>
													</span>
												</label>
											))}
										</div>
									</fieldset>
									<label className="mb-6 flex items-start gap-3 text-xs leading-6 text-gray-600">
										<input
											type="checkbox"
											required
											checked={acceptedTerms}
											onChange={(event) =>
												setAcceptedTerms(event.target.checked)
											}
											className="mt-1.5 accent-[#007020]"
										/>
										<span>
											Acepto los{" "}
											<a
												href="/es/terminos-condiciones"
												target="_blank"
												rel="noreferrer"
												className="underline"
											>
												términos y condiciones
											</a>{" "}
											y autorizo el uso de mis datos para gestionar esta
											solicitud de pre-reserva.
										</span>
									</label>
								</>
							)}
							{error && (
								<p
									role="alert"
									className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700"
								>
									{error}
								</p>
							)}
							<div className="flex flex-wrap justify-between gap-3">
								<button
									type="button"
									disabled={sending}
									className={secondary}
									onClick={() => goTo(step - 1)}
								>
									<ArrowLeft size={15} />
									Volver
								</button>
								<button type="submit" disabled={sending} className={primary}>
									{sending ? (
										<>
											<Loader2 size={16} className="animate-spin" />
											Enviando…
										</>
									) : step === 1 ? (
										<>
											Continuar a pre-reserva
											<ArrowRight size={16} />
										</>
									) : (
										<>
											Enviar pre-reserva
											<Send size={16} />
										</>
									)}
								</button>
							</div>
						</form>
					)}
				</section>
				<aside className="overflow-hidden rounded-2xl border border-gray-200 bg-white lg:sticky lg:top-6">
					<div className="bg-[#007020] px-6 py-5 text-white">
						<p className="text-xs text-white/70">MACHU PICCHU</p>
						<h2 className="mt-1 text-lg font-semibold">
							Tu visita, de un vistazo
						</h2>
					</div>
					<dl className="space-y-5 p-6">
						{[
							[CalendarDays, "Fecha", date],
							[Clock3, "Ingreso solicitado", `${selection.time} h · Perú`],
							[
								Mountain,
								"Circuito",
								`${MACHU_PICCHU_ROUTES[selection.route]} · ${selection.route}`,
							],
							[Users, "Viajeros", String(travelers.length)],
						].map(([Icon, label, value]) => {
							const SummaryIcon = Icon as typeof CalendarDays;
							return (
								<div key={String(label)}>
									<dt className="mb-1 flex items-center gap-2 text-xs text-gray-500">
										<SummaryIcon size={14} />
										{String(label)}
									</dt>
									<dd className="text-sm font-semibold text-gray-800">
										{String(value)}
									</dd>
								</div>
							);
						})}
						<div className="border-t border-dashed border-gray-200 pt-5">
							<dt className="text-xs text-gray-500">Precio de la visita</dt>
							<dd className="mt-1 text-base font-semibold text-[#007020]">
								Pendiente de cotización
							</dd>
						</div>
					</dl>
					<p className="mx-6 mb-6 rounded-lg bg-gray-50 p-3 text-xs leading-6 text-gray-500">
						Un agente verificará tu solicitud antes de confirmar la reserva.
					</p>
				</aside>
			</div>
		</div>
	);
}
