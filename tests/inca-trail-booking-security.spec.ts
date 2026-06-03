import { expect, test } from "@playwright/test";

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const testMonth = Math.min(currentMonth + 1, 12);
const testDate = `${currentYear}-${String(testMonth).padStart(2, "0")}-15`;

const completePassenger = {
	name: "Ana",
	lastname: "Torres",
	gender: "Female",
	dob: "1990-05-12",
	documentType: "Passport",
	documentNumber: "P123456",
	country: "PE",
};

const completeContact = {
	firstname: "Maria",
	lastname: "Lopez",
	email: "maria@example.com",
	phoneCode: "+51",
	phone: "999888777",
};

const bookingCalendarTours = [
	{ path: "/inca-trail-4-days", road: "1", durationDays: 4, spaces: 12 },
	{ path: "/es/camino-inca-4-dias", road: "1", durationDays: 4, spaces: 11 },
	{ path: "/pt/trilha-inca-4-dias", road: "1", durationDays: 4, spaces: 10 },
	{ path: "/short-inca-trail-2-days", road: "5", durationDays: 2, spaces: 8 },
	{
		path: "/es/camino-inca-corto-2-dias",
		road: "5",
		durationDays: 2,
		spaces: 7,
	},
	{ path: "/pt/trilha-inca-2-dias", road: "5", durationDays: 2, spaces: 6 },
] as const;

function checkoutPayload(overrides = {}) {
	return {
		passengersInfo: [completePassenger, completePassenger],
		contactInfo: completeContact,
		cart: {
			tourName: "Inca Trail 4 Days",
			date: testDate,
			passengers: 2,
			totalPrice: 1240,
			amountPaid: 1,
			amountToPayLabel: "minimum",
			lang: "en",
		},
		...overrides,
	};
}

async function waitForBookingIslandHydration(page: import("@playwright/test").Page) {
	await page.waitForFunction(() =>
		Array.from(document.querySelectorAll("astro-island")).some(
			(island) =>
				island.getAttribute("component-url")?.includes("BookingForm") &&
				!island.hasAttribute("ssr"),
		),
	);
}

test("Inca Trail booking form creates a coherent checkout cart without sticky internal scroll", async ({
	page,
}) => {
	const requestedRoads: string[] = [];

	await page.route("**/api/calendar-tickets**", async (route) => {
		const url = new URL(route.request().url());
		const requestedRoad = url.searchParams.get("road");

		if (requestedRoad) requestedRoads.push(requestedRoad);

		await route.fulfill({
			contentType: "application/json",
			body: JSON.stringify({
				tickets: {
					[testDate]: 12,
				},
			}),
		});
	});

	await page.goto("/inca-trail-4-days", { waitUntil: "domcontentloaded" });

	await page
		.getByRole("link", { name: /reservar en linea|reservar en línea|book/i })
		.first()
		.click();
	const form = page.locator("#tour-contact-form");
	await form.scrollIntoViewIfNeeded();
	await expect(form.getByRole("heading", { name: "Reserva" })).toBeVisible({
		timeout: 20000,
	});
	await waitForBookingIslandHydration(page);
	await expect(form.getByText("Elija la fecha de su viaje")).toHaveCount(0);
	await expect(
		form.getByRole("combobox", { name: /route|ruta|rota/i }),
	).toHaveCount(0);

	const formLayout = await form.evaluate((element) => {
		const styles = window.getComputedStyle(element);
		return {
			position: styles.position,
			overflowY: styles.overflowY,
			maxHeight: styles.maxHeight,
		};
	});
	expect(formLayout.position).not.toBe("sticky");
	expect(formLayout.overflowY).not.toBe("auto");
	expect(formLayout.maxHeight).toBe("none");

	if (testMonth > currentMonth) {
		await expect(
			form.getByRole("button", { name: /next|siguiente|proximo/i }),
		).toBeEnabled();
		await form
			.getByRole("button", { name: /next|siguiente|proximo/i })
			.click();
		await expect(
			form.getByText(new RegExp(`\\b${currentYear}\\b`, "i")).first(),
		).toBeVisible();
	}

	await expect(
		form.getByRole("button", {
			name: new RegExp(`${testDate}.*12.*(spaces|cupos|vagas)`, "i"),
		}),
	).toBeVisible();
	await form
		.getByRole("button", {
			name: new RegExp(`${testDate}.*12.*(spaces|cupos|vagas)`, "i"),
		})
		.click();
	await expect(form.locator('button[aria-pressed="true"]')).toHaveCount(4);

	await form.getByRole("button", { name: /aumentar/i }).click();
	await form.getByRole("button", { name: /book now/i }).click();

	await expect(page).toHaveURL(/\/checkout$/);

	const cart = await page.evaluate(() => {
		const rawCart = window.localStorage.getItem("bookingCart");
		return rawCart ? JSON.parse(rawCart) : null;
	});

	expect(cart).toMatchObject({
		date: testDate,
		durationDays: 4,
		road: "1",
		availability: 12,
		passengers: 2,
		lang: "en",
		tourPath: "/inca-trail-4-days",
	});
	expect(requestedRoads.length).toBeGreaterThan(0);
	expect(new Set(requestedRoads)).toEqual(new Set(["1"]));
	expect(cart.pricePerPerson).toBeGreaterThan(0);
	expect(cart.totalPrice).toBe(cart.pricePerPerson * cart.passengers);
});

