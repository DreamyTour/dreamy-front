export function serializeJsonForHtml(value: unknown) {
	return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function escapeHtml(value: unknown) {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}
