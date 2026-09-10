import { expect, test } from "bun:test";
import { getPaginationHref, getPaginationItems } from "./pagination";

test("shows nearby pages and both ends without duplicate numbers", () => {
	expect(getPaginationItems(1, 3)).toEqual([1, 2, 3]);
	expect(getPaginationItems(1, 20)).toEqual([1, 2, 3, 4, "after", 20]);
	expect(getPaginationItems(10, 20)).toEqual([
		1,
		"before",
		9,
		10,
		11,
		"after",
		20,
	]);
	expect(getPaginationItems(20, 20)).toEqual([1, "before", 17, 18, 19, 20]);
});

test("builds index and category URLs, keeping page one unnumbered", () => {
	for (const base of ["/blog", "/es/blog", "/pt/blog/peru"]) {
		expect(getPaginationHref(`${base}/`, 1, 2)).toBe(`${base}/2/`);
		expect(getPaginationHref(`${base}/10/`, 10, 1)).toBe(`${base}/`);
		expect(getPaginationHref(`${base}/10/`, 10, 9)).toBe(`${base}/9/`);
	}
});
