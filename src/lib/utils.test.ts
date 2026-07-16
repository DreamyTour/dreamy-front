import { describe, expect, test } from "bun:test";
import { sortToursByOrder } from "@/lib/utils";

describe("sortToursByOrder", () => {
	test("sorts numbered tours ascending and leaves unnumbered tours last", () => {
		const tours = [
			{ titulo: "Missing", orden: null },
			{ titulo: "Third", orden: 3 },
			{ titulo: "First", orden: 1 },
			{ titulo: "Second", orden: 2 },
		];

		expect(sortToursByOrder(tours).map((tour) => tour.titulo)).toEqual([
			"First",
			"Second",
			"Third",
			"Missing",
		]);
	});

	test("uses the title as a deterministic tie-breaker", () => {
		const tours = [
			{ titulo: "Zulu", orden: 1 },
			{ titulo: "Alpha", orden: 1 },
		];

		expect(sortToursByOrder(tours).map((tour) => tour.titulo)).toEqual([
			"Alpha",
			"Zulu",
		]);
	});
});