test("Booking calendar island hydrates with the locked route on every allowed Inca Trail slug", async ({
	page,
}) => {
	for (const tour of bookingCalendarTours) {
		const requestedRoads: string[] = [];

		await page.unroute("**/api/calendar-tickets**").catch(() => {});
		await page.route("**/api/calendar-tickets**", async (route) => {
			const url = new URL(route.request().url());
			const requestedRoad = url.searchParams.get("road");

			if (requestedRoad) requestedRoads.push(requestedRoad);

			await route.fulfill({
				contentType: "application/json",
				body: JSON.stringify({
					tickets: {
						[testDate]: tour.spaces,
					},
				}),
			});
		});

		await page.goto(tour.path, { waitUntil: "domcontentloaded" });

		const form = page.locator("#tour-contact-form");
		await form.scrollIntoViewIfNeeded();
		await expect(form.getByRole("heading", { name: "Reserva" })).toBeVisible({
			timeout: 20000,
		});
		await waitForBookingIslandHydration(page);
		await expect(
			form.getByRole("combobox", { name: /route|ruta|rota/i }),
		).toHaveCount(0);
		await expect(form.locator('select[name="travel-month"]')).toBeVisible();

		if (testMonth > currentMonth) {
			await form
				.getByRole("button", { name: /next|siguiente|proximo/i })
				.click();
		}

		await form
			.getByRole("button", {
				name: new RegExp(
					`${testDate}.*${tour.spaces}.*(spaces|cupos|vagas)`,
					"i",
				),
			})
			.click();

		await expect(form.locator('button[aria-pressed="true"]')).toHaveCount(
			tour.durationDays,
		);
		expect(requestedRoads.length).toBeGreaterThan(0);
		expect(new Set(requestedRoads)).toEqual(new Set([tour.road]));
	}
});

