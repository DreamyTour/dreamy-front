import type { APIRoute } from "astro";
import { formSecurityBindings } from "../../lib/formSecurity";
import { issueFormChallenge, protectedFormPaths } from "../../lib/formChallenge";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
	const path = new URL(request.url).searchParams.get("path") || "";
	if (!protectedFormPaths.has(path))
		return Response.json(
			{ error: "Not found" },
			{ status: 404, headers: { "Cache-Control": "no-store" } },
		);
	const token = await issueFormChallenge({
		secret: (await formSecurityBindings()).FORM_CHALLENGE_SECRET,
		path,
	});
	if (!token)
		return Response.json(
			{ error: "Service unavailable" },
			{ status: 503, headers: { "Cache-Control": "no-store" } },
		);
	return Response.json(
		{ challenge: token, expiresAt: Date.now() + 30 * 60_000 },
		{ headers: { "Cache-Control": "no-store" } },
	);
};
