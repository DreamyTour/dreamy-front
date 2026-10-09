import type { StyleSpecification } from "maplibre-gl";

// Optional MapTiler key upgrades both basemaps without changing CMS content.
const mapTilerKey = import.meta.env.PUBLIC_MAPTILER_KEY?.trim();
const imageryUrl =
	"https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const satelliteStyle: StyleSpecification = {
	version: 8,
	sources: {
		imagery: {
			type: "raster",
			tiles: [imageryUrl],
			tileSize: 256,
			maxzoom: 19,
			attribution:
				'Tiles © <a href="https://www.esri.com/">Esri</a> — Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community',
		},
	},
	layers: [
		{
			id: "imagery",
			type: "raster",
			source: "imagery",
			// Soften the warm tones in the source imagery without tinting the map.
			paint: {
				"raster-saturation": -0.3,
				"raster-contrast": 0,
				"raster-brightness-min": 0.04,
			},
		},
	],
};

export const tourMapStyles = {
	map: mapTilerKey
		? `https://api.maptiler.com/maps/streets-v2/style.json?key=${encodeURIComponent(mapTilerKey)}`
		: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
	satellite: mapTilerKey
		? `https://api.maptiler.com/maps/hybrid/style.json?key=${encodeURIComponent(mapTilerKey)}`
		: satelliteStyle,
};

export type TourMapMode = keyof typeof tourMapStyles;
