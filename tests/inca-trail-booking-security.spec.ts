import { expect, test } from "@playwright/test";
import { getIncaTrailBookingConfig } from "../src/lib/incaTrailBooking";

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
	email: "maria@example.com",
	phone: "999888777",
};

function addDaysToDateKey(dateKey: string, daysToAdd: number) {
	const [year, month, day] = dateKey.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day + daysToAdd));

	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
		2,
		"0",
	)}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function formatDateRange(dateKey: string, durationDays: number) {
	const formatDate = (value: string) => {
		const [year, month, day] = value.split("-");
		return `${day}/${month}/${year}`;
	};
	if (durationDays <= 1) return formatDate(dateKey);

	return `${formatDate(dateKey)} a ${formatDate(
		addDaysToDateKey(dateKey, durationDays - 1),
	)}`;
}

const bookingCalendarTours = [
	{
		path: "/inca-trail-4-days",
		road: "1",
		durationDays: 4,
		permitStartOffsetDays: 0,
		spaces: 12,
	},
	{
		path: "/es/camino-inca-4-dias",
		road: "1",
		durationDays: 4,
		permitStartOffsetDays: 0,
		spaces: 11,
	},
	{
		path: "/pt/trilha-inca-4-dias",
		road: "1",
		durationDays: 4,
		permitStartOffsetDays: 0,
		spaces: 10,
	},
	{
		path: "/short-inca-trail-2-days",
		road: "5",
		durationDays: 2,
		permitStartOffsetDays: 0,
		spaces: 8,
	},
	{
		path: "/es/camino-inca-corto-2-dias",
		road: "5",
		durationDays: 2,
		permitStartOffsetDays: 0,
		spaces: 7,
	},
	{
		path: "/pt/trilha-inca-2-dias",
		road: "5",
		durationDays: 2,
		permitStartOffsetDays: 0,
		spaces: 6,
	},
	{
		path: "/private-full-day-inca-trail",
		road: "5",
		durationDays: 1,
		permitStartOffsetDays: 0,
		spaces: 9,
	},
	{
		path: "/es/camino-inca-full-day-privado",
		road: "5",
		durationDays: 1,
		permitStartOffsetDays: 0,
		spaces: 9,
	},
	{
		path: "/pt/trilha-inca-full-day-privado",
		road: "5",
		durationDays: 1,
		permitStartOffsetDays: 0,
		spaces: 9,
	},
	{
		path: "/lares-trek-short-inca-trail-4-days",
		road: "5",
		durationDays: 4,
		permitStartOffsetDays: 2,
		spaces: 7,
	},
	{
		path: "/es/lares-trek-camino-inca-corto-4-dias",
		road: "5",
		durationDays: 4,
		permitStartOffsetDays: 2,
		spaces: 7,
	},
	{
		path: "/pt/lares-trek-caminho-inca-curto-4-dias",
		road: "5",
		durationDays: 4,
		permitStartOffsetDays: 2,
		spaces: 7,
	},
	{
		path: "/salkantay-inca-trail-to-6-days",
		road: "1",
		durationDays: 6,
		permitStartOffsetDays: 2,
		spaces: 5,
	},
	{
		path: "/es/salkantay-camino-inca-6-dias",
		road: "1",
		durationDays: 6,
		permitStartOffsetDays: 2,
		spaces: 5,
	},
	{
		path: "/pt/salkantay-caminho-inca-6-dias",
		road: "1",
		durationDays: 6,
		permitStartOffsetDays: 2,
		spaces: 5,
	},
] as const;

function checkoutPayload(overrides = {}) {
	return {
		passengersInfo: [completePassenger, completePassenger],
		contactInfo: completeContact,
		cart: {
			quoteRequestId: "123e4567-e89b-42d3-a456-426614174000",
			tourName: "Inca Trail 4 Days",
			date: testDate,
			passengers: 2,
			totalPrice: 1240,
			paymentPreference: "minimum",
			lang: "en",
		},
		...overrides,
	};
}

async function waitForBookingIslandHydration(
	page: import("@playwright/test").Page,
) {
	await page.waitForFunction(() =>
		Array.from(document.querySelectorAll("astro-island")).some(
			(island) =>
				island
					.getAttribute("component-url")
					?.includes("IncaTrailAvailabilityBooking") &&
				!island.hasAttribute("ssr"),
		),
	);
}

