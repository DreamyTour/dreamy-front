import { describe, expect, test } from "bun:test";
import {
	getAgeOnDate,
	getPreferredPaymentAmount,
	isAdultBookingHolder,
	isPlausibleBirthDate,
	isStrictDateKey,
} from "@/lib/prebooking";

describe("prebooking validation", () => {
	test("accepts only real ISO calendar dates", () => {
		expect(isStrictDateKey("2026-08-29")).toBe(true);
		expect(isStrictDateKey("2026-02-29")).toBe(false);
		expect(isStrictDateKey("2026-8-29")).toBe(false);
		expect(isStrictDateKey("not-a-date")).toBe(false);
	});

	test("calculates age using month and day", () => {
		expect(getAgeOnDate("2008-08-29", "2026-08-29")).toBe(18);
		expect(getAgeOnDate("2008-08-30", "2026-08-29")).toBe(17);
	});

	test("requires the booking holder to be an adult", () => {
		expect(isAdultBookingHolder("2008-08-29", "2026-08-29")).toBe(true);
		expect(isAdultBookingHolder("2020-01-01", "2026-08-29")).toBe(false);
	});

	test("rejects future and implausibly old birth dates", () => {
		expect(isPlausibleBirthDate("2027-01-01", "2026-08-29")).toBe(false);
		expect(isPlausibleBirthDate("1900-01-01", "2026-08-29")).toBe(false);
	});

	test("calculates a payment preference without a payment fee", () => {
		expect(getPreferredPaymentAmount(1240, "minimum")).toBe(620);
		expect(getPreferredPaymentAmount(1240, "total")).toBe(1240);
	});
});
