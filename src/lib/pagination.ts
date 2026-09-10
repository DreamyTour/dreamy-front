export function getPaginationItems(
	current: number,
	total: number,
): (number | string)[] {
	if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
	const start = Math.max(2, Math.min(current - 1, total - 3));
	const end = Math.min(total - 1, Math.max(current + 1, 4));
	const items: (number | string)[] = [1];
	if (start > 2) items.push("before");
	for (let page = start; page <= end; page++) items.push(page);
	if (end < total - 1) items.push("after");
	items.push(total);
	return items;
}

export function getPaginationHref(
	pathname: string,
	current: number,
	target: number,
) {
	const path = pathname.replace(/\/+$/, "");
	const base = current > 1 ? path.replace(/\/\d+$/, "") : path;
	return target === 1 ? `${base}/` : `${base}/${target}/`;
}