test("Inca Trail reservation reaches checkout when randomUUID is unavailable", async ({
	page,
}) => {
	await page.addInitScript(() => {
		Object.defineProperty(Crypto.prototype, "randomUUID", {
			value: undefined,
			configurable: true,
		});
	});
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

	await expect(page.locator(".booking-summary")).toBeVisible();
	const tourTitle = await page.locator("#booking-summary-title").innerText();
	await expect(
		page.locator(".booking-summary").getByRole("combobox"),
	).toHaveCount(0);
	await page.locator(".booking-summary .reserve").click({ noWaitAfter: true });
	await expect(page).toHaveURL(/availability|disponibilidad|disponibilidade/);
	const form = page.locator("#availability-calendar");

	await expect(form.locator("[data-calendar-months]")).toBeVisible({
		timeout: 20000,
	});
	await waitForBookingIslandHydration(page);
	await expect(form.getByText("Elija la fecha de su viaje")).toHaveCount(0);
	await expect(form.locator("#availability-tour")).toHaveCount(0);
	await expect(page.getByRole("heading", { level: 1 })).toHaveText(
		`Tour booking ${tourTitle}`,
	);

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
			form.getByRole("button", { name: /next|siguiente|pr[o\u00f3]ximo/i }),
		).toBeEnabled();
		await form
			.getByRole("button", { name: /next|siguiente|pr[o\u00f3]ximo/i })
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
	await expect(
		form.locator('button[data-calendar-date][aria-pressed="true"]'),
	).toHaveCount(4);
	await expect(
		form.getByText(formatDateRange(testDate, 4)).first(),
	).toBeVisible();

	await form.getByRole("button", { name: /increase|aumentar/i }).click();
	await form
		.getByRole("button", { name: /book now/i })
		.click({ noWaitAfter: true });

	await expect(page).toHaveURL(/\/checkout\/?$/);

	const cart = await page.evaluate(() => {
		const rawCart = window.localStorage.getItem("bookingCart");
		return rawCart ? JSON.parse(rawCart) : null;
	});

	expect(cart).toMatchObject({
		quoteRequestId: expect.stringMatching(
			/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i,
		),
		date: testDate,
		durationDays: 4,
		road: "1",
		availability: 12,
		passengers: 2,
		lang: "en",
		tourPath: expect.stringMatching(/^\/inca-trail-4-days\/?$/),
	});
	expect(requestedRoads.length).toBeGreaterThan(0);
	expect(new Set(requestedRoads)).toEqual(new Set(["1"]));
	expect(cart.pricePerPerson).toBeGreaterThan(0);
	expect(cart.totalPrice).toBe(cart.pricePerPerson * cart.passengers);
});

