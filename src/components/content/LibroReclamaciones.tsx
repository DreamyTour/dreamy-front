"use client";

import { type ChangeEvent, useMemo, useRef, useState } from "react";
import { countries } from "@/data/countries";
import {
	internationalPhone,
	resetFormSecurity,
	securityFields,
} from "../../lib/formSecurityClient";
import FormResultModal, { type FormResult } from "../ui/FormResultModal";
import FormSecurity from "../ui/FormSecurity";

// Colores del theme (definidos en global.css)
const colors = {
	primary: "oklch(0.66 0.18 148)",
	secondary: "oklch(0.62 0.22 20)",
	primaryForeground: "#ffffff",
	muted: "oklch(0.92 0.02 240)",
	border: "oklch(0.9 0.01 240)",
	foreground: "oklch(0.16 0.06 150)",
};

const complaintCopy = {
	es: {
		consumerTitle: "IDENTIFICACI\u00d3N DEL CONSUMIDOR RECLAMANTE",
		fullName: "Nombres",
		fullNamePlaceholder: "Ingrese sus nombres completos",
		country: "Pa\u00eds",
		countryPlaceholder: "Selecciona tu pa\u00eds",
		city: "Ciudad",
		cityPlaceholder: "Ingrese su ciudad",
		document: "Nro. Documento (DNI / Pasaporte)",
		documentPlaceholder: "Ingrese su n\u00famero de documento",
		email: "Email",
		phone: "Tel\u00e9fono",
		isMinor: "\u00bfEres menor de edad?",
		no: "No",
		yes: "S\u00ed",
		guardian: "Datos del padre, madre o apoderado",
		guardianPlaceholder: "Nombre completo del padre, madre o apoderado",
		claimTitle: "MANIFIESTO DEL CONSUMIDOR RECLAMANTE",
		type: "Tipo",
		claim: "Reclamo",
		complaint: "Queja",
		detail: "Detalle de la reclamaci\u00f3n o queja",
		detailPlaceholder: "Describa detalladamente su reclamo o queja...",
		success:
			"Su reclamaci\u00f3n ha sido enviada correctamente. Nos pondremos en contacto en un plazo m\u00e1ximo de 30 d\u00edas h\u00e1biles.",
		error:
			"Hubo un error al enviar su reclamaci\u00f3n. Por favor intente nuevamente o cont\u00e1ctenos directamente.",
		sendError: "Error en el env\u00edo",
		submitting: "Enviando...",
		sent: "Enviado exitosamente",
		sendFailed: "Error al enviar",
		submit: "Enviar",
		confirmationTitle: "Reclamación enviada",
		confirm: "Aceptar",
		errorTitle: "No pudimos confirmar el envío",
		retryTitle: "Espera unos segundos",
		retry:
			"Por favor, espera unos segundos y vuelve a intentarlo. Tus datos se conservarán.",
		unconfirmed:
			"No pudimos confirmar el envío. Por favor, inténtalo nuevamente.",
	},
	en: {
		consumerTitle: "CLAIMANT CONSUMER IDENTIFICATION",
		fullName: "Full name",
		fullNamePlaceholder: "Enter your full name",
		country: "Country",
		countryPlaceholder: "Select your country",
		city: "City",
		cityPlaceholder: "Enter your city",
		document: "Document No. (ID / Passport)",
		documentPlaceholder: "Enter your document number",
		email: "Email",
		phone: "Phone",
		isMinor: "Are you underage?",
		no: "No",
		yes: "Yes",
		guardian: "Parent or guardian details",
		guardianPlaceholder: "Full name of parent or guardian",
		claimTitle: "CLAIMANT CONSUMER STATEMENT",
		type: "Type",
		claim: "Claim",
		complaint: "Complaint",
		detail: "Claim or complaint details",
		detailPlaceholder: "Describe your claim or complaint in detail...",
		success:
			"Your complaint has been submitted successfully. We will contact you within a maximum of 30 business days.",
		error:
			"There was an error submitting your complaint. Please try again or contact us directly.",
		sendError: "Submission error",
		submitting: "Sending...",
		sent: "Sent successfully",
		sendFailed: "Error sending",
		submit: "Submit",
		confirmationTitle: "Complaint submitted",
		confirm: "Accept",
		errorTitle: "We could not confirm the submission",
		retryTitle: "Please wait a moment",
		retry:
			"Please wait a few seconds and try again. Your details will be kept.",
		unconfirmed: "We could not confirm the submission. Please try again.",
	},
	pt: {
		consumerTitle: "IDENTIFICA\u00c7\u00c3O DO CONSUMIDOR RECLAMANTE",
		fullName: "Nome completo",
		fullNamePlaceholder: "Digite seu nome completo",
		country: "Pa\u00eds",
		countryPlaceholder: "Selecione seu pa\u00eds",
		city: "Cidade",
		cityPlaceholder: "Digite sua cidade",
		document: "Nro. Documento (ID / Passaporte)",
		documentPlaceholder: "Digite o n\u00famero do seu documento",
		email: "E-mail",
		phone: "Telefone",
		isMinor: "Voc\u00ea \u00e9 menor de idade?",
		no: "N\u00e3o",
		yes: "Sim",
		guardian: "Dados do pai, m\u00e3e ou respons\u00e1vel",
		guardianPlaceholder: "Nome completo do pai, m\u00e3e ou respons\u00e1vel",
		claimTitle: "MANIFESTO DO CONSUMIDOR RECLAMANTE",
		type: "Tipo",
		claim: "Reclama\u00e7\u00e3o",
		complaint: "Queixa",
		detail: "Detalhe da reclama\u00e7\u00e3o ou queixa",
		detailPlaceholder:
			"Descreva detalhadamente sua reclama\u00e7\u00e3o ou queixa...",
		success:
			"Sua reclama\u00e7\u00e3o foi enviada corretamente. Entraremos em contato em um prazo m\u00e1ximo de 30 dias \u00fateis.",
		error:
			"Houve um erro ao enviar sua reclama\u00e7\u00e3o. Tente novamente ou entre em contato diretamente.",
		sendError: "Erro no envio",
		submitting: "Enviando...",
		sent: "Enviado com sucesso",
		sendFailed: "Erro ao enviar",
		submit: "Enviar",
		confirmationTitle: "Reclamação enviada",
		confirm: "Aceitar",
		errorTitle: "Não foi possível confirmar o envio",
		retryTitle: "Aguarde alguns segundos",
		retry:
			"Aguarde alguns segundos e tente novamente. Seus dados serão mantidos.",
		unconfirmed: "Não foi possível confirmar o envio. Tente novamente.",
	},
} as const;

