import { expect, test } from "bun:test";
import {
	FORM_CHALLENGE_MAX_AGE_MS,
	issueFormChallenge,
	validateFormChallenge,
} from "./formChallenge";

const secret = "test-form-challenge-secret";
const path = "/api/libro-reclamaciones";

async function challenge(issuedAt = 1_000_000) {
	const value = await issueFormChallenge({ secret, path, now: issuedAt });
	if (!value) throw new Error("fixture challenge was not created");
	return value;
}

test("uses Worker time, so browser clock skew cannot make a valid challenge young", async () => {
	const token = await challenge();
	expect(
		await validateFormChallenge({ token, secret, path, now: 1_003_000 }),
	).toBe("valid");
});

test("rejects challenges that are too young, expired, forged or for another route", async () => {
	const token = await challenge();
	expect(
		await validateFormChallenge({ token, secret, path, now: 1_002_999 }),
	).toBe("too_young");
	expect(
		await validateFormChallenge({
			token,
			secret,
			path,
			now: 1_000_000 + FORM_CHALLENGE_MAX_AGE_MS + 1,
		}),
	).toBe("expired");
	expect(
		await validateFormChallenge({
			token: `${token}x`,
			secret,
			path,
			now: 1_003_000,
		}),
	).toBe("invalid");
	expect(
		await validateFormChallenge({
			token,
			secret,
			path: "/api/checkout",
			now: 1_003_000,
		}),
	).toBe("invalid");
});

test("fails closed without its runtime secret and documents replay behavior", async () => {
	const token = await challenge();
	expect(
		await validateFormChallenge({ token, path, now: 1_003_000 }),
	).toBe("unavailable");
	// HMAC proves issuance but deliberately does not make this token one-time.
	expect(
		await validateFormChallenge({ token, secret, path, now: 1_003_000 }),
	).toBe("valid");
	expect(
		await validateFormChallenge({ token, secret, path, now: 1_003_001 }),
	).toBe("valid");
});
