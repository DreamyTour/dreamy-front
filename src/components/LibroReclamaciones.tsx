"use client";

import { useState } from "react";
import countriesData from "@/data/countries.json";

// Colores del theme (definidos en global.css)
const colors = {
	primary: "oklch(0.66 0.18 148)",
	secondary: "oklch(0.62 0.22 20)",
	primaryForeground: "#ffffff",
	muted: "oklch(0.92 0.02 240)",
	border: "oklch(0.9 0.01 240)",
	foreground: "oklch(0.16 0.06 150)",
};

export default function LibroReclamaciones() {
	const [formData, setFormData] = useState({
		nombres: "",
		pais: "",
		documento: "",
		email: "",
		telefono: "",
		menorEdad: "no",
		datosApoderado: "",
		tipo: "reclamo",
		detalle: "",
	});

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitStatus, setSubmitStatus] = useState<
		"idle" | "success" | "error"
	>("idle");

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleRadioChange = (name: string, value: string) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setSubmitStatus("idle");

		try {
			const response = await fetch("/api/libro-reclamaciones", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			const result = await response.json();

			if (response.ok && result.success) {
				setSubmitStatus("success");
				setFormData({
					nombres: "",
					pais: "",
					documento: "",
					email: "",
					telefono: "",
					menorEdad: "no",
					datosApoderado: "",
					tipo: "reclamo",
					detalle: "",
				});
				alert(
					"Su reclamación ha sido enviada correctamente. Nos pondremos en contacto en un plazo máximo de 30 días hábiles.",
				);
			} else {
				throw new Error(result.error || "Error en el envío");
			}
		} catch (error) {
			console.error("Error:", error);
			setSubmitStatus("error");
			alert(
				"Hubo un error al enviar su reclamación. Por favor intente nuevamente o contáctenos directamente.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const getButtonClass = () => {
		if (submitStatus === "success") {
			return "from-green-500 to-green-600";
		}
		if (submitStatus === "error") {
			return "from-red-500 to-red-600";
		}
		// Usar color primario
		return "hover:brightness-110";
	};

	const buttonStyle = () => {
		if (submitStatus === "success") {
			return {
				background: "linear-gradient(to right, #22c55e, #16a34a)",
				color: "#fff",
			};
		}
		if (submitStatus === "error") {
			return {
				background: "linear-gradient(to right, #ef4444, #dc2626)",
				color: "#fff",
			};
		}
		return {
			background: `linear-gradient(to right, ${colors.primary}, oklch(0.6 0.15 148))`,
			color: colors.primaryForeground,
		};
	};

	const inputStyle = {
		borderColor: colors.border,
		color: colors.foreground,
	};

	const focusRingStyle = {
		"--tw-ring-color": colors.primary,
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* IDENTIFICACIÓN DEL CONSUMIDOR RECLAMANTE */}
			<div>
				<h3
					className="text-lg font-semibold mb-4"
					style={{ color: colors.foreground }}
				>
					IDENTIFICACIÓN DEL CONSUMIDOR RECLAMANTE
				</h3>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="md:col-span-2">
						<label
							className="block text-sm font-medium mb-2"
							style={{ color: colors.foreground }}
						>
							Nombres <span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							name="nombres"
							value={formData.nombres}
							onChange={handleChange}
							required
							style={inputStyle}
							className="w-full px-4 py-3 border rounded-lg focus:ring-2 transition-all"
							placeholder="Ingrese sus nombres completos"
						/>
					</div>

					<div>
						<label
							className="block text-sm font-medium mb-2"
							style={{ color: colors.foreground }}
						>
							País <span className="text-red-500">*</span>
						</label>
						<select
							name="pais"
							value={formData.pais}
							onChange={(e) => handleChange(e as any)}
							required
							style={inputStyle}
							className="w-full px-4 py-3 border rounded-lg focus:ring-2 transition-all bg-white"
						>
							<option value="">Selecciona tu país</option>
							{countriesData
								.map((c: any) => (
									<option key={`lr-country-${c.iso2}`} value={c.nameES}>
										{c.nameES}
									</option>
								))
								.sort((a: any, b: any) =>
									a.props.children.localeCompare(b.props.children),
								)}
						</select>
					</div>

					<div>
						<label
							className="block text-sm font-medium mb-2"
							style={{ color: colors.foreground }}
						>
							N° Documento (DNI / Pasaporte){" "}
							<span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							name="documento"
							value={formData.documento}
							onChange={handleChange}
							required
							style={inputStyle}
							className="w-full px-4 py-3 border rounded-lg focus:ring-2 transition-all"
							placeholder="Ingrese su número de documento"
						/>
					</div>

					<div>
						<label
							className="block text-sm font-medium mb-2"
							style={{ color: colors.foreground }}
						>
							Email <span className="text-red-500">*</span>
						</label>
						<input
							type="email"
							name="email"
							value={formData.email}
							onChange={handleChange}
							required
							style={inputStyle}
							className="w-full px-4 py-3 border rounded-lg focus:ring-2 transition-all"
							placeholder="correo@ejemplo.com"
						/>
					</div>

					<div>
						<label
							className="block text-sm font-medium mb-2"
							style={{ color: colors.foreground }}
						>
							Teléfono <span className="text-red-500">*</span>
						</label>
						<input
							type="tel"
							name="telefono"
							value={formData.telefono}
							onChange={handleChange}
							required
							style={inputStyle}
							className="w-full px-4 py-3 border rounded-lg focus:ring-2 transition-all"
							placeholder="+51 999 999 999"
						/>
					</div>

					<div>
						<label
							className="block text-sm font-medium mb-2"
							style={{ color: colors.foreground }}
						>
							¿Eres Menor de edad? <span className="text-red-500">*</span>
						</label>
						<div className="flex gap-4 mt-2">
							<label className="inline-flex items-center cursor-pointer">
								<input
									type="radio"
									name="menorEdad"
									value="no"
									checked={formData.menorEdad === "no"}
									onChange={() => handleRadioChange("menorEdad", "no")}
									style={{ accentColor: colors.primary }}
								/>
								<span className="ml-2" style={{ color: colors.foreground }}>
									No
								</span>
							</label>
							<label className="inline-flex items-center cursor-pointer">
								<input
									type="radio"
									name="menorEdad"
									value="si"
									checked={formData.menorEdad === "si"}
									onChange={() => handleRadioChange("menorEdad", "si")}
									style={{ accentColor: colors.primary }}
								/>
								<span className="ml-2" style={{ color: colors.foreground }}>
									Sí
								</span>
							</label>
						</div>
					</div>

					<div
						className={formData.menorEdad === "si" ? "md:col-span-2" : "hidden"}
					>
						<label
							className="block text-sm font-medium mb-2"
							style={{ color: colors.foreground }}
						>
							Datos del Padre, Madre o Apoderado{" "}
							<span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							name="datosApoderado"
							value={formData.datosApoderado}
							onChange={handleChange}
							style={inputStyle}
							className="w-full px-4 py-3 border rounded-lg focus:ring-2 transition-all"
							placeholder="Nombre completo del padre, madre o apoderado"
						/>
					</div>
				</div>
			</div>

			{/* MANIFIESTO DEL CONSUMIDOR RECLAMANTE */}
			<div>
				<h3
					className="text-lg font-semibold mb-4 pt-4 border-t"
					style={{ color: colors.foreground, borderColor: colors.border }}
				>
					MANIFIESTO DEL CONSUMIDOR RECLAMANTE
				</h3>

				<div className="space-y-6">
					<div>
						<label
							className="block text-sm font-medium mb-2"
							style={{ color: colors.foreground }}
						>
							Tipo <span className="text-red-500">*</span>
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
									Reclamo
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
									Queja
								</span>
							</label>
						</div>
					</div>

					<div>
						<label
							className="block text-sm font-medium mb-2"
							style={{ color: colors.foreground }}
						>
							Detalle de la Reclamación o Queja{" "}
							<span className="text-red-500">*</span>
						</label>
						<textarea
							name="detalle"
							value={formData.detalle}
							onChange={handleChange}
							required
							rows={6}
							style={inputStyle}
							className="w-full px-4 py-3 border rounded-lg focus:ring-2 transition-all"
							placeholder="Describa detalladamente su reclamo o queja..."
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
					{isSubmitting
						? "⏳ Enviando..."
						: submitStatus === "success"
							? "✅ Enviado exitosamente"
							: submitStatus === "error"
								? "❌ Error al enviar"
								: "Enviar"}
				</button>
			</div>
		</form>
	);
}
