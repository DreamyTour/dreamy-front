import { describe, expect, test } from "bun:test";
import {
	isLegacyEnglishPath,
	legacyEnglishGone,
	protectedEnglishRedirectSources,
} from "./legacyEnglishRoutes";

describe("legacy English URLs", () => {
	test("matches only the retired language segment", () => {
		for (const path of [
			"/en",
			"/en/",
			"/en/cusco/",
			"/en/blog/a/blog/a",
			"/en/file.pdf",
		])
			expect(isLegacyEnglishPath(path)).toBe(true);
		for (const path of [
			"/",
			"/enquiry/",
			"/en-US/",
			"/es/en/",
			"/pt/",
			"/garden/en/",
		])
			expect(isLegacyEnglishPath(path)).toBe(false);
	});
	test("discovers every explicit exception without assuming four redirects", () => {
		const sources = protectedEnglishRedirectSources(
			"# unchanged historical file\n/en/old /current/ 301\n/en/old/ /current/ 301\n/es/old /es/current/ 302\n/en/another /another/ 308\n/en/fifth /fifth/\n",
		);
		expect([...sources]).toEqual([
			"/en/old",
			"/en/old/",
			"/en/another",
			"/en/fifth",
		]);
	});
	test("requires explicit review of an unsupported future exception", () => {
		for (const rule of [
			"/en/* /:splat 301",
			"/en/:slug /:slug 302",
			"/en/old /current/ 200",
			"/en/old",
		])
			expect(() => protectedEnglishRedirectSources(rule)).toThrow(
				"Review the protected legacy redirect",
			);
	});
	test("Gone never redirects or serves a successful document", async () => {
		for (const method of ["GET", "HEAD", "POST", "DELETE", "OPTIONS"]) {
			const response = legacyEnglishGone(method);
			expect(response.status).toBe(410);
			expect(response.headers.get("Location")).toBeNull();
			expect(response.headers.get("Cache-Control")).toBe("no-store");
			expect(await response.text()).toBe(
				method === "HEAD" ? "" : "This URL is no longer available.",
			);
		}
	});
});
