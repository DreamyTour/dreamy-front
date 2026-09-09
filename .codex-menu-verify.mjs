import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const results = [];

for (const viewport of [
	{ width: 1536, height: 900 },
	{ width: 1440, height: 900 },
	{ width: 1280, height: 650 },
]) {
	console.log(`start-${viewport.width}x${viewport.height}`);
	const page = await browser.newPage({ viewport });
	page.setDefaultTimeout(10_000);
	await page.goto("http://localhost:4321/", {
		waitUntil: "domcontentloaded",
		timeout: 60_000,
	});
	await page.waitForTimeout(1_500);
	console.log(`loaded-${viewport.width}x${viewport.height}`);

	const trigger = page.locator('[data-slot="navigation-menu-trigger"]').nth(1);
	await trigger.click();
	console.log(`clicked-${viewport.width}x${viewport.height}`);
	await page.waitForTimeout(300);
	const panel = page.locator('[data-slot="navigation-menu-content"]:visible').first();
	const clickState = {
		url: page.url(),
		state: await trigger.getAttribute("data-state"),
		visiblePanels: await page
			.locator('[data-slot="navigation-menu-content"]:visible')
			.count(),
	};
	const panelMetrics = await panel.evaluate((element) => {
		const box = element.getBoundingClientRect();
		const styles = getComputedStyle(element);
		return {
			box: box.toJSON(),
			clientHeight: element.clientHeight,
			scrollHeight: element.scrollHeight,
			overflowY: styles.overflowY,
		};
	});
	const listMetrics = await page
		.locator('[data-slot="navigation-menu-list"]')
		.evaluate((element) => ({
			box: element.getBoundingClientRect().toJSON(),
			clientWidth: element.clientWidth,
			scrollWidth: element.scrollWidth,
		}));

	await page.screenshot({
		path: `${process.env.TEMP}/dreamy-menu-premium-${viewport.width}x${viewport.height}.png`,
		fullPage: false,
	});

	await trigger.press("Escape");
	await trigger.focus();
	await trigger.press("Enter");
	await page.waitForTimeout(300);
	const keyboardState = {
		url: page.url(),
		state: await trigger.getAttribute("data-state"),
		visiblePanels: await page
			.locator('[data-slot="navigation-menu-content"]:visible')
			.count(),
	};

	results.push({ viewport, clickState, keyboardState, panelMetrics, listMetrics });
	console.log(`done-${viewport.width}x${viewport.height}`);
	await page.close();
}

console.log(JSON.stringify(results, null, 2));
await browser.close();
