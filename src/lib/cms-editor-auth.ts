export const CMS_SESSION_TTL = 300;
const SESSION_KEY = "cmsEditor";

interface EditorSession {
	get(key: string): Promise<unknown>;
	set(
		key: string,
		value: { expiresAt: number },
		options: { ttl: number },
	): void;
	regenerate(): Promise<void>;
}
export type CmsAdminFetch = (
	url: URL,
	options: RequestInit,
) => Promise<Response>;

export function getCmsOrigin(): string | null {
	const value = import.meta.env.VITE_STRAPI_URL || import.meta.env.STRAPI_URL;
	if (!value) return import.meta.env.DEV ? "http://localhost:1337" : null;
	try {
		const url = new URL(value);
		return url.protocol === "https:" ||
			(import.meta.env.DEV && url.protocol === "http:")
			? url.origin
			: null;
	} catch {
		return null;
	}
}

export function isCmsProtectedPath(pathname: string): boolean {
	try {
		pathname = decodeURIComponent(pathname);
	} catch {
		return true;
	}
	return (
		pathname === "/cms" ||
		pathname.startsWith("/cms/") ||
		pathname.replace(/\/+$/, "") === "/api/tour-places"
	);
}

export async function hasCmsEditorSession(
	session: Pick<EditorSession, "get"> | undefined,
): Promise<boolean> {
	const grant = await session?.get(SESSION_KEY);
	return (
		typeof grant === "object" &&
		grant !== null &&
		"expiresAt" in grant &&
		typeof grant.expiresAt === "number" &&
		grant.expiresAt > Date.now()
	);
}

// Verify an admin access token with Strapi itself; never accept a public API token
// or a client-supplied user ID as proof of an administrator's session.
export async function verifyCmsAdmin(
	request: Request,
	cmsOrigin: string | null,
	fetcher: CmsAdminFetch = fetch,
): Promise<number> {
	if (!cmsOrigin || request.headers.get("Origin") !== cmsOrigin) return 403;
	const authorization = request.headers.get("Authorization");
	if (
		!authorization ||
		!/^Bearer [^\s]+$/i.test(authorization) ||
		authorization.length > 8192
	)
		return 401;
	try {
		const response = await fetcher(new URL("/admin/users/me", cmsOrigin), {
			headers: { Authorization: authorization, Accept: "application/json" },
			redirect: "manual",
			cache: "no-store",
			signal: AbortSignal.any([request.signal, AbortSignal.timeout(5000)]),
		});
		if (response.status === 401 || response.status === 403) return 401;
		if (!response.ok) return 502;
		const body = await response.json();
		return body?.data?.id && body.data.isActive !== false ? 200 : 401;
	} catch {
		return 502;
	}
}

export async function grantCmsEditorSession(session: EditorSession) {
	if (!(await hasCmsEditorSession(session))) await session.regenerate();
	session.set(
		SESSION_KEY,
		{ expiresAt: Date.now() + CMS_SESSION_TTL * 1000 },
		{ ttl: CMS_SESSION_TTL },
	);
}