test("Short Inca Trail calendar locks route 5 and marks a two day trip", async ({
	page,
}) => {
	const requestedRoads: string[] = [];

	await page.route("**/api/calendar-tickets**", async (route) => {
		const url = new URL(route.request().url());
		const requestedRoad = url.searchParams.get("road");

		if (requestedRoad) requestedRoads.push(requestedRoad);

		await route.fulfill({
			contentType: "application/json",
			body: JSON.stringify({
				tickets: {
					[testDate]: 8,
				},
			}),
		});
	});

	await page.goto("/short-inca-trail-2-days", {
		waitUntil: "domcontentloaded",
	});
	await page
		.getByRole("link", { name: /reservar en linea|reservar en lÃ­nea|book/i })
		.first()
		.click();

	const form = page.locator("#tour-contact-form");
	await form.scrollIntoViewIfNeeded();
	await expect(form.getByRole("heading", { name: "Reserva" })).toBeVisible({
		timeout: 20000,
	});
	await expect(
		form.getByRole("combobox", { name: /route|ruta|rota/i }),
	).toHaveCount(0);

	if (testMonth > currentMonth) {
		await form
			.getByRole("button", { name: /next|siguiente|proximo/i })
			.click();
	}

	await form
		.getByRole("button", {
			name: new RegExp(`${testDate}.*8.*(spaces|cupos|vagas)`, "i"),
		})
		.click();
	await expect(form.locator('button[aria-pressed="true"]')).toHaveCount(2);

	await form.getByRole("button", { name: /book now/i }).click();
	await expect(page).toHaveURL(/\/checkout$/);

	const cart = await page.evaluate(() => {
		const rawCart = window.localStorage.getItem("bookingCart");
		return rawCart ? JSON.parse(rawCart) : null;
	});

	expect(cart).toMatchObject({
		date: testDate,
		durationDays: 2,
		road: "5",
		availability: 8,
		tourPath: "/short-inca-trail-2-days",
	});
	expect(requestedRoads.length).toBeGreaterThan(0);
	expect(new Set(requestedRoads)).toEqual(new Set(["5"]));
});

test("Unlisted Inca Trail tours use the default contact form instead of the calendar", async ({
	page,
}) => {
	await page.goto("/private-full-day-inca-trail", {
		waitUntil: "domcontentloaded",
	});
	await page
		.getByRole("link", { name: /reservar en linea|reservar en lÃ­nea|book/i })
		.first()
		.click();

	const form = page.locator("#tour-contact-form");
	await form.scrollIntoViewIfNeeded();

	await expect(form.locator("[data-contact-form-root]")).toBeVisible();
	await expect(form.getByRole("heading", { name: "Reserva" })).toHaveCount(0);
	await expect(
		form.getByRole("combobox", { name: /route|ruta|rota/i }),
	).toHaveCount(0);
	await expect(
		form.locator('select[name="travel-month"]'),
	).toHaveCount(0);
});

test("checkout API recalculates payment amount instead of trusting a tampered client amount", async ({
	request,
}) => {
	const response = await request.post("/api/checkout", {
		data: checkoutPayload(),
	});

	expect(response.ok()).toBe(true);
	const body = await response.json();
	const redirectUrl = new URL(body.redirectUrl);

	expect(redirectUrl.hostname).toBe("www.paypal.com");
	expect(redirectUrl.searchParams.get("amount")).toBe("669.60");
	expect(redirectUrl.searchParams.get("item_name")).toBe("Inca Trail 4 Days");
});

test("checkout API rejects risky or incomplete booking payloads", async ({
	request,
}) => {
	const invalidPayloads = [
		checkoutPayload({
			cart: {
				tourName: "Inca Trail 4 Days",
				date: testDate,
				passengers: 2,
				totalPrice: -1240,
				amountToPayLabel: "minimum",
				lang: "en",
			},
		}),
		checkoutPayload({
			passengersInfo: [completePassenger],
		}),
		checkoutPayload({
			contactInfo: {
				...completeContact,
				email: "not-an-email",
			},
		}),
		checkoutPayload({
			passengersInfo: [
				{
					...completePassenger,
					documentNumber: "",
				},
				completePassenger,
			],
		}),
	];

	for (const payload of invalidPayloads) {
		const response = await request.post("/api/checkout", { data: payload });
		expect(response.status()).toBe(400);
		const body = await response.json();
		expect(body.error).toBeTruthy();
	}
});
