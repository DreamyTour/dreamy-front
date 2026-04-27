interface ContactFormProps {
	tourName: string;
}

export default function ContactForm({ tourName }: ContactFormProps) {
	return (
		<div className="bg-white rounded-sm p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 flex flex-col relative overflow-hidden">
			{/* Decorative top bar */}
			<div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary to-secondary"></div>

			<div className="mb-6 mt-2">
				<span className="text-secondary font-bold tracking-wider uppercase text-xs inline-block mb-1">
					Reserva tu aventura
				</span>
				<h3 className="text-xl font-extrabold text-gray-900 leading-tight">
					{tourName}
				</h3>
			</div>

			{/* WhatsApp Button */}
			<a
				href={`https://wa.me/51999999999?text=Hola, estoy interesado en el tour: ${encodeURIComponent(tourName)}`}
				target="_blank"
				rel="noopener noreferrer"
				className="group relative flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white w-full py-3.5 rounded-sm font-bold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 mb-6 overflow-hidden"
			>
				<div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="w-5 h-5 relative z-10"
					fill="currentColor"
					viewBox="0 0 24 24"
				>
					<path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.865 5.233 3.835 8.417-.058 2.801-.738 5.378-2.065 7.746-1.338 2.383-3.479 4.301-5.843 5.686-2.236 1.312-4.655 1.949-7.225 1.947-6.372-.003-11.742-5.178-11.868-11.691zm11.558 6.025c-1.016-.503-2.093-.876-3.284-1.175-.221-.056-.437-.103-.653-.103-.206 0-.412.02-.617.058-.488.09-.96.231-1.399.418-1.14.485-2.156 1.248-2.78 2.206-.63.973-1.038 2.147-1.038 3.423 0 1.275.477 2.466 1.345 3.382.868.916 2.085 1.49 3.395 1.49 1.31 0 2.527-.574 3.395-1.49.868-.916 1.345-2.107 1.345-3.382 0-.085-.005-.17-.012-.254-.025-.318-.073-.633-.143-.943l-.004-.008c-.443-.939-.995-1.779-1.644-2.493l-.004-.004c-.651-.714-1.473-1.554-2.468-1.554-.995 0-1.817.84-2.468 1.554l-.005.006z" />
				</svg>
				<span className="relative z-10 text-[15px]">WhatsApp Directo</span>
			</a>

			<div className="flex items-center gap-4 mb-6">
				<div className="h-px bg-gray-200 flex-1"></div>
				<span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
					o por correo
				</span>
				<div className="h-px bg-gray-200 flex-1"></div>
			</div>

			{/* Contact Form */}
			<form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
				<div>
					<label
						htmlFor="name"
						className="block text-sm font-semibold text-gray-700 mb-1.5"
					>
						Tu nombre{" "}
						<span className="text-red-500" aria-hidden="true">
							*
						</span>
						<span className="sr-only">(requerido)</span>
					</label>
					<input
						type="text"
						id="name"
						name="name"
						required
						autoComplete="name"
						aria-required="true"
						className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400 text-sm"
						placeholder="Ingresa tu nombre completo"
					/>
				</div>

				<div>
					<label
						htmlFor="email"
						className="block text-sm font-semibold text-gray-700 mb-1.5"
					>
						Correo electrónico{" "}
						<span className="text-red-500" aria-hidden="true">
							*
						</span>
						<span className="sr-only">(requerido)</span>
					</label>
					<input
						type="email"
						id="email"
						name="email"
						required
						autoComplete="email"
						aria-required="true"
						className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400 text-sm"
						placeholder="tu@email.com"
					/>
				</div>

				<div>
					<label
						htmlFor="message"
						className="block text-sm font-semibold text-gray-700 mb-1.5"
					>
						Mensaje{" "}
						<span className="text-red-500" aria-hidden="true">
							*
						</span>
						<span className="sr-only">(requerido)</span>
					</label>
					<textarea
						id="message"
						name="message"
						rows={4}
						required
						aria-required="true"
						className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400 resize-none text-sm"
						placeholder="¿En qué fechas te gustaría reservar? ¿Cuántas personas?"
					/>
				</div>

				<button
					type="submit"
					className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-3.5 rounded-sm font-bold transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] mt-2 group"
				>
					<span>Enviar solicitud</span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2.5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M14 5l7 7m0 0l-7 7m7-7H3"
						/>
					</svg>
				</button>
			</form>
		</div>
	);
}
