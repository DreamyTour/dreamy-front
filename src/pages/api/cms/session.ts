import type { APIRoute } from "astro";
import {
	getCmsOrigin,
	grantCmsEditorSession,
	verifyCmsAdmin,
} from "@/lib/cms-editor-auth";

export const prerender = false;

export const ALL: APIRoute = async ({ request, session }) => {
	const cmsOrigin = getCmsOrigin();
	const headers = new Headers({
		"Cache-Control": "no-store",
		Vary: "Origin",
		"X-Robots-Tag": "noindex, nofollow",
	});
	if (!cmsOrigin || request.headers.get("Origin") !== cmsOrigin) {
		return new Response(null, { status: 403, headers });
	}
	headers.set("Access-Control-Allow-Origin", cmsOrigin);
	headers.set("Access-Control-Allow-Credentials", "true");
	headers.set("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS");
	headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
	if (request.method === "OPTIONS")
		return new Response(null, { status: 204, headers });
	if (request.method === "DELETE") {
		session?.destroy();
		return new Response(null, { status: 204, headers });
	}
	if (request.method !== "POST") {
		headers.set("Allow", "POST, DELETE, OPTIONS");
		return new Response(null, { status: 405, headers });
	}
	const status = await verifyCmsAdmin(request, cmsOrigin);
	if (status !== 200 || !session) {
		return new Response(null, {
			status: status === 200 ? 503 : status,
			headers,
		});
	}
	await grantCmsEditorSession(session);
	return new Response(null, { status: 204, headers });
};
