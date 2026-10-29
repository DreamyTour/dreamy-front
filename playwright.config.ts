import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./tests",
	// Bun/Node unit suites in this folder use their own runners.
	testMatch: "**/*.spec.ts",
	// Serialize local workerd/browser traffic on Windows for reproducible runs.
	workers: process.platform === "win32" ? 1 : undefined,
	use: {
		baseURL: "http://127.0.0.1:4322",
		trace: "on-first-retry",
	},
	webServer: {
		command: `"${process.execPath}" tests/e2e-server.mjs`,
		reuseExistingServer: false,
		timeout: 120000,
		// The home route renders CMS content; a local static asset is a deterministic
		// health check for the isolated workerd server used by these endpoint tests.
		url: "http://127.0.0.1:4322/favicon.ico",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
});
