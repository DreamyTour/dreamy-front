import { describe, expect, test } from "bun:test";
import {
	calculateTourRoute,
	parseTourRoutingRequest,
	TourRoutingError,
} from "./tour-routing";

const from: [number, number] = [-71.967, -13.532];
const to: [number, number] = [-72.264, -13.258];
const geometry = {
	type: "LineString",
	coordinates: [from, [-72.1, -13.4], to],
};

describe("automatic route input", () => {
	test("accepts valid zero coordinates and validates both endpoints", () => {
		expect(
			parseTourRoutingRequest(new URLSearchParams("mode=bus&from=0,0&to=1,1")),
		).toEqual({ mode: "bus", from: [0, 0], to: [1, 1] });
		for (const query of [
			"mode=train&from=0,0&to=1,1",
			"mode=bus&from=0,&to=1,1",
			"mode=bus&from=NaN,0&to=1,1",
			"mode=bus&from=181,0&to=1,1",
			"mode=bus&from=0,0&to=1,91",
			"mode=walking&from=0,0&to=1,2,3",
		])
			expect(() =>
				parseTourRoutingRequest(new URLSearchParams(query)),
			).toThrow();
	});
});

describe("route providers", () => {
	test("production without a key never calls a public demo server", async () => {
		let called = false;
		try {
			await calculateTourRoute(
				{ mode: "bus", from, to },
				{
					fetcher: async () => {
						called = true;
						return Response.json({});
					},
				},
			);
			throw Error("Expected failure");
		} catch (error) {
			expect(error).toBeInstanceOf(TourRoutingError);
			expect((error as TourRoutingError).code).toBe("not_configured");
		}
		expect(called).toBe(false);
	});
	test("walking selects the foot network, not the car network", async () => {
		let url = "";
		const result = await calculateTourRoute(
			{ mode: "walking", from, to },
			{
				allowDemo: true,
				paceDemo: async () => {},
				fetcher: async (input) => {
					url = input;
					return Response.json({ routes: [{ geometry }] });
				},
			},
		);
		expect(url).toContain("/routed-foot/route/v1/foot/");
		expect(result.coordinates.length).toBe(3);
		expect(result.provider).toBe("OSRM");
	});
	test("production uses private authentication and the correct ORS profile", async () => {
		for (const mode of ["bus", "walking"] as const) {
			let authorization = "";
			let profile = "";
			const result = await calculateTourRoute(
				{ mode, from, to },
				{
					apiKey: "test-key",
					fetcher: async (input, init) => {
						profile = input;
						authorization =
							new Headers(init?.headers).get("Authorization") ?? "";
						return Response.json({ features: [{ geometry }] });
					},
				},
			);
			expect(authorization).toBe("test-key");
			expect(profile).toContain(mode === "bus" ? "driving-car" : "foot-hiking");
			expect(profile).not.toContain("test-key");
			expect(result.provider).toBe("openrouteservice");
		}
	});
	test("rejects absent paths and routes snapped far away from a destination", async () => {
		for (const data of [
			{ routes: [] },
			{
				routes: [
					{
						geometry: {
							type: "LineString",
							coordinates: [
								[0, 0],
								[1, 1],
							],
						},
					},
				],
			},
		]) {
			try {
				await calculateTourRoute(
					{ mode: "bus", from, to },
					{
						allowDemo: true,
						paceDemo: async () => {},
						fetcher: async () => Response.json(data),
					},
				);
				throw Error("Expected failure");
			} catch (error) {
				expect(error).toBeInstanceOf(TourRoutingError);
				expect((error as TourRoutingError).code).toBe("no_route");
			}
		}
	});
	test("upstream failures are sanitized", async () => {
		try {
			await calculateTourRoute(
				{ mode: "bus", from, to },
				{
					apiKey: "private-key",
					fetcher: async () => {
						throw Error("private-key in upstream error");
					},
				},
			);
			throw Error("Expected failure");
		} catch (error) {
			expect((error as Error).message).toBe("unavailable");
		}
	});
});
