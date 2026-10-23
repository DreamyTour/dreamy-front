export function isLegacyEnglishPath(pathname: string): boolean {
	return pathname === "/en" || pathname.startsWith("/en/");
}

// Read the existing file rather than maintaining a second redirect table.
// These are exceptions to retirement, not replacements for the original rules.
export function protectedEnglishRedirectSources(source: string): Set<string> {
	const sources = new Set<string>();
	for (const line of source.split(/\r?\n/)) {
		const [path, destination, status = "302"] = line.trim().split(/\s+/);
		if (!path || path.startsWith("#") || !isLegacyEnglishPath(path)) continue;
		if (
			/[?*:#]/.test(path) ||
			!destination ||
			!["301", "302", "303", "307", "308"].includes(status)
		) {
			throw new Error(
				`Review the protected legacy redirect before retiring /en/: ${line}`,
			);
		}
		sources.add(path);
	}
	return sources;
}

export function legacyEnglishGone(method: string): Response {
	return new Response(
		method === "HEAD" ? null : "This URL is no longer available.",
		{
			status: 410,
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
				"Cache-Control": "no-store",
				"X-Robots-Tag": "noindex, follow",
			},
		},
	);
}
