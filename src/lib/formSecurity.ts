export interface FormSecurityBindings {
	TURNSTILE_SECRET_KEY?: string;
	DRY_RUN?: string;
	RESEND_API_KEY?: string;
	RESEND_FROM_EMAIL?: string;
	RESEND_TO_EMAIL?: string;
	FORM_RATE_LIMITER?: Cloudflare.Env["FORM_RATE_LIMITER"];
}

export async function formSecurityBindings(): Promise<FormSecurityBindings> {
	const { env } = await import("cloudflare:workers");
	return env;
}

export async function isMailDryRun() {
	return (await formSecurityBindings()).DRY_RUN === "true";
}

export type SecurityResult = "allow" | "discard" | 403 | 429 | 503;

/** Logs only the security outcome. Request content, tokens and IP addresses stay out of logs. */
function logSecurityOutcome(request: Request, outcome: string) {
	console.info(
		JSON.stringify({
			event: "form_security",
			endpoint: new URL(request.url).pathname,
			outcome,
		}),
	);
}

/** Trap responses deliberately use the endpoint's normal success response. */
export async function checkFormSecurity(
	request: Request,
	body: Record<string, unknown>,
	bindings?: FormSecurityBindings,
	verifyFetch: typeof fetch = fetch,
	now = Date.now(),
): Promise<SecurityResult> {
	const config = bindings ?? (await formSecurityBindings());
	try {
		if (!config.FORM_RATE_LIMITER) {
			logSecurityOutcome(request, "unavailable");
			return 503;
		}
		const ip = request.headers.get("cf-connecting-ip") || "unknown";
		// Hash IPs before using them as persistent object identifiers.
		const key = Array.from(
			new Uint8Array(
				await crypto.subtle.digest(
					"SHA-256",
					new TextEncoder().encode(`${new URL(request.url).pathname}:${ip}`),
				),
			),
			(b) => b.toString(16).padStart(2, "0"),
		).join("");
		const limiter = config.FORM_RATE_LIMITER.get(
			config.FORM_RATE_LIMITER.idFromName(key),
		);
		if (!(await limiter.consume())) {
			logSecurityOutcome(request, "rate_limited");
			return 429;
		}
		if (typeof body.website === "string" && body.website.trim()) {
			logSecurityOutcome(request, "discarded_honeypot");
			return "discard";
		}
		const token = body["cf-turnstile-response"];
		if (
			typeof token !== "string" ||
			!token ||
			token.length > 2048 ||
			!config.TURNSTILE_SECRET_KEY
		) {
			logSecurityOutcome(request, "turnstile_rejected");
			return 403;
		}
		const renderedAt = Number(body.formRenderedAt);
		// Missing/invalid/future timestamps cannot bypass the time trap.
		if (
			!Number.isFinite(renderedAt) ||
			renderedAt <= 0 ||
			now - renderedAt < 3000
		) {
			logSecurityOutcome(request, "discarded_too_fast");
			return "discard";
		}
		try {
			const response = await verifyFetch(
				"https://challenges.cloudflare.com/turnstile/v0/siteverify",
				{
					method: "POST",
					body: new URLSearchParams({
						secret: config.TURNSTILE_SECRET_KEY,
						response: token,
						...(ip === "unknown" ? {} : { remoteip: ip }),
					}),
					signal: AbortSignal.timeout(8000),
				},
			);
			const result = (await response.json()) as {
				success?: boolean;
				hostname?: string;
			};
			if (!response.ok || result.success !== true) {
				logSecurityOutcome(request, "turnstile_rejected");
				return 403;
			}
			if (result.hostname !== new URL(request.url).hostname) {
				logSecurityOutcome(request, "turnstile_rejected");
				return 403;
			}
			logSecurityOutcome(request, "verified");
			return "allow";
		} catch {
			logSecurityOutcome(request, "turnstile_rejected");
			return 403;
		}
	} catch {
		logSecurityOutcome(request, "unavailable");
		return 503;
	}
}

export function securityError(status: 403 | 429 | 503) {
	return Response.json(
		{
			error:
				status === 429
					? "Too many requests"
					: status === 403
						? "Verification failed"
						: "Service unavailable",
		},
		{
			status,
			headers: {
				"Cache-Control": "no-store",
				...(status === 429 ? { "Retry-After": "600" } : {}),
			},
		},
	);
}
