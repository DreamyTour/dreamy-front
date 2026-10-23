import { describe, expect, test } from "bun:test";
import {
	type CmsAdminFetch,
	grantCmsEditorSession,
	hasCmsEditorSession,
	isCmsProtectedPath,
	verifyCmsAdmin,
} from "./cms-editor-auth";

const cms = "https://cms.dreamy.tours";
const request = (origin = cms, authorization = "Bearer test-token") =>
	new Request("https://dreamy.tours/api/cms/session", {
		method: "POST",
		headers: { Origin: origin, Authorization: authorization },
	});
const upstream =
	(body: unknown, status = 200) =>
	async () =>
		Response.json(body, { status });

describe("CMS editor access", () => {
	test("protects internal paths including encoded paths, leaving public routing available", () => {
		for (const path of [
			"/cms",
			"/cms/map-editor/",
			"/cms/%6dap-editor",
			"/%63ms/map-editor",
			"/api/tour-places/",
		])
			expect(isCmsProtectedPath(path)).toBe(true);
		for (const path of [
			"/api/tour-route",
			"/api/cms/session",
			"/es/tours/",
			"/cms-other/",
		])
			expect(isCmsProtectedPath(path)).toBe(false);
	});
	test("rejects absent, mismatched and spoofed origins before contacting Strapi", async () => {
		const unexpected: CmsAdminFetch = async () => {
			throw Error("must not fetch");
		};
		for (const origin of [
			"",
			"null",
			`${cms}.attacker.example`,
			"https://dreamy.tours",
		])
			expect(await verifyCmsAdmin(request(origin), cms, unexpected)).toBe(403);
		expect(await verifyCmsAdmin(request(), null, unexpected)).toBe(403);
	});
	test("requires a bearer token", async () => {
		for (const token of ["", "Basic test", "Bearer a b"])
			expect(await verifyCmsAdmin(request(cms, token), cms)).toBe(401);
	});
	test("verifies with the fixed admin endpoint and does not follow redirects", async () => {
		const fetcher: CmsAdminFetch = async (url, options) => {
			expect(String(url)).toBe(`${cms}/admin/users/me`);
			expect(options?.headers).toEqual({
				Authorization: "Bearer test-token",
				Accept: "application/json",
			});
			expect(options?.redirect).toBe("manual");
			return Response.json({ data: { id: 1, isActive: true } });
		};
		expect(await verifyCmsAdmin(request(), cms, fetcher)).toBe(200);
	});
	test("rejects invalid tokens, inactive accounts and malformed success responses", async () => {
		for (const status of [401, 403])
			expect(await verifyCmsAdmin(request(), cms, upstream({}, status))).toBe(
				401,
			);
		for (const body of [
			{},
			{ data: { id: 1, isActive: false } },
			{ data: { email: "test@example.com" } },
		])
			expect(await verifyCmsAdmin(request(), cms, upstream(body))).toBe(401);
	});
	test("fails closed when Strapi is unavailable", async () => {
		expect(await verifyCmsAdmin(request(), cms, upstream({}, 500))).toBe(502);
		expect(
			await verifyCmsAdmin(request(), cms, async () => {
				throw Error("offline");
			}),
		).toBe(502);
	});
	test("requires a nonexpired server-side session and rotates the ID on first authorization", async () => {
		let value: { expiresAt: number } | undefined;
		let rotations = 0;
		const session = {
			get: async () => value,
			regenerate: async () => {
				rotations++;
			},
			set: (
				_key: string,
				grant: { expiresAt: number },
				options: { ttl: number },
			) => {
				expect(options.ttl).toBe(300);
				value = grant;
			},
		};
		expect(await hasCmsEditorSession(undefined)).toBe(false);
		expect(await hasCmsEditorSession(session)).toBe(false);
		await grantCmsEditorSession(session);
		expect(await hasCmsEditorSession(session)).toBe(true);
		await grantCmsEditorSession(session);
		expect(rotations).toBe(1);
		value = { expiresAt: Date.now() - 1 };
		expect(await hasCmsEditorSession(session)).toBe(false);
	});
});