for (const tour of bookingCalendarTours) {
	test(`Tour card opens availability with the correct tour, permit route and duration: ${tour.path}`, async ({
		page,
	}) => {
		if (tour.durationDays === 6) {
			await page.addInitScript(() => {
				Object.defineProperty(Crypto.prototype, "randomUUID", {
					value: undefined,
					configurable: true,
				});
			});
		}
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

		await expect(page.locator(".booking-summary")).toBeVisible();
		const originalTitle = await page
			.locator("#booking-summary-title")
			.innerText();
		await expect(
			page.locator(".booking-summary").getByRole("combobox"),
		).toHaveCount(0);
		if (tour.durationDays === 1) {
			const summary = page.locator(".booking-summary");
			await expect(summary.locator(".price")).toHaveText(
				/Consultar precio|Request a price|Consultar preço/,
			);
			await expect(summary.locator(".reserve, .availability a")).toHaveCount(0);
			await expect(page.locator(".hero-cta-book")).toHaveCount(0);
			await summary.locator("[data-open-tour-quote]").click();
			const dialog = page.getByRole("dialog");
			await expect(dialog).toBeVisible();
			await expect(dialog.locator(".tour-title")).toHaveText(originalTitle);
			await page.keyboard.press("Escape");
			const heroQuery = page.locator(
				".hero-cta-whatsapp[data-open-tour-quote]",
			);
			if (await heroQuery.count()) {
				await heroQuery.click();
				await expect(dialog).toBeVisible();
				await page.keyboard.press("Escape");
				await expect(heroQuery).toBeFocused();
			}
			return;
		}
		await page
			.locator(".booking-summary .reserve")
			.click({ noWaitAfter: true });
		await expect(page).toHaveURL(/availability|disponibilidad|disponibilidade/);
		const form = page.locator("#availability-calendar");

		await expect(form.locator("[data-calendar-months]")).toBeVisible({
			timeout: 20000,
		});
		await waitForBookingIslandHydration(page);
		const requestedSlug = new URL(page.url()).searchParams.get("tour") ?? "";
		await expect(form.locator("#availability-tour")).toHaveCount(0);
		await expect(page.getByRole("heading", { level: 1 })).toHaveText(
			`${tour.path.startsWith("/es/") ? "Reserva de tour" : tour.path.startsWith("/pt/") ? "Reserva do tour" : "Tour booking"} ${originalTitle}`,
		);
		await expect(form.locator('select[name="machu-picchu-route"]')).toHaveCount(
			0,
		);
		await expect(form.locator("[data-calendar-months] button")).toHaveCount(12);

		if (testMonth > currentMonth) {
			await form
				.getByRole("button", { name: /next|siguiente|pr[o\u00f3]ximo/i })
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

		await expect(
			form.locator('button[data-calendar-date][aria-pressed="true"]'),
		).toHaveCount(tour.durationDays);
		await expect(
			form
				.getByText(
					formatDateRange(
						addDaysToDateKey(testDate, -tour.permitStartOffsetDays),
						tour.durationDays,
					),
				)
				.first(),
		).toBeVisible();
		await expect(form.getByText(/US\$\d+\.\d{2}/).first()).toBeVisible();
		expect(requestedRoads.length).toBeGreaterThan(0);
		expect(new Set(requestedRoads)).toEqual(new Set([tour.road]));
		if (!getIncaTrailBookingConfig(requestedSlug)?.isPrimaryAvailabilityTour) {
			await form
				.getByRole("button", {
					name: /book now|reservar agora|reservar ahora/i,
				})
				.click({ noWaitAfter: true });
			await expect(page).toHaveURL(/\/checkout\/?$/);
			const cart = await page.evaluate(() =>
				JSON.parse(localStorage.getItem("bookingCart") ?? "null"),
			);
			expect(cart).toMatchObject({
				tourName: originalTitle,
				road: tour.road,
				durationDays: tour.durationDays,
				permitDate: testDate,
				date: addDaysToDateKey(testDate, -tour.permitStartOffsetDays),
			});
		}
	});
}

for (const path of [
	"/inca-trail-availability",
	"/es/disponibilidad-camino-inca",
	"/pt/disponibilidade-trilha-inca",
]) {
	test(`General availability offers only the 2 and 4 day tours: ${path}`, async ({
		page,
	}) => {
		await page.route("**/api/calendar-tickets**", (route) =>
			route.fulfill({
				contentType: "application/json",
				body: JSON.stringify({ tickets: { [testDate]: 12 } }),
			}),
		);
		await page.goto(path, { waitUntil: "domcontentloaded" });
		await expect(page.getByRole("heading", { level: 1 })).toContainText(/Inca/);
		const options = page.locator("#availability-tour option");
		await expect(options).toHaveCount(2, { timeout: 20000 });
		const slugs = await options.evaluateAll((items) =>
			items.map((item) => (item as HTMLOptionElement).value),
		);
		expect(
			slugs.map((slug) => getIncaTrailBookingConfig(slug)?.durationDays).sort(),
		).toEqual([2, 4]);
		await waitForBookingIslandHydration(page);
		const monthButtons = page.locator("[data-calendar-months] button");
		await expect(monthButtons).toHaveCount(12);
		await expect(
			page.locator("[data-calendar-months] button:disabled"),
		).toHaveCount(currentMonth - 1);
		await expect(
			page.locator(`[data-calendar-month="${currentMonth}"]`),
		).toHaveAttribute("aria-pressed", "true");
		await page.locator(`[data-calendar-month="${testMonth}"]`).click();
		await expect(
			page.locator(`[data-calendar-month="${testMonth}"]`),
		).toHaveAttribute("aria-pressed", "true");
		await expect(
			page.getByRole("button", { name: new RegExp(`${testDate}.*12`) }),
		).toBeEnabled();
	});
}

test("Short Inca Trail card opens route 5 availability and marks a two day trip", async ({
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
	const shortTourTitle = await page
		.locator("#booking-summary-title")
		.innerText();

	await expect(page.locator(".booking-summary")).toBeVisible();
	await expect(
		page.locator(".booking-summary").getByRole("combobox"),
	).toHaveCount(0);
	await page.locator(".booking-summary .reserve").click({ noWaitAfter: true });
	await expect(page).toHaveURL(/availability|disponibilidad|disponibilidade/);
	const form = page.locator("#availability-calendar");

	await expect(form.locator("[data-calendar-months]")).toBeVisible({
		timeout: 20000,
	});
	await expect(form.locator("#availability-tour")).toHaveCount(0);
	await expect(page.getByRole("heading", { level: 1 })).toHaveText(
		`Tour booking ${shortTourTitle}`,
	);

	if (testMonth > currentMonth) {
		await form
			.getByRole("button", { name: /next|siguiente|pr[o\u00f3]ximo/i })
			.click();
	}

	await form
		.getByRole("button", {
			name: new RegExp(`${testDate}.*8.*(spaces|cupos|vagas)`, "i"),
		})
		.click();
	await expect(
		form.locator('button[data-calendar-date][aria-pressed="true"]'),
	).toHaveCount(2);
	await expect(
		form.getByText(formatDateRange(testDate, 2)).first(),
	).toBeVisible();

	await form
		.getByRole("button", { name: /book now/i })
		.click({ noWaitAfter: true });
	await expect(page).toHaveURL(/\/checkout\/?$/);

	const cart = await page.evaluate(() => {
		const rawCart = window.localStorage.getItem("bookingCart");
		return rawCart ? JSON.parse(rawCart) : null;
	});

	expect(cart).toMatchObject({
		date: testDate,
		durationDays: 2,
		road: "5",
		availability: 8,
		tourPath: expect.stringMatching(/^\/short-inca-trail-2-days\/?$/),
	});
	expect(requestedRoads.length).toBeGreaterThan(0);
	expect(new Set(requestedRoads)).toEqual(new Set(["5"]));
});

test("Tours outside the Inca Trail booking configuration use the default contact form", async ({
	page,
}) => {
	await page.goto("/es/inca-jungle-4-dias", {
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
	await expect(form.locator('select[name="travel-month"]')).toHaveCount(0);
});

test("Inca Trail availability page shows tour names instead of route numbers", async ({
	page,
}) => {
	const localizedAvailabilityPages = [
		{
			path: "/es/disponibilidad-camino-inca",
			routeOne: "Camino Inca 4 dias",
			routeFive: "Camino Inca 2 dias",
		},
		{
			path: "/inca-trail-availability",
			routeOne: "Classic Inca Trail 4 Days",
			routeFive: "Short Inca Trail 2 Days",
		},
		{
			path: "/pt/disponibilidade-trilha-inca",
			routeOne: "Trilha Inca Classica 4 dias",
			routeFive: "Trilha Inca Curta 2 dias",
		},
	] as const;

	await page.route("**/api/calendar-tickets**", async (route) => {
		await route.fulfill({
			contentType: "application/json",
			body: JSON.stringify({
				tickets: {
					[testDate]: 12,
				},
			}),
		});
	});

	for (const availabilityPage of localizedAvailabilityPages) {
		await page.goto(availabilityPage.path, {
			waitUntil: "domcontentloaded",
		});

		const roadSelect = page.locator('select[name="machu-picchu-route"]');
		await expect(roadSelect).toBeVisible({ timeout: 20000 });
		await expect(roadSelect.locator('option[value="1"]')).toHaveText(
			availabilityPage.routeOne,
		);
		await expect(roadSelect.locator('option[value="5"]')).toHaveText(
			availabilityPage.routeFive,
		);
		await expect(roadSelect).not.toContainText("Route 1");
		await expect(roadSelect).not.toContainText("Route 5");
	}
});

test("checkout API rejects client prices without an authoritative Strapi tour id", async ({
	request,
}) => {
	const response = await request.post("/api/checkout", {
		data: checkoutPayload(),
	});

	expect(response.status()).toBe(400);
	const body = await response.json();
	expect(body.error).toBe("Missing cart data");
});

test("checkout API rejects a child as the pre-booking holder", async ({
	request,
}) => {
	const response = await request.post("/api/checkout", {
		data: checkoutPayload({
			passengersInfo: [
				{ ...completePassenger, dob: "2020-01-10" },
				completePassenger,
			],
			cart: {
				quoteRequestId: "123e4567-e89b-42d3-a456-426614174000",
				tourId: "test-inca-trail",
				date: testDate,
				passengers: 2,
				paymentPreference: "minimum",
				lang: "en",
			},
		}),
	});

	expect(response.status()).toBe(400);
	const body = await response.json();
	expect(body.error).toContain("at least 18 years old");
});

test("checkout API rejects risky or incomplete booking payloads", async ({
	request,
}) => {
	const invalidPayloads = [
		checkoutPayload({
			cart: {
				quoteRequestId: "123e4567-e89b-42d3-a456-426614174000",
				tourName: "Inca Trail 4 Days",
				date: testDate,
				passengers: 2,
				totalPrice: -1240,
				paymentPreference: "minimum",
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
