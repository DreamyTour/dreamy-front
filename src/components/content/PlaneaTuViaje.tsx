"use client";

import { CalendarDays, Compass, MapPinned, ShieldCheck } from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";
import { countries } from "@/data/countries";
import {
	internationalPhone,
	resetFormSecurity,
	securityFields,
} from "../../lib/formSecurityClient";
import FormResultModal, { type FormResult } from "../ui/FormResultModal";
import FormSecurity from "../ui/FormSecurity";
import { formClass, submitClass } from "../ui/formStyles";

interface CountryOption {
	nombre: string;
	codigo: string;
}

const i18n = {
	es: {
		planningEyebrow: "Diseña tu viaje a medida",
		planningTitle: "Tu próxima gran historia empieza aquí.",
		planningDescription:
			"Comparte tu idea y crearemos una ruta que conecte tus tiempos, intereses y lugares soñados.",
		highlightTailored: "Itinerario pensado para ti",
		highlightLocal: "Asesoría local especializada",
		highlightSafe: "Solicitud sin compromiso",
		personalInfo: "INFORMACIÓN PERSONAL",
		names: "Nombres",
		namesPh: "Tu nombre completo",
		country: "País",
		countryPh: "Selecciona tu país",
		email: "Email",
		emailPh: "tu@email.com",
		whatsapp: "WhatsApp",
		tripDetails: "DETALLES DEL VIAJE",
		adults: "N° Adultos",
		minors: "N° Menores",
		date: "Fecha de Viaje",
		langGuide: "Idioma del Guiado",
		hotelCat: "Categoría de Hotel",
		messageLabel: "Cuéntanos más sobre tu viaje soñado",
		messagePh:
			"Lugares que no quieres perder, detalles adicionales, tours que te interesan, etc.",
		sending: "⏳ Enviando...",
		sent: "✅ Enviado",
		errorBtn: "❌ Error",
		submitText: "Solicitar Cotización",
		alertSuccess: "¡Gracias por contactarnos! Te responderemos en breve.",
		alertError:
			"Hubo un error al enviar tu solicitud. Por favor intente nuevamente.",
		modalSuccessTitle: "Solicitud recibida",
		modalErrorTitle: "No pudimos confirmar el envío",
		modalRetryTitle: "Espera unos segundos",
		modalSuccess:
			"¡Recibimos tu solicitud! Nuestro equipo revisará los detalles de tu viaje y se pondrá en contacto contigo.",
		modalError:
			"No pudimos confirmar el envío. Por favor, inténtalo nuevamente.",
		modalRetry:
			"Por favor, espera unos segundos y vuelve a intentarlo. Tus datos se conservarán.",
		modalClose: "Cerrar",
		otherCountry: "Otro",
		hotelCatList: [
			"2 Estrellas",
			"3 Estrellas",
			"4 Estrellas",
			"5 Estrellas",
			"No específico",
		],
	},
	en: {
		planningEyebrow: "Design your tailor-made trip",
		planningTitle: "Your next great story starts here.",
		planningDescription:
			"Share your idea and we will create a route around your time, interests and dream places.",
		highlightTailored: "An itinerary made for you",
		highlightLocal: "Local expert guidance",
		highlightSafe: "No-obligation request",
		personalInfo: "PERSONAL INFORMATION",
		names: "Full Name",
		namesPh: "Your full name",
		country: "Country",
		countryPh: "Select your country",
		email: "Email",
		emailPh: "you@email.com",
		whatsapp: "WhatsApp",
		tripDetails: "TRIP DETAILS",
		adults: "N° Adults",
		minors: "N° Minors",
		date: "Travel Date",
		langGuide: "Guided Language",
		hotelCat: "Hotel Category",
		messageLabel: "Tell us more about your dream trip",
		messagePh:
			"Places you don't want to miss, additional details, tours of interest, etc.",
		sending: "⏳ Sending...",
		sent: "✅ Sent",
		errorBtn: "❌ Error",
		submitText: "Request Quote",
		alertSuccess: "Thank you for contacting us! We will reply shortly.",
		alertError: "There was an error sending your request. Please try again.",
		modalSuccessTitle: "Request received",
		modalErrorTitle: "We could not confirm the submission",
		modalRetryTitle: "Please wait a moment",
		modalSuccess:
			"We received your request. Our team will review your trip details and contact you.",
		modalError: "We could not confirm the submission. Please try again.",
		modalRetry:
			"Please wait a few seconds and try again. Your details will be kept.",
		modalClose: "Close",
		otherCountry: "Other",
		hotelCatList: ["2 Stars", "3 Stars", "4 Stars", "5 Stars", "Not specified"],
	},
	pt: {
		planningEyebrow: "Planeje uma viagem sob medida",
		planningTitle: "Sua próxima grande história começa aqui.",
		planningDescription:
			"Conte sua ideia e criaremos uma rota para o seu tempo, interesses e lugares dos sonhos.",
		highlightTailored: "Roteiro feito para você",
		highlightLocal: "Assessoria local especializada",
		highlightSafe: "Solicitação sem compromisso",
		personalInfo: "INFORMAÇÃO PESSOAL",
		names: "Nome Completo",
		namesPh: "Seu nome completo",
		country: "País",
		countryPh: "Selecione o seu país",
		email: "Email",
		emailPh: "seu@email.com",
		whatsapp: "WhatsApp",
		tripDetails: "DETALHES DA VIAGEM",
		adults: "Nº Adultos",
		minors: "Nº Menores",
		date: "Data de Viagem",
		langGuide: "Idioma do Guia",
		hotelCat: "Categoria do Hotel",
		messageLabel: "Conte-nos mais sobre a viagem dos seus sonhos",
		messagePh:
			"Lugares que não quer perder, detalhes adicionais, passeios de interesse, etc.",
		sending: "⏳ Enviando...",
		sent: "✅ Enviado",
		errorBtn: "❌ Erro",
		submitText: "Solicitar Orçamento",
		alertSuccess: "Obrigado por nos contatar! Responderemos em breve.",
		alertError:
			"Houve um erro ao enviar a sua solicitação. Por favor, tente novamente.",
		modalSuccessTitle: "Solicitação recebida",
		modalErrorTitle: "Não foi possível confirmar o envio",
		modalRetryTitle: "Aguarde alguns segundos",
		modalSuccess:
			"Recebemos sua solicitação. Nossa equipe analisará os detalhes da sua viagem e entrará em contato.",
		modalError: "Não foi possível confirmar o envio. Tente novamente.",
		modalRetry:
			"Aguarde alguns segundos e tente novamente. Seus dados serão mantidos.",
		modalClose: "Fechar",
		otherCountry: "Outro",
		hotelCatList: [
			"2 Estrelas",
			"3 Estrelas",
			"4 Estrelas",
			"5 Estrelas",
			"Não específico",
		],
	},
};

