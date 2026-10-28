import { useEffect, useRef, useState } from "react";
import { loadTurnstile } from "../../lib/formSecurityClient";

export default function FormSecurity({ lang = "auto" }: { lang?: string }) {
	const container = useRef<HTMLDivElement>(null);
	const [renderedAt, setRenderedAt] = useState("");
	useEffect(() => {
		const node = container.current;
		const form = node?.closest("form");
		if (!node || !form) return;
		let disposed = false;
		let widget: string | undefined;
		setRenderedAt(String(Date.now()));
		const reset = () => {
			setRenderedAt(String(Date.now()));
			if (widget) window.turnstile?.reset(widget);
		};
		// Native reset runs before default values are restored.
		const nativeReset = () => queueMicrotask(reset);
		form.addEventListener("reset", nativeReset);
		form.addEventListener("security-reset", reset);
		const key = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY;
		if (key)
			void loadTurnstile()
				.then((api) => {
					if (!disposed)
						widget = api.render(node, {
							sitekey: key,
							language: lang,
							appearance: "interaction-only",
							size: "flexible",
						});
				})
				.catch(() => {
					/* Server fails closed; existing form error UI handles submission. */
				});
		return () => {
			disposed = true;
			form.removeEventListener("reset", nativeReset);
			form.removeEventListener("security-reset", reset);
			if (widget) window.turnstile?.remove(widget);
		};
	}, [lang]);
	return (
		<div style={{ display: "contents" }}>
			<input
				type="text"
				name="website"
				style={{ display: "none" }}
				tabIndex={-1}
				autoComplete="off"
				aria-hidden="true"
			/>
			<input
				type="hidden"
				name="formRenderedAt"
				value={renderedAt}
			/>
			<div ref={container} style={{ display: "contents" }} />
		</div>
	);
}
