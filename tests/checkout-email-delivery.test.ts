import { expect, test } from "bun:test";
import { hasConfirmedEmailDelivery } from "../src/pages/api/checkout";

test("checkout rejects a Resend response without an accepted message id", () => {
	expect(hasConfirmedEmailDelivery({})).toBe(false);
	expect(hasConfirmedEmailDelivery({ id: "" })).toBe(false);
	expect(hasConfirmedEmailDelivery({ id: "resend-message-id" })).toBe(true);
});
