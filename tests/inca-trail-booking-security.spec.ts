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

test("Inca Trail booking form creates a coherent checkout cart without sticky internal scroll", async ({
	page,
}) => {
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
	await page.waitForFunction(() =>
		Array.from(document.querySelectorAll("astro-island")).some(
			(island) =>
				island.getAttribute("component-url")?.includes("BookingForm") &&
				!island.hasAttribute("ssr"),
		),
	);
	await expect(form.getByText("Elija la fecha de su viaje")).toHaveCount(0);

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

	await form.getByRole("button", { name: /aumentar/i }).click();
	await form.getByRole("button", { name: /book now/i }).click();

	await expect(page).toHaveURL(/\/checkout$/);

	const cart = await page.evaluate(() => {
		const rawCart = window.localStorage.getItem("bookingCart");
		return rawCart ? JSON.parse(rawCart) : null;
	});

	expect(cart).toMatchObject({
		date: testDate,
		road: "1",
		availability: 12,
		passengers: 2,
		lang: "en",
		tourPath: "/inca-trail-4-days",
	});
	expect(cart.pricePerPerson).toBeGreaterThan(0);
	expect(cart.totalPrice).toBe(cart.pricePerPerson * cart.passengers);
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
