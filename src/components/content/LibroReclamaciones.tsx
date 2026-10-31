"use client";

import { type ChangeEvent, useMemo, useRef, useState } from "react";
import { countries } from "@/data/countries";
import {
	internationalPhone,
	resetFormSecurity,
	securityFields,
} from "../../lib/formSecurityClient";
import type { ComplaintValidationField } from "../../lib/formValidation";
import FormResultModal, { type FormResult } from "../ui/FormResultModal";
import FormSecurity from "../ui/FormSecurity";
import { formClass, submitClass } from "../ui/formStyles";

// Colores del theme (definidos en global.css)
const colors = {
	primary: "var(--primary)",
	secondary: "oklch(0.62 0.22 20)",
	primaryForeground: "#ffffff",
	muted: "oklch(0.92 0.02 240)",
	border: "oklch(0.9 0.01 240)",
	foreground: "oklch(0.16 0.06 150)",
};

const complaintCopy = {
	es: {
		consumerTitle: "Tus datos personales",
		consumerHelp:
			"Completa tus datos para que podamos identificarte y contactarte. Los campos con * son obligatorios.",
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
		phoneCode: "C\u00f3digo",
		isMinor: "\u00bfEres menor de edad?",
		no: "No",
		yes: "S\u00ed",
		guardian: "Datos del padre, madre o apoderado",
		guardianPlaceholder: "Nombre completo del padre, madre o apoderado",
		claimTitle: "Cu\u00e9ntanos qu\u00e9 ocurri\u00f3",
		claimHelp:
			"Selecciona reclamo o queja y describe lo ocurrido, el servicio y la soluci\u00f3n que solicitas.",
		reviewTitle: "Revisa y env\u00eda",
		reviewHelp:
			"Comprueba tus datos y el detalle antes de enviar. Al finalizar, ver\u00e1s una confirmaci\u00f3n si el env\u00edo se complet\u00f3.",
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
		submit: "Enviar reclamaci\u00f3n",
		confirmationTitle: "Reclamación enviada",
		confirm: "Aceptar",
		errorTitle: "No pudimos confirmar el envío",
		retryTitle: "Espera unos segundos",
		retry:
			"Por favor, espera unos segundos y vuelve a intentarlo. Tus datos se conservarán.",
		unconfirmed:
			"No pudimos confirmar el envío. Por favor, inténtalo nuevamente.",
		validation: {
			nombres: "Ingresa tus nombres completos (mínimo 5 caracteres).",
			pais: "Selecciona un país de la lista.",
			ciudad: "Ingresa tu ciudad.",
			documento: "Ingresa un documento alfanumérico de 8 a 15 caracteres.",
			email: "Ingresa un correo electrónico válido.",
			telefono: "Ingresa un teléfono internacional válido.",
			datosApoderado: "Ingresa los datos del padre, madre o apoderado.",
			tipo: "Selecciona el tipo de solicitud.",
			detalle: "Describe tu reclamación con al menos 20 caracteres.",
		},
	},
	en: {
		consumerTitle: "Your personal details",
		consumerHelp:
			"Enter your details so we can identify and contact you. Fields marked * are required.",
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
		phoneCode: "Country code",
		isMinor: "Are you underage?",
		no: "No",
		yes: "Yes",
		guardian: "Parent or guardian details",
		guardianPlaceholder: "Full name of parent or guardian",
		claimTitle: "Tell us what happened",
		claimHelp:
			"Choose a claim or complaint and describe what happened, the service and your requested resolution.",
		reviewTitle: "Review and submit",
		reviewHelp:
			"Check your details and description before submitting. A confirmation will appear if your submission is successful.",
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
		submit: "Submit complaint",
		confirmationTitle: "Complaint submitted",
		confirm: "Accept",
		errorTitle: "We could not confirm the submission",
		retryTitle: "Please wait a moment",
		retry:
			"Please wait a few seconds and try again. Your details will be kept.",
		unconfirmed: "We could not confirm the submission. Please try again.",
		validation: {
			nombres: "Enter your full name (at least 5 characters).",
			pais: "Choose a country from the list.",
			ciudad: "Enter your city.",
			documento: "Enter an 8 to 15 character alphanumeric document number.",
			email: "Enter a valid email address.",
			telefono: "Enter a valid international phone number.",
			datosApoderado: "Enter the parent or guardian details.",
			tipo: "Choose a request type.",
			detalle: "Describe your claim in at least 20 characters.",
		},
	},
	pt: {
		consumerTitle: "Seus dados pessoais",
		consumerHelp:
			"Preencha seus dados para que possamos identificar e contatar voc\u00ea. Os campos com * s\u00e3o obrigat\u00f3rios.",
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
		phoneCode: "Código do país",
		isMinor: "Voc\u00ea \u00e9 menor de idade?",
		no: "N\u00e3o",
		yes: "Sim",
		guardian: "Dados do pai, m\u00e3e ou respons\u00e1vel",
		guardianPlaceholder: "Nome completo do pai, m\u00e3e ou respons\u00e1vel",
		claimTitle: "Conte o que aconteceu",
		claimHelp:
			"Selecione reclama\u00e7\u00e3o ou queixa e descreva o ocorrido, o servi\u00e7o e a solu\u00e7\u00e3o que deseja.",
		reviewTitle: "Revise e envie",
		reviewHelp:
			"Confira seus dados e a descri\u00e7\u00e3o antes de enviar. Uma confirma\u00e7\u00e3o aparecer\u00e1 se o envio for conclu\u00eddo.",
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
		submit: "Enviar reclama\u00e7\u00e3o",
		confirmationTitle: "Reclamação enviada",
		confirm: "Aceitar",
		errorTitle: "Não foi possível confirmar o envio",
		retryTitle: "Aguarde alguns segundos",
		retry:
			"Aguarde alguns segundos e tente novamente. Seus dados serão mantidos.",
		unconfirmed: "Não foi possível confirmar o envio. Tente novamente.",
		validation: {
			nombres: "Digite seu nome completo (no mínimo 5 caracteres).",
			pais: "Selecione um país da lista.",
			ciudad: "Digite sua cidade.",
			documento: "Digite um documento alfanumérico de 8 a 15 caracteres.",
			email: "Digite um e-mail válido.",
			telefono: "Digite um telefone internacional válido.",
			datosApoderado: "Digite os dados do pai, mãe ou responsável.",
			tipo: "Selecione o tipo de solicitação.",
			detalle: "Descreva sua reclamação com pelo menos 20 caracteres.",
		},
	},
} as const;

