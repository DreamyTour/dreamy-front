import { expect, test } from "bun:test";
import { mergeSearchPlaces, placeFeatures } from "./tour-place-search";

test("native names and full regions replace English country and region abbreviations", () => {
	const places = placeFeatures(
		[
			{
				properties: {
					name: "Huilloc",
					region: "Cusco",
					country: "Peru",
					country_a: "PER",
				},
				geometry: { coordinates: [-72.198, -13.205] },
			},
		],
		"ors",
	);
	expect(places[0].label).toBe("Huilloc, Cusco, Perú");
});
test("Colca viewpoint ranks ahead of partial foreign matches and tolerates accents", () => {
	const ors = placeFeatures(
		[
			{
				properties: {
					name: "Mirador La Cruz",
					country: "Chile",
					country_a: "CHL",
				},
				geometry: { coordinates: [-73, -42] },
			},
		],
		"ors",
	);
	const osm = placeFeatures(
		[
			{
				properties: {
					name: "Mirador Cruz del Condor",
					state: "Arequipa",
					country: "Peru",
					countrycode: "PE",
				},
				geometry: { coordinates: [-71.906, -15.611] },
			},
		],
		"photon",
	);
	expect(
		mergeSearchPlaces("Mirador Cruz del Cóndor", [ors, osm])[0].label,
	).toBe("Mirador Cruz del Condor, Arequipa, Perú");
});
test("duplicates collapse but homonymous distant villages stay distinct", () => {
	const places = placeFeatures(
		[
			{
				properties: { name: "Patacancha" },
				geometry: { coordinates: [-72, -13] },
			},
			{
				properties: { name: "Patacancha" },
				geometry: { coordinates: [-72.00001, -13] },
			},
			{
				properties: { name: "Patacancha" },
				geometry: { coordinates: [-71, -14] },
			},
		],
		"photon",
	);
	expect(mergeSearchPlaces("Patacancha", [places])).toHaveLength(2);
	expect(
		placeFeatures(
			[{ properties: { name: "Bad" }, geometry: { coordinates: [999, 0] } }],
			"photon",
		),
	).toHaveLength(0);
});
