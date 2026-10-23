import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const expectedOrigin = "https://cms.dreamy.tours";

export function validateCmsOrigin(value) {
	if (typeof value !== "string") return false;
	return value === expectedOrigin || value === `${expectedOrigin}/`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	if (!validateCmsOrigin(process.env.VITE_STRAPI_URL)) {
		console.error("Error: VITE_STRAPI_URL ausente o no coincide con el CMS esperado.");
		process.exit(1);
	}

	console.log("VITE_STRAPI_URL coincide con el CMS esperado.");
}
