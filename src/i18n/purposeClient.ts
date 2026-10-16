import type { Lang } from "@/lib/i18n";

export const enquiryMessages = {
	es: {
		sending: "Enviando consulta…",
		unavailable:
			"El envío por correo no está disponible en este entorno. Tu consulta todavía no ha sido entregada. Conserva tus datos y contacta con nuestro equipo.",
		success:
			"Gracias por compartir tus preferencias. Hemos recibido tu consulta y te responderemos por correo electrónico.",
		error:
			"No pudimos enviar tu consulta. Tus datos siguen en el formulario; vuelve a intentarlo o utiliza el contacto del sitio.",
		submit: "Solicitar propuesta personalizada →",
		language: "Español",
	},
	en: {
		sending: "Sending enquiry…",
		unavailable:
			"Email delivery is unavailable in this environment. Your enquiry has not been delivered. Keep your details and contact our team.",
		success:
			"Thank you for sharing your preferences. We have received your enquiry and will reply by email.",
		error:
			"We could not send your enquiry. Your details are still in the form; please try again or use the website's contact options.",
		submit: "Request a personalized proposal →",
		language: "English",
	},
	pt: {
		sending: "Enviando consulta…",
		unavailable:
			"O envio por e-mail não está disponível neste ambiente. Sua consulta ainda não foi entregue. Guarde seus dados e entre em contato com nossa equipe.",
		success:
			"Obrigado por compartilhar suas preferências. Recebemos sua consulta e responderemos por e-mail.",
		error:
			"Não foi possível enviar sua consulta. Seus dados continuam no formulário; tente novamente ou use os contatos do site.",
		submit: "Solicite uma proposta personalizada →",
		language: "Português",
	},
} satisfies Record<Lang, Record<string, string>>;
