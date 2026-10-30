import { useEffect, useRef, useState } from "react";
import { loadTurnstile } from "../../lib/formSecurityClient";

const CHALLENGE_REFRESH_MS = 29 * 60_000;
const NETWORK_RETRY_MS = 15_000;

export default function FormSecurity({ lang = "auto" }: { lang?: string }) {
	const container = useRef<HTMLDivElement>(null);
	const [challenge, setChallenge] = useState("");
	const challengeValue = useRef("");
	const challengeIssuedAt = useRef(0);
	const challengeTimer = useRef<number | undefined>(undefined);
	const challengePending = useRef(false);
	useEffect(() => {
		const node = container.current;
		const form = node?.closest("form");
		if (!node || !form) return;
		let disposed = false;
		let widget: string | undefined;
		const scheduleChallenge = (delay: number) => {
			window.clearTimeout(challengeTimer.current);
			challengeTimer.current = window.setTimeout(
				() => void requestChallenge(),
				delay,
			);
		};
		const requestChallenge = async () => {
			if (disposed || challengePending.current) return;
			challengePending.current = true;
			try {
				const path = new URL(form.action, window.location.href).pathname;
				const response = await fetch(
					`/api/form-challenge?path=${encodeURIComponent(path)}`,
					{ cache: "no-store", credentials: "same-origin" },
				);
				const result = await response.json();
				if (
					response.ok &&
					typeof result.challenge === "string"
				) {
					challengeIssuedAt.current = performance.now();
					challengeValue.current = result.challenge;
					setChallenge(result.challenge);
					scheduleChallenge(CHALLENGE_REFRESH_MS);
				}
			} catch {
				// The Worker fails closed; leave form data intact for a later retry.
				scheduleChallenge(NETWORK_RETRY_MS);
			} finally {
				challengePending.current = false;
			}
		};
		void requestChallenge();
		const reset = () => {
			if (
				!challengeValue.current ||
				performance.now() - challengeIssuedAt.current >= CHALLENGE_REFRESH_MS
			)
				void requestChallenge();
			if (widget) window.turnstile?.reset(widget);
		};
		// Native reset runs before default values are restored.
		const nativeReset = () =>
			queueMicrotask(reset);
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
			window.clearTimeout(challengeTimer.current);
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
			<input type="hidden" name="formChallenge" value={challenge} />
			<div ref={container} style={{ display: "contents" }} />
		</div>
	);
}
