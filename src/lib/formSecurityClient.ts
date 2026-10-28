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

export function resetFormSecurity(form: HTMLFormElement | null) {
	form?.dispatchEvent(new Event("security-reset"));
}

// Preserve the existing separate calling-code control and formatted phone input.
export function internationalPhone(value: string, callingCode = "") {
	const compact = value.replace(/[\s().-]/g, "");
	if (!compact || compact.startsWith("+")) return compact;
	return callingCode ? `+${callingCode.replace(/^\+/, "")}${compact}` : compact;
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
