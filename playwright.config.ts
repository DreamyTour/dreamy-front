import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./tests",
	use: {
		baseURL: "http://127.0.0.1:4322",
		trace: "on-first-retry",
	},
	webServer: {
		command: "bun run dev -- --host 127.0.0.1 --port 4322",
		reuseExistingServer: true,
		url: "http://127.0.0.1:4322",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
});