const complaintFields = [
	"nombres",
	"pais",
	"ciudad",
	"documento",
	"email",
	"telefono",
	"datosApoderado",
	"tipo",
	"detalle",
] as const satisfies readonly ComplaintValidationField[];

const fieldElementIds: Record<ComplaintValidationField, string> = {
	nombres: "lr-nombres",
	pais: "lr-pais",
	ciudad: "lr-ciudad",
	documento: "lr-documento",
	email: "lr-email",
	telefono: "lr-telefono",
	datosApoderado: "lr-datos-apoderado",
	tipo: "lr-tipo-reclamo",
	detalle: "lr-detalle",
};

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
	const callingCodes = useMemo(
		() =>
			[
				...new Set(
					countries.map((country) => country.phoneCode.replace(/\D/g, "")),
				),
			]
				.filter(Boolean)
				.sort((a, b) => Number(a) - Number(b)),
		[],
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
	const [codigoPais, setCodigoPais] = useState("");
	const [fieldErrors, setFieldErrors] = useState<
		Partial<Record<ComplaintValidationField, string>>
	>({});

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [modalResult, setModalResult] = useState<FormResult | null>(null);

	const clearFieldError = (field: ComplaintValidationField) => {
		setFieldErrors((previous) => {
			if (!previous[field]) return previous;
			const next = { ...previous };
			delete next[field];
			return next;
		});
	};

	const handleChange = (
		e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		if (complaintFields.includes(name as ComplaintValidationField))
			clearFieldError(name as ComplaintValidationField);
	};

	const handleRadioChange = (name: string, value: string) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
		if (complaintFields.includes(name as ComplaintValidationField))
			clearFieldError(name as ComplaintValidationField);
	};

	const handleCountryChange = (pais: string) => {
		const country = countries.find(
			(item) => (lang === "en" ? item.nameEN : item.nameES) === pais,
		);
		setFormData((previous) => ({ ...previous, pais }));
		setCodigoPais(country?.phoneCode.replace(/\D/g, "") ?? "");
		clearFieldError("pais");
		clearFieldError("telefono");
	};

	const focusField = (field: ComplaintValidationField) => {
		requestAnimationFrame(() =>
			document.getElementById(fieldElementIds[field])?.focus(),
		);
	};

	const clientValidationErrors = (telefono: string) => {
		const errors: Partial<Record<ComplaintValidationField, string>> = {};
		const name = formData.nombres.trim();
		if (
			name.length < 5 ||
			name.split(/\s+/).length < 2 ||
			/^(test|testing|prueba)$/i.test(name)
		)
			errors.nombres = copy.validation.nombres;
		if (
			!countries.some(
				(country) =>
					country.nameES === formData.pais || country.nameEN === formData.pais,
			)
		)
			errors.pais = copy.validation.pais;
		if (!formData.ciudad.trim()) errors.ciudad = copy.validation.ciudad;
		if (!/^[a-z0-9]{8,15}$/i.test(formData.documento.trim()))
			errors.documento = copy.validation.documento;
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()))
			errors.email = copy.validation.email;
		if (!/^\+[1-9]\d{6,14}$/.test(telefono))
			errors.telefono = copy.validation.telefono;
		if (formData.menorEdad === "si" && !formData.datosApoderado.trim())
			errors.datosApoderado = copy.validation.datosApoderado;
		if (!["reclamo", "queja"].includes(formData.tipo))
			errors.tipo = copy.validation.tipo;
		if (formData.detalle.trim().length < 20)
			errors.detalle = copy.validation.detalle;
		return errors;
	};

	const handleSubmit = async (e: { preventDefault: () => void }) => {
		e.preventDefault();
		const telefono = internationalPhone(formData.telefono, codigoPais);
		const validationErrors = clientValidationErrors(telefono);
		const firstInvalidField = complaintFields.find(
			(field) => validationErrors[field],
		);
		if (firstInvalidField) {
			setFieldErrors(validationErrors);
			setModalResult(null);
			focusField(firstInvalidField);
			return;
		}
		setIsSubmitting(true);

		try {
			const response = await fetch("/api/libro-reclamaciones", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...formData,
					telefono,
					codigoPais,
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
				setCodigoPais("");
				setFieldErrors({});
				setModalResult({ kind: "success", message: copy.success });
			} else if (
				result.code === "VALIDATION_ERROR" &&
				complaintFields.includes(result.field as ComplaintValidationField)
			) {
				const field = result.field as ComplaintValidationField;
				setFieldErrors({ [field]: copy.validation[field] });
				setModalResult(null);
				focusField(field);
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

	const inputStyle = {
		backgroundColor: "#ffffff",
		borderColor: colors.border,
		color: colors.foreground,
	};
	const fieldErrorId = (field: ComplaintValidationField) => `lr-${field}-error`;
	const fieldAria = (field: ComplaintValidationField) =>
		fieldErrors[field]
			? {
					"aria-invalid": true,
					"aria-describedby": fieldErrorId(field),
				}
			: {};
	const renderFieldError = (field: ComplaintValidationField) =>
		fieldErrors[field] ? (
			<p
				id={fieldErrorId(field)}
				role="alert"
				className="mt-2 text-sm font-medium text-red-700"
			>
				{fieldErrors[field]}
			</p>
		) : null;

	const stepHeading = (number: number, title: string, description: string) => (
		<div className="mb-6 flex items-start gap-3 sm:gap-4">
			<span
				aria-hidden="true"
				className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/30 text-sm font-semibold text-primary"
			>
				{number}
			</span>
			<div className="min-w-0">
				<h2 className="text-lg font-semibold leading-9 text-foreground">
					<span className="sr-only">{number}. </span>
					{title}
				</h2>
				<p className="mt-1 max-w-2xl text-sm leading-6 text-stone-600">
					{description}
				</p>
			</div>
		</div>
	);

	return (
		<form
			ref={securityForm}
			action="/api/libro-reclamaciones"
			method="post"
			onSubmit={handleSubmit}
			noValidate
			className={`${formClass} space-y-8`}
		>
			{/* Consumer identification */}
			<div>
				{stepHeading(1, copy.consumerTitle, copy.consumerHelp)}

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
							{...fieldAria("nombres")}
							style={inputStyle}
							className="w-full min-w-0 bg-white px-4 py-3 text-base shadow-sm border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-[border-color,box-shadow]"
							placeholder={copy.fullNamePlaceholder}
						/>
						{renderFieldError("nombres")}
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
							onChange={(e) => handleCountryChange(e.target.value)}
							autoComplete="country-name"
							required
							{...fieldAria("pais")}
							style={inputStyle}
							className="w-full min-w-0 bg-white px-4 py-3 text-base shadow-sm border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-[border-color,box-shadow] bg-white"
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
						{renderFieldError("pais")}
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
							{...fieldAria("ciudad")}
							style={inputStyle}
							className="w-full min-w-0 bg-white px-4 py-3 text-base shadow-sm border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-[border-color,box-shadow]"
							placeholder={copy.cityPlaceholder}
						/>
						{renderFieldError("ciudad")}
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
							{...fieldAria("documento")}
							style={inputStyle}
							className="w-full min-w-0 bg-white px-4 py-3 text-base shadow-sm border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-[border-color,box-shadow]"
							placeholder={copy.documentPlaceholder}
						/>
						{renderFieldError("documento")}
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
							{...fieldAria("email")}
							style={inputStyle}
							className="w-full min-w-0 bg-white px-4 py-3 text-base shadow-sm border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-[border-color,box-shadow]"
							placeholder="correo@ejemplo.com"
						/>
						{renderFieldError("email")}
					</div>

					<div>
						<label
							htmlFor="lr-telefono"
							className="block text-sm font-medium mb-2"
							style={{ color: colors.foreground }}
						>
							{copy.phone} <span className="text-secondary">*</span>
						</label>
						<div className="flex overflow-hidden rounded-lg">
							<select
								id="lr-codigo-pais"
								name="codigoPais"
								value={codigoPais}
								onChange={(event) => {
									setCodigoPais(event.target.value);
									clearFieldError("telefono");
								}}
								autoComplete="tel-country-code"
								aria-label={copy.phoneCode}
								style={inputStyle}
								className="border border-r-0 px-3 py-3 text-base outline-none focus:ring-2 focus:ring-primary/20"
							>
								<option value="">+--</option>
								{callingCodes.map((code) => (
									<option key={code} value={code}>
										+{code}
									</option>
								))}
							</select>
							<input
								id="lr-telefono"
								type="tel"
								name="telefono"
								value={formData.telefono}
								onChange={handleChange}
								autoComplete="tel-national"
								inputMode="tel"
								enterKeyHint="next"
								required
								{...fieldAria("telefono")}
								style={{
									...inputStyle,
									borderTopLeftRadius: 0,
									borderBottomLeftRadius: 0,
								}}
								className="w-full min-w-0 bg-white px-4 py-3 text-base shadow-sm border rounded-r-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-[border-color,box-shadow]"
								placeholder="999 999 999"
							/>
						</div>
						{renderFieldError("telefono")}
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
							required={formData.menorEdad === "si"}
							{...fieldAria("datosApoderado")}
							style={inputStyle}
							className="w-full min-w-0 bg-white px-4 py-3 text-base shadow-sm border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-[border-color,box-shadow]"
							placeholder={copy.guardianPlaceholder}
						/>
						{renderFieldError("datosApoderado")}
					</div>
				</div>
			</div>

			{/* Claim statement */}
			<div className="border-t border-stone-200 pt-8">
				{stepHeading(2, copy.claimTitle, copy.claimHelp)}

				<div className="space-y-6">
					<div>
						<label
							htmlFor="lr-tipo-reclamo"
							className="block text-sm font-medium mb-2"
							style={{ color: colors.foreground }}
						>
							{copy.type} <span className="text-secondary">*</span>
						</label>
						<div className="flex flex-wrap gap-3 mt-2">
							<label
								className="inline-flex items-center px-4 py-3 bg-white border rounded-lg cursor-pointer transition-all"
								style={{
									borderColor:
										formData.tipo === "reclamo"
											? colors.primary
											: colors.border,
									backgroundColor: "#ffffff",
								}}
							>
								<input
									id="lr-tipo-reclamo"
									type="radio"
									name="tipo"
									value="reclamo"
									checked={formData.tipo === "reclamo"}
									onChange={() => handleRadioChange("tipo", "reclamo")}
									{...fieldAria("tipo")}
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
								className="inline-flex items-center px-4 py-3 bg-white border rounded-lg cursor-pointer transition-all"
								style={{
									borderColor:
										formData.tipo === "queja" ? colors.primary : colors.border,
									backgroundColor: "#ffffff",
								}}
							>
								<input
									id="lr-tipo-queja"
									type="radio"
									name="tipo"
									value="queja"
									checked={formData.tipo === "queja"}
									onChange={() => handleRadioChange("tipo", "queja")}
									{...fieldAria("tipo")}
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
						{renderFieldError("tipo")}
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
							{...fieldAria("detalle")}
							rows={6}
							style={inputStyle}
							className="w-full min-w-0 bg-white px-4 py-3 text-base shadow-sm border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-[border-color,box-shadow]"
							placeholder={copy.detailPlaceholder}
						></textarea>
						{renderFieldError("detalle")}
					</div>
				</div>
			</div>

			<div className="border-t border-stone-200 pt-8">
				{stepHeading(3, copy.reviewTitle, copy.reviewHelp)}
				<button type="submit" disabled={isSubmitting} className={submitClass}>
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