interface LibroReclamacionesProps {
	lang?: "es" | "en" | "pt";
}

export default function LibroReclamaciones({
	lang = "es",
}: LibroReclamacionesProps) {
	const securityForm = useRef<HTMLFormElement>(null);
	const copy = complaintCopy[lang] ?? complaintCopy.es;
	const sortedCountries = useMemo(
		() =>
			[...countries].sort((a, b) =>
				(lang === "en" ? a.nameEN : a.nameES).localeCompare(
					lang === "en" ? b.nameEN : b.nameES,
				),
			),
		[lang],
	);
	const [formData, setFormData] = useState({
		nombres: "",
		pais: "",
		ciudad: "",
		documento: "",
		email: "",
		telefono: "",
		menorEdad: "no",
		datosApoderado: "",
		tipo: "reclamo",
		detalle: "",
	});

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [modalResult, setModalResult] = useState<FormResult | null>(null);

	const handleChange = (
		e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleRadioChange = (name: string, value: string) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: { preventDefault: () => void }) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const response = await fetch("/api/libro-reclamaciones", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...formData,
					telefono: internationalPhone(formData.telefono),
					...securityFields(securityForm.current),
				}),
			});

			const result = await response.json().catch(() => ({}));

			if (response.ok && result.success && !result.simulation) {
				setFormData({
					nombres: "",
					pais: "",
					ciudad: "",
					documento: "",
					email: "",
					telefono: "",
					menorEdad: "no",
					datosApoderado: "",
					tipo: "reclamo",
					detalle: "",
				});
				setModalResult({ kind: "success", message: copy.success });
			} else {
				setModalResult({
					kind: result.code === "FORM_RETRY" ? "retry" : "error",
					message: result.code === "FORM_RETRY" ? copy.retry : copy.unconfirmed,
				});
			}
		} catch {
			setModalResult({ kind: "error", message: copy.unconfirmed });
		} finally {
			resetFormSecurity(securityForm.current);
			setIsSubmitting(false);
		}
	};

	const buttonStyle = () => ({
		background: `linear-gradient(to right, ${colors.primary}, oklch(0.6 0.15 148))`,
		color: colors.primaryForeground,
	});

	const inputStyle = {
		borderColor: colors.border,
		color: colors.foreground,
	};

	return (
		<form
			ref={securityForm}
			action="/api/libro-reclamaciones"
			method="post"
			onSubmit={handleSubmit}
			className="space-y-6"
		>
			{/* Consumer identification */}
			<div>
				<h2
					className="text-lg font-semibold mb-4"
					style={{ color: colors.foreground }}
				>
					{copy.consumerTitle}
				</h2>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="md:col-span-2">
						<label
							htmlFor="lr-nombres"
							className="block text-sm font-medium mb-2"
							style={{ color: colors.foreground }}
						>
							{copy.fullName} <span className="text-secondary">*</span>
						</label>
						<input
							id="lr-nombres"
							type="text"
							name="nombres"
							value={formData.nombres}
							onChange={handleChange}
							autoComplete="name"
							enterKeyHint="next"
							required
							style={inputStyle}
							className="w-full px-4 py-3 border rounded-lg focus:ring-2 transition-all"
							placeholder={copy.fullNamePlaceholder}
						/>
					</div>

					<div>
						<label
							htmlFor="lr-pais"
							className="block text-sm font-medium mb-2"
							style={{ color: colors.foreground }}
						>
							{copy.country} <span className="text-secondary">*</span>
						</label>
						<select
							id="lr-pais"
							name="pais"
							value={formData.pais}
							onChange={(e) => handleChange(e)}
							autoComplete="country-name"
							required
							style={inputStyle}
							className="w-full px-4 py-3 border rounded-lg focus:ring-2 transition-all bg-white"
						>
							<option value="">{copy.countryPlaceholder}</option>
							{sortedCountries.map((country) => (
								<option
									key={`lr-country-${country.iso2}`}
									value={lang === "en" ? country.nameEN : country.nameES}
								>
									{lang === "en" ? country.nameEN : country.nameES}
								</option>
							))}
						</select>
					</div>

					<div>
						<label
							htmlFor="lr-ciudad"
							className="block text-sm font-medium mb-2"
							style={{ color: colors.foreground }}
						>
							{copy.city} <span className="text-secondary">*</span>
						</label>
						<input
							id="lr-ciudad"
							type="text"
							name="ciudad"
							value={formData.ciudad}
							onChange={handleChange}
							autoComplete="address-level2"
							enterKeyHint="next"
							required
							style={inputStyle}
							className="w-full px-4 py-3 border rounded-lg focus:ring-2 transition-all"
							placeholder={copy.cityPlaceholder}
						/>
					</div>

					<div>
						<label
							htmlFor="lr-documento"
							className="block text-sm font-medium mb-2"
							style={{ color: colors.foreground }}
						>
							{copy.document} <span className="text-secondary">*</span>
						</label>
						<input
							id="lr-documento"
							type="text"
							name="documento"
							value={formData.documento}
							onChange={handleChange}
							autoComplete="off"
							enterKeyHint="next"
							required
							style={inputStyle}
							className="w-full px-4 py-3 border rounded-lg focus:ring-2 transition-all"
							placeholder={copy.documentPlaceholder}
						/>
					</div>

					<div>
						<label
							htmlFor="lr-email"
							className="block text-sm font-medium mb-2"
							style={{ color: colors.foreground }}
						>
							{copy.email} <span className="text-secondary">*</span>
						</label>
						<input
							id="lr-email"
							type="email"
							name="email"
							value={formData.email}
							onChange={handleChange}
							autoComplete="email"
							inputMode="email"
							enterKeyHint="next"
							required
							style={inputStyle}
							className="w-full px-4 py-3 border rounded-lg focus:ring-2 transition-all"
							placeholder="correo@ejemplo.com"
						/>
					</div>

					<div>
						<label
							htmlFor="lr-telefono"
							className="block text-sm font-medium mb-2"
							style={{ color: colors.foreground }}
						>
							{copy.phone} <span className="text-secondary">*</span>
						</label>
						<input
							id="lr-telefono"
							type="tel"
							name="telefono"
							value={formData.telefono}
							onChange={handleChange}
							autoComplete="tel"
							inputMode="tel"
							enterKeyHint="next"
							required
							style={inputStyle}
							className="w-full px-4 py-3 border rounded-lg focus:ring-2 transition-all"
							placeholder="+51 999 999 999"
						/>
					</div>

					<div>
						<label
							htmlFor="lr-menor-no"
							className="block text-sm font-medium mb-2"
							style={{ color: colors.foreground }}
						>
							{copy.isMinor} <span className="text-secondary">*</span>
						</label>
						<div className="flex gap-4 mt-2">
							<label className="inline-flex items-center cursor-pointer">
								<input
									id="lr-menor-no"
									type="radio"
									name="menorEdad"
									value="no"
									checked={formData.menorEdad === "no"}
									onChange={() => handleRadioChange("menorEdad", "no")}
									style={{ accentColor: colors.primary }}
								/>
								<span className="ml-2" style={{ color: colors.foreground }}>
									{copy.no}
								</span>
							</label>
							<label className="inline-flex items-center cursor-pointer">
								<input
									id="lr-menor-si"
									type="radio"
									name="menorEdad"
									value="si"
									checked={formData.menorEdad === "si"}
									onChange={() => handleRadioChange("menorEdad", "si")}
									style={{ accentColor: colors.primary }}
								/>
								<span className="ml-2" style={{ color: colors.foreground }}>
									{copy.yes}
								</span>
							</label>
						</div>
					</div>

					<div
						className={formData.menorEdad === "si" ? "md:col-span-2" : "hidden"}
					>
						<label
							htmlFor="lr-datos-apoderado"
							className="block text-sm font-medium mb-2"
							style={{ color: colors.foreground }}
						>
							{copy.guardian} <span className="text-secondary">*</span>
						</label>
						<input
							id="lr-datos-apoderado"
							type="text"
							name="datosApoderado"
							value={formData.datosApoderado}
							onChange={handleChange}
							autoComplete="name"
							enterKeyHint="next"
							style={inputStyle}
							className="w-full px-4 py-3 border rounded-lg focus:ring-2 transition-all"
							placeholder={copy.guardianPlaceholder}
						/>
					</div>
				</div>
			</div>

			{/* Claim statement */}
			<div>
				<h2
					className="text-lg font-semibold mb-4 pt-4 border-t"
					style={{ color: colors.foreground, borderColor: colors.border }}
				>
					{copy.claimTitle}
				</h2>

				<div className="space-y-6">
					<div>
						<label
							htmlFor="lr-tipo-reclamo"
							className="block text-sm font-medium mb-2"
							style={{ color: colors.foreground }}
						>
							{copy.type} <span className="text-secondary">*</span>
						</label>
						<div className="flex gap-6 mt-2">
							<label
								className="inline-flex items-center p-4 border rounded-lg cursor-pointer transition-all"
								style={{
									borderColor:
										formData.tipo === "reclamo"
											? colors.primary
											: colors.border,
									backgroundColor:
										formData.tipo === "reclamo"
											? `${colors.primary}10`
											: "transparent",
								}}
							>
								<input
									id="lr-tipo-reclamo"
									type="radio"
									name="tipo"
									value="reclamo"
									checked={formData.tipo === "reclamo"}
									onChange={() => handleRadioChange("tipo", "reclamo")}
									style={{ accentColor: colors.primary }}
								/>
								<span
									className="ml-2 font-medium"
									style={{ color: colors.foreground }}
								>
									{copy.claim}
								</span>
							</label>
							<label
								className="inline-flex items-center p-4 border rounded-lg cursor-pointer transition-all"
								style={{
									borderColor:
										formData.tipo === "queja" ? colors.primary : colors.border,
									backgroundColor:
										formData.tipo === "queja"
											? `${colors.primary}10`
											: "transparent",
								}}
							>
								<input
									id="lr-tipo-queja"
									type="radio"
									name="tipo"
									value="queja"
									checked={formData.tipo === "queja"}
									onChange={() => handleRadioChange("tipo", "queja")}
									style={{ accentColor: colors.primary }}
								/>
								<span
									className="ml-2 font-medium"
									style={{ color: colors.foreground }}
								>
									{copy.complaint}
								</span>
							</label>
						</div>
					</div>

					<div>
						<label
							htmlFor="lr-detalle"
							className="block text-sm font-medium mb-2"
							style={{ color: colors.foreground }}
						>
							{copy.detail} <span className="text-secondary">*</span>
						</label>
						<textarea
							id="lr-detalle"
							name="detalle"
							value={formData.detalle}
							onChange={handleChange}
							enterKeyHint="send"
							required
							rows={6}
							style={inputStyle}
							className="w-full px-4 py-3 border rounded-lg focus:ring-2 transition-all"
							placeholder={copy.detailPlaceholder}
						></textarea>
					</div>
				</div>
			</div>

			<div className="mt-8">
				<button
					type="submit"
					disabled={isSubmitting}
					style={buttonStyle()}
					className={`w-full font-bold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-75 disabled:cursor-not-allowed`}
				>
					{isSubmitting ? copy.submitting : copy.submit}
				</button>
			</div>
			<FormSecurity lang={lang} />
			<FormResultModal
				result={modalResult}
				onClose={() => setModalResult(null)}
				onConfirm={
					modalResult?.kind === "success"
						? () => window.location.reload()
						: undefined
				}
				messages={{
					successTitle: copy.confirmationTitle,
					errorTitle: copy.errorTitle,
					retryTitle: copy.retryTitle,
					closeLabel: copy.confirm,
				}}
			/>
		</form>
	);
}
