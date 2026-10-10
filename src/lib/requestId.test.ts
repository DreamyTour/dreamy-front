import { expect, test } from "bun:test";
import { createRequestId } from "./requestId";

test("uses the native UUID generator when available", () => {
	const id = "123e4567-e89b-42d3-a456-426614174000";
	expect(
		createRequestId({
			randomUUID: () => id,
			getRandomValues: () => {
				throw new Error("Native generation should be used");
			},
		}),
	).toBe(id);
});

test("generates distinct valid v4 UUIDs without randomUUID", () => {
	const provider = { getRandomValues: crypto.getRandomValues.bind(crypto) };
	const identifiers = new Set<string>();
	for (let index = 0; index < 256; index++) {
		const id = createRequestId(provider);
		expect(id).toMatch(
			/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i,
		);
		identifiers.add(id);
	}
	expect(identifiers.size).toBe(256);
});
