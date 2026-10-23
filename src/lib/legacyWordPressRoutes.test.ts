import { describe, expect, test } from "bun:test";
import { isLegacyWordPressQuery } from "./legacyWordPressRoutes";

describe("retired WordPress queries", () => {
	test("recognizes old post IDs and searches, including repeated parameters", () => {
		for (const path of ["/?p=7457", "/?p=x&p=1336", "/es/?s=inca", "/pt?s="]) {
			expect(
				isLegacyWordPressQuery(new URL(path, "https://dreamy.tours")),
			).toBe(true);
		}
	});
	test("preserves booking, tour and campaign parameters", () => {
		for (const path of [
			"/?p=offer",
			"/?utm_source=google",
			"/checkout/?p=7457",
			"/inca-trail-4-days/?s=inca",
			"/blog/?s=inca",
		]) {
			expect(
				isLegacyWordPressQuery(new URL(path, "https://dreamy.tours")),
			).toBe(false);
		}
	});
});
