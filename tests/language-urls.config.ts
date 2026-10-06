import { defineConfig } from "@playwright/test";
export default defineConfig({
	testDir: ".",
	testMatch: "language-urls.audit.ts",
	timeout: 30000,
	use: { baseURL: "http://127.0.0.1:4323", browserName: "chromium" },
	webServer: {
		cwd: process.cwd(),
		command:
			"python -m http.server 4323 --bind 127.0.0.1 --directory dist/client",
		url: "http://127.0.0.1:4323/blog/dead-womans-pass-inca-trail/",
		reuseExistingServer: false,
	},
});
