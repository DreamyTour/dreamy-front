type Turnstile = {
	render: (element: HTMLElement, options: Record<string, unknown>) => string;
	reset: (id: string) => void;
	remove: (id: string) => void;
};
declare global {
	interface Window {
		turnstile?: Turnstile;
	}
}

let loading: Promise<Turnstile> | undefined;
export function loadTurnstile(): Promise<Turnstile> {
	if (window.turnstile) return Promise.resolve(window.turnstile);
	return (loading ??= new Promise((resolve, reject) => {
		const script = document.createElement("script");
		script.src =
			"https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
		script.async = true;
		script.onload = () =>
			window.turnstile
				? resolve(window.turnstile)
				: reject(new Error("Turnstile unavailable"));
		script.onerror = () => {
			loading = undefined;
			script.remove();
			reject(new Error("Turnstile unavailable"));
		};
		document.head.append(script);
	}));
}

export function securityFields(form: HTMLFormElement | null) {
	if (!form) return {};
	const data = new FormData(form);
	return Object.fromEntries(
		["website", "formRenderedAt", "cf-turnstile-response"].map((key) => [
			key,
			data.get(key) ?? "",
		]),
	);
}

/**
 * Gets a fresh Turnstile token after an attempted submission without
 * restarting the elapsed-time check. Restarting that clock on every response
 * made a FORM_RETRY response self-perpetuating when the user tried again.
 *
 * Pass `renewTimestamp` only when the form has genuinely been reset for a new
 * entry, rather than when a user is retrying the same entry.
 */
export function resetFormSecurity(
	form: HTMLFormElement | null,
	{ renewTimestamp = false }: { renewTimestamp?: boolean } = {},
) {
	form?.dispatchEvent(
		new CustomEvent("security-reset", { detail: { renewTimestamp } }),
	);
}

// Preserve the existing separate calling-code control and formatted phone input.
export function internationalPhone(value: string, callingCode = "") {
	const compact = value.replace(/[\s().-]/g, "");
	if (!compact || compact.startsWith("+")) return compact;
	const prefix = callingCode.replace(/\D/g, "");
	return prefix ? `+${prefix}${compact}` : compact;
}

export function protectedFormData(form: HTMLFormElement) {
	const data = new FormData(form);
	if (data.has("telefono"))
		data.set(
			"telefono",
			internationalPhone(
				String(data.get("telefono") ?? ""),
				String(data.get("codigoPais") ?? ""),
			),
		);
	return data;
}
