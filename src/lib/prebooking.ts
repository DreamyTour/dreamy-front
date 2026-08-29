export const MIN_BOOKING_HOLDER_AGE = 18;
export const MAX_TRAVELER_AGE = 120;
export const MAX_PASSENGERS_PER_BOOKING = 20;

export type PaymentPreference = "minimum" | "total";

export function isStrictDateKey(value: unknown): value is string {
	if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return false;
	}

	const [year, month, day] = value.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));

	return (
		date.getUTCFullYear() === year &&
		date.getUTCMonth() === month - 1 &&
		date.getUTCDate() === day
	);
}

export function getDateKeyInTimeZone(
	date = new Date(),
	timeZone = "America/Lima",
) {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(date);
	const values = new Map(parts.map((part) => [part.type, part.value]));

	return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
}

export function getAgeOnDate(
	dateOfBirth: string,
	referenceDate: string,
): number | null {
	if (!isStrictDateKey(dateOfBirth) || !isStrictDateKey(referenceDate)) {
		return null;
	}

	const [birthYear, birthMonth, birthDay] = dateOfBirth.split("-").map(Number);
	const [year, month, day] = referenceDate.split("-").map(Number);
	let age = year - birthYear;

	if (month < birthMonth || (month === birthMonth && day < birthDay)) {
		age -= 1;
	}

	return age;
}

export function isPlausibleBirthDate(
	dateOfBirth: string,
	referenceDate: string,
) {
	const age = getAgeOnDate(dateOfBirth, referenceDate);
	return age !== null && age >= 0 && age <= MAX_TRAVELER_AGE;
}

export function isAdultBookingHolder(
	dateOfBirth: string,
	referenceDate: string,
) {
	const age = getAgeOnDate(dateOfBirth, referenceDate);
	return age !== null && age >= MIN_BOOKING_HOLDER_AGE;
}

export function getPreferredPaymentAmount(
	totalPrice: number,
	preference: PaymentPreference,
) {
	return preference === "total" ? totalPrice : totalPrice / 2;
}
