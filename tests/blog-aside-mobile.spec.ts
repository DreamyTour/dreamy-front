import { expect, test } from "@playwright/test";

test("uses a category popup and hides social links on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/es/blog/mal-de-altura-cusco");

  const mobileCategoryTrigger = page.locator(
    "section[aria-labelledby='blog-aside-mobile-title'] button",
  );
  await expect(mobileCategoryTrigger).toBeVisible();
  await expect(page.locator("#blog-aside-title")).toBeHidden();
  await expect(page.locator("#blog-social-title")).toBeHidden();

  await mobileCategoryTrigger.click();
  await expect(page.locator("[role='menu']")).toBeVisible();
  await expect(page.locator("[role='menuitem']").first()).toBeVisible();
  await page.keyboard.press("Escape");

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.locator("#blog-aside-title")).toBeVisible();
  await expect(page.locator("#blog-social-title")).toBeVisible();
});
