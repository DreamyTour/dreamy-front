import { Resend } from "resend";

const DEFAULT_FROM = "Dreamy Tours <info@dreamy.tours>";
const DEFAULT_TO = "info@dreamy.tours";

function readProcessEnv(name: string) {
	if (typeof process === "undefined") return undefined;
	return process.env?.[name];
}

export function getResendApiKey() {
	return import.meta.env.RESEND_API_KEY || readProcessEnv("RESEND_API_KEY");
}

export function isResendConfigured() {
	return Boolean(getResendApiKey());
}

export function getResendClient() {
	const apiKey = getResendApiKey();

	if (!apiKey) return null;

	return new Resend(apiKey);
}

export function getDreamySender() {
	return (
		import.meta.env.RESEND_FROM_EMAIL ||
		readProcessEnv("RESEND_FROM_EMAIL") ||
		DEFAULT_FROM
	);
}

export function getDreamyRecipients() {
	const recipients =
		import.meta.env.RESEND_TO_EMAIL || readProcessEnv("RESEND_TO_EMAIL");

	if (!recipients) return [DEFAULT_TO];

	return recipients
		.split(",")
		.map((email) => email.trim())
		.filter(Boolean);
}

export async function sendDreamyEmail({
	replyTo,
	subject,
	html,
}: {
	replyTo?: string;
	subject: string;
	html: string;
}) {
	const resend = getResendClient();

	if (!resend) {
		return {
			data: null,
			error: new Error("RESEND_API_KEY is not configured"),
		};
	}

	return await resend.emails.send({
		from: getDreamySender(),
		to: getDreamyRecipients(),
		replyTo,
		subject,
		html,
	});
}
