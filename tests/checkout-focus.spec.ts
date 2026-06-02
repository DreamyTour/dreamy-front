import { expect, test } from "@playwright/test";

const cart = {
  tourId: "test-inca-trail",
  tourName: "Inca Trail 4 Days Test",
  pricePerPerson: 620,
  totalPrice: 1240,
  passengers: 2,
  date: "2026-06-10",
  road: "1",
  availability: 12,
  lang: "en",
};

async function typeAndKeepFocus(page, selector: string, text: string) {
  const locator = page.locator(selector);
  await locator.waitFor({ state: "visible" });
  await locator.click();

  let expected = "";
  for (const char of text) {
    expected += char;
    await locator.pressSequentially(char, { delay: 15 });
    await expect(locator).toHaveValue(expected);
    await expect(locator).toBeFocused();
  }
}

test("checkout passenger and contact fields keep focus while typing", async ({
  page,
}) => {
  await page.goto("/", {
    waitUntil: "domcontentloaded",
  });
  await page.evaluate((cartData) => {
    window.localStorage.setItem("bookingCart", JSON.stringify(cartData));
  }, cart);

  await page.goto("/checkout", {
    waitUntil: "networkidle",
  });
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByText("Traveler Information").waitFor({ state: "visible" });
  await expect(page.locator('input[name="passenger-1-given-name"]')).toBeFocused();

  await typeAndKeepFocus(page, 'input[name="passenger-1-given-name"]', "Ana");
  await typeAndKeepFocus(
    page,
    'input[name="passenger-1-family-name"]',
    "Torres",
  );
  await page.locator('input[name="passenger-1-birthdate"]').fill("1990-05-12");
  await typeAndKeepFocus(
    page,
    'input[name="passenger-1-document-number"]',
    "P123456",
  );

  await typeAndKeepFocus(page, 'input[name="passenger-2-given-name"]', "Luis");
  await typeAndKeepFocus(
    page,
    'input[name="passenger-2-family-name"]',
    "Garcia",
  );
  await page.locator('input[name="passenger-2-birthdate"]').fill("1988-09-20");
  await typeAndKeepFocus(
    page,
    'input[name="passenger-2-document-number"]',
    "P987654",
  );

  await typeAndKeepFocus(page, 'input[name="contact-given-name"]', "Maria");
  await typeAndKeepFocus(page, 'input[name="contact-family-name"]', "Lopez");
  await typeAndKeepFocus(
    page,
    'input[name="contact-email"]',
    "maria@example.com",
  );
  await typeAndKeepFocus(page, 'input[name="contact-phone"]', "999888777");

  await page.locator('input[name="acceptedTerms"]').check();
  await page.getByRole("button", { name: /continue to payment/i }).click();
  await expect(
    page.getByRole("heading", { name: "Payment Method" }),
  ).toBeVisible();
});