const idiomasList = [
	"Español",
	"English",
	"Português",
	"Français",
	"Deutsch",
	"Italiano",
];

export default function PlaneaTuViaje({
	lang = "es",
}: {
	lang?: "es" | "en" | "pt";
}) {
	const t = i18n[lang] || i18n.es;
	const dateInputRef = useRef<HTMLInputElement>(null);
	const securityForm = useRef<HTMLFormElement>(null);
	const today = new Date();
	const todayDateValue = `${today.getFullYear()}-${String(
		today.getMonth() + 1,
	).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

	// Cargar lista de países según idioma (idealmente traduciríamos country name pero usamos nameES por ahora)
	const paises: CountryOption[] = [
		...countries
			.map((country) => ({
				nombre: country.nameES,
				codigo: country.phoneCode,
			}))
			.sort((a, b) => a.nombre.localeCompare(b.nombre)),
		{ nombre: t.otherCountry, codigo: "" },
	];

	const [formData, setFormData] = useState({
		nombres: "",
		pais: "",
		email: "",
		telefono: "",
		adultos: "1",
		menores: "0",
		fechaViaje: "",
		idioma: idiomasList[0],
		categoriaHotel: t.hotelCatList[4],
		mensaje: "",
	});

	const [codigoPais, setCodigoPais] = useState("51");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [modalResult, setModalResult] = useState<FormResult | null>(null);

	// Obtener código de país al seleccionar país
	const handlePaisChange = (paisNombre: string) => {
		const pais = paises.find((p) => p.nombre === paisNombre);
		if (pais) {
			setCodigoPais(pais.codigo || "");
		}
		setFormData((prev) => ({ ...prev, pais: paisNombre }));
	};

	const handleChange = (
		e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const openDatePicker = () => {
		const dateInput = dateInputRef.current;

		if (!dateInput) return;

		try {
			dateInput.showPicker();
		} catch {
			dateInput.focus();
		}
	};

	const handleSubmit = async (e: { preventDefault: () => void }) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const response = await fetch("/api/planea-tu-viaje", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...formData,
					telefono: internationalPhone(formData.telefono, codigoPais),
					codigoPais,
					formLanguage: lang,
					...securityFields(securityForm.current),
				}),
			});

			const result = await response.json().catch(() => ({}));

			if (response.ok && result.success && !result.simulation) {
				// Attribute successful enquiries from the sustainability landing without sending personal data.
				if (document.referrer) {
					const source = new URL(document.referrer);
					if (
						source.origin === window.location.origin &&
						source.pathname === "/es/turismo-sostenible-peru/"
					) {
						const analytics = window as Window & {
							dataLayer?: Record<string, unknown>[];
						};
						analytics.dataLayer ??= [];
						analytics.dataLayer.push({
							event: "sustainable_tourism_enquiry",
							source_page: source.pathname,
							form: "plan_trip",
						});
					}
				}
				setFormData({
					nombres: "",
					pais: "",
					email: "",
					telefono: "",
					adultos: "1",
					menores: "0",
					fechaViaje: "",
					idioma: idiomasList[0],
					categoriaHotel: t.hotelCatList[4],
					mensaje: "",
				});
				setCodigoPais("51");
				setModalResult({ kind: "success", message: t.modalSuccess });
			} else {
				setModalResult({
					kind: result.code === "FORM_RETRY" ? "retry" : "error",
					message: result.code === "FORM_RETRY" ? t.modalRetry : t.modalError,
				});
			}
		} catch {
			setModalResult({ kind: "error", message: t.modalError });
		} finally {
			resetFormSecurity(securityForm.current);
			setIsSubmitting(false);
		}
	};

	const inputStyle = {
		backgroundColor: "#ffffff",
	};

	const planningHighlights = [
		{ icon: MapPinned, label: t.highlightTailored },
		{ icon: Compass, label: t.highlightLocal },
		{ icon: ShieldCheck, label: t.highlightSafe },
	];

	return (
		<form
			ref={securityForm}
			action="/api/planea-tu-viaje"
			method="post"
			onSubmit={handleSubmit}
			className={formClass}
		>
			<div className="border-b border-stone-200 pb-7">
				<div className="relative max-w-2xl">
					<p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-primary">
						<Compass className="h-3.5 w-3.5" aria-hidden="true" />
						{t.planningEyebrow}
					</p>
					<h2 className="font-heading text-2xl font-semibold leading-tight tracking-tight text-foreground md:text-3xl">
						{t.planningTitle}
					</h2>
					<p className="mt-4 max-w-xl text-sm leading-6 text-stone-600 md:text-base">
						{t.planningDescription}
					</p>
				</div>

				<div className="relative mt-7 grid gap-2 sm:grid-cols-3">
					{planningHighlights.map(({ icon: Icon, label }) => (
						<div
							key={label}
							className="flex items-center gap-2.5 py-1 text-xs font-medium text-stone-600"
						>
							<Icon
								className="h-4 w-4 shrink-0 text-primary"
								aria-hidden="true"
							/>
							<span>{label}</span>
						</div>
					))}
				</div>
			</div>

			<div className="space-y-8 pt-7">
				{/* INFORMACION PERSONAL */}
				<section className="space-y-5">
					<div className="mb-5 flex items-end justify-between gap-4 border-b border-stone-200 pb-4">
						<div>
							<span className="mb-2 inline-flex text-[11px] font-bold uppercase tracking-[0.3em] text-primary">
								01
							</span>
							<h2 className="text-lg font-semibold text-foreground">
								{t.personalInfo}
							</h2>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label
								htmlFor="nombres"
								className="mb-2 block text-sm font-medium text-foreground"
							>
								{t.names} <span className="text-secondary">*</span>
							</label>
							<input
								id="nombres"
								type="text"
								name="nombres"
								value={formData.nombres}
								onChange={handleChange}
								autoComplete="name"
								enterKeyHint="next"
								required
								style={inputStyle}
								className="w-full rounded-lg border border-border px-4 py-3 text-base shadow-sm outline-none transition-all placeholder:text-stone-400 focus:border-primary focus:ring-2 focus:ring-primary/15"
								placeholder={t.namesPh}
							/>
						</div>

						<div>
							<label
								htmlFor="pais"
								className="mb-2 block text-sm font-medium text-foreground"
							>
								{t.country} <span className="text-secondary">*</span>
							</label>
							<select
								id="pais"
								name="pais"
								value={formData.pais}
								onChange={(e) => handlePaisChange(e.target.value)}
								autoComplete="country-name"
								required
								style={inputStyle}
								className="w-full rounded-lg border border-border px-4 py-3 text-base shadow-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
							>
								<option value="">{t.countryPh}</option>
								{paises.map((pais) => (
									<option key={pais.nombre} value={pais.nombre}>
										{pais.nombre}
									</option>
								))}
							</select>
						</div>

						<div>
							<label
								htmlFor="email"
								className="mb-2 block text-sm font-medium text-foreground"
							>
								{t.email} <span className="text-secondary">*</span>
							</label>
							<input
								id="email"
								type="email"
								name="email"
								value={formData.email}
								onChange={handleChange}
								autoComplete="email"
								inputMode="email"
								enterKeyHint="next"
								required
								style={inputStyle}
								className="w-full rounded-lg border border-border px-4 py-3 text-base shadow-sm outline-none transition-all placeholder:text-stone-400 focus:border-primary focus:ring-2 focus:ring-primary/15"
								placeholder={t.emailPh}
							/>
						</div>

						<div>
							<label
								htmlFor="telefono"
								className="mb-2 block text-sm font-medium text-foreground"
							>
								{t.whatsapp}
							</label>
							<div className="flex overflow-hidden rounded-lg shadow-sm">
								<span className="flex items-center border border-r-0 border-border px-4 py-3 text-sm font-medium bg-white text-foreground">
									+{codigoPais || "51"}
								</span>
								<input
									id="telefono"
									type="tel"
									name="telefono"
									value={formData.telefono}
									onChange={handleChange}
									autoComplete="tel-national"
									inputMode="tel"
									enterKeyHint="next"
									style={{
										...inputStyle,
										borderLeft: "none",
										borderTopLeftRadius: 0,
										borderBottomLeftRadius: 0,
									}}
									className="w-full rounded-r-lg border border-border px-4 py-3 text-sm outline-none transition-all placeholder:text-stone-400 focus:border-primary focus:ring-2 focus:ring-primary/15"
									placeholder="999 999 999"
								/>
							</div>
						</div>
					</div>
				</section>

				{/* DETALLES DEL VIAJE */}
				<section className="space-y-5">
					<div className="mb-5 flex items-end justify-between gap-4 border-b border-stone-200 pb-4">
						<div>
							<span className="mb-2 inline-flex text-[11px] font-bold uppercase tracking-[0.3em] text-primary">
								02
							</span>
							<h2 className="text-lg font-semibold text-foreground">
								{t.tripDetails}
							</h2>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
						<div>
							<label
								htmlFor="adultos"
								className="mb-2 block text-sm font-medium text-foreground"
							>
								{t.adults}
							</label>
							<input
								id="adultos"
								type="number"
								name="adultos"
								value={formData.adultos}
								onChange={handleChange}
								inputMode="numeric"
								min="1"
								style={inputStyle}
								className="w-full rounded-lg border border-border px-4 py-3 text-base shadow-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
							/>
						</div>

						<div>
							<label
								htmlFor="menores"
								className="mb-2 block text-sm font-medium text-foreground"
							>
								{t.minors}
							</label>
							<input
								id="menores"
								type="number"
								name="menores"
								value={formData.menores}
								onChange={handleChange}
								inputMode="numeric"
								min="0"
								style={inputStyle}
								className="w-full rounded-lg border border-border px-4 py-3 text-base shadow-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
							/>
						</div>

						<div>
							<label
								htmlFor="fechaViaje"
								className="mb-2 block text-sm font-medium text-foreground"
							>
								{t.date}
							</label>
							<div className="relative">
								<input
									ref={dateInputRef}
									id="fechaViaje"
									type="date"
									name="fechaViaje"
									value={formData.fechaViaje}
									onChange={handleChange}
									min={todayDateValue}
									style={inputStyle}
									className="w-full cursor-text rounded-lg border border-border px-4 py-3 pr-12 text-base shadow-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15 [&::-webkit-calendar-picker-indicator]:hidden"
								/>
								<button
									type="button"
									onClick={openDatePicker}
									aria-label={t.date}
									className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-primary transition-colors hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
								>
									<CalendarDays className="h-5 w-5" aria-hidden="true" />
								</button>
							</div>
						</div>

						<div>
							<label
								htmlFor="idioma"
								className="mb-2 block text-sm font-medium text-foreground"
							>
								{t.langGuide}
							</label>
							<select
								id="idioma"
								name="idioma"
								value={formData.idioma}
								onChange={handleChange}
								style={inputStyle}
								className="w-full rounded-lg border border-border px-4 py-3 text-base shadow-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
							>
								{idiomasList.map((idioma) => (
									<option key={idioma} value={idioma}>
										{idioma}
									</option>
								))}
							</select>
						</div>

						<div>
							<label
								htmlFor="categoriaHotel"
								className="mb-2 block text-sm font-medium text-foreground"
							>
								{t.hotelCat}
							</label>
							<select
								id="categoriaHotel"
								name="categoriaHotel"
								value={formData.categoriaHotel}
								onChange={handleChange}
								style={inputStyle}
								className="w-full rounded-lg border border-border px-4 py-3 text-base shadow-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
							>
								{t.hotelCatList.map((cat) => (
									<option key={cat} value={cat}>
										{cat}
									</option>
								))}
							</select>
						</div>
					</div>

					{/* Mensaje */}
					<div className="mt-5">
						<label
							htmlFor="mensaje"
							className="mb-2 block text-sm font-medium text-foreground"
						>
							{t.messageLabel}
						</label>
						<textarea
							id="mensaje"
							name="mensaje"
							value={formData.mensaje}
							onChange={handleChange}
							enterKeyHint="send"
							rows={4}
							style={inputStyle}
							className="w-full rounded-lg border border-border px-4 py-3 text-base shadow-sm outline-none transition-all placeholder:text-stone-400 focus:border-primary focus:ring-2 focus:ring-primary/15"
							placeholder={t.messagePh}
						></textarea>
					</div>
				</section>

				<div className="pt-1">
					<button type="submit" disabled={isSubmitting} className={submitClass}>
						{isSubmitting ? t.sending : t.submitText}
					</button>
				</div>
				<FormSecurity lang={lang} />
				<FormResultModal
					result={modalResult}
					onClose={() => setModalResult(null)}
					messages={{
						successTitle: t.modalSuccessTitle,
						errorTitle: t.modalErrorTitle,
						retryTitle: t.modalRetryTitle,
						closeLabel: t.modalClose,
					}}
				/>
			</div>
		</form>
	);
}
