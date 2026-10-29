import { Resend } from "resend";
import { formSecurityBindings } from "./formSecurity";

const DEFAULT_FROM = "Dreamy Tours <info@dreamy.tours>";
const DEFAULT_TO = "info@dreamy.tours";

async function getMailRuntimeConfig() {
	const env = await formSecurityBindings();
	return {
		dryRun: env.DRY_RUN === "true",
		apiKey: env.RESEND_API_KEY?.trim(),
		from: env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM,
		to: (env.RESEND_TO_EMAIL || DEFAULT_TO)
			.split(",")
			.map((email) => email.trim())
			.filter(Boolean),
	};
}

export async function isResendConfigured() {
	const { apiKey, dryRun } = await getMailRuntimeConfig();
	return dryRun || Boolean(apiKey);
}

export async function getMailDeliveryMode() {
	const { apiKey, dryRun } = await getMailRuntimeConfig();
	if (dryRun) return "dry_run" as const;
	return apiKey ? ("live" as const) : ("unavailable" as const);
}

export async function getResendClient() {
	const { apiKey, dryRun } = await getMailRuntimeConfig();

	if (!apiKey && !dryRun) return null;

	const client = new Resend(apiKey || "dry-run");
	const send = client.emails.send.bind(client.emails);
	client.emails.send = async (...args: Parameters<typeof send>) => {
		if (dryRun) return { data: { id: "dry-run" }, error: null, headers: null };
		return send(...args);
	};
	return client;
}

export async function getDreamySender() {
	return (await getMailRuntimeConfig()).from;
}

export async function getDreamyRecipients() {
	return (await getMailRuntimeConfig()).to;
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
	const resend = await getResendClient();

	if (!resend) {
		return {
			data: null,
			error: new Error("RESEND_API_KEY is not configured"),
		};
	}

	return await resend.emails.send({
		from: await getDreamySender(),
		to: await getDreamyRecipients(),
		replyTo,
		subject,
		html,
	});
}
