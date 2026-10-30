const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const FORM_CHALLENGE_MIN_AGE_MS = 3_000;
export const FORM_CHALLENGE_MAX_AGE_MS = 30 * 60_000;

export const protectedFormPaths = new Set([
	"/api/planea-tu-viaje",
	"/api/libro-reclamaciones",
	"/api/checkout",
	"/api/machu-picchu-prebooking",
]);

type FormChallengePayload = {
	v: 1;
	i: number;
	n: string;
	p: string;
};

export type FormChallengeResult =
	| "valid"
	| "too_young"
	| "expired"
	| "invalid"
	| "unavailable";

function toBase64Url(bytes: Uint8Array) {
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
	if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
	try {
		const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
		const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
		return Uint8Array.from(binary, (char) => char.charCodeAt(0));
	} catch {
		return null;
	}
}

async function sign(value: string, secret: string) {
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	return new Uint8Array(
		await crypto.subtle.sign("HMAC", key, encoder.encode(value)),
	);
}

/** Fixed-size signatures are compared without an early-exit byte check. */
function signaturesEqual(left: Uint8Array, right: Uint8Array) {
	if (left.length !== 32 || right.length !== 32) return false;
	let different = 0;
	for (let index = 0; index < left.length; index++) different |= left[index] ^ right[index];
	return different === 0;
}

function nonce() {
	const bytes = crypto.getRandomValues(new Uint8Array(16));
	return toBase64Url(bytes);
}

export async function issueFormChallenge({
	secret,
	path,
	now = Date.now(),
}: {
	secret?: string;
	path: string;
	now?: number;
}) {
	if (!secret?.trim() || !protectedFormPaths.has(path)) return null;
	const payload: FormChallengePayload = { v: 1, i: now, n: nonce(), p: path };
	const encoded = toBase64Url(encoder.encode(JSON.stringify(payload)));
	return `${encoded}.${toBase64Url(await sign(encoded, secret.trim()))}`;
}

export async function validateFormChallenge({
	token,
	secret,
	path,
	now = Date.now(),
}: {
	token: unknown;
	secret?: string;
	path: string;
	now?: number;
}): Promise<FormChallengeResult> {
	if (!secret?.trim()) return "unavailable";
	if (typeof token !== "string" || token.length > 1024) return "invalid";
	const [encoded, supplied] = token.split(".");
	if (!encoded || !supplied || token.split(".").length !== 2) return "invalid";
	const suppliedBytes = fromBase64Url(supplied);
	const payloadBytes = fromBase64Url(encoded);
	if (!suppliedBytes || !payloadBytes) return "invalid";
	const expected = await sign(encoded, secret.trim());
	if (!signaturesEqual(suppliedBytes, expected)) return "invalid";
	let payload: FormChallengePayload;
	try {
		payload = JSON.parse(decoder.decode(payloadBytes));
	} catch {
		return "invalid";
	}
	if (
		payload.v !== 1 ||
		payload.p !== path ||
		!Number.isSafeInteger(payload.i) ||
		typeof payload.n !== "string" ||
		payload.n.length < 16
	)
		return "invalid";
	const age = now - payload.i;
	if (age < FORM_CHALLENGE_MIN_AGE_MS) return "too_young";
	if (age > FORM_CHALLENGE_MAX_AGE_MS) return "expired";
	return "valid";
}
