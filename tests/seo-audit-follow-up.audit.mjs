import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "parse5";

const client = "dist/client";
const attrs = node => Object.fromEntries((node.attrs ?? []).map(a => [a.name, a.value]));
function nodes(root) {
	return [root, ...(root.childNodes ?? []).flatMap(nodes)];
}
const text = node => node.value ?? (node.childNodes ?? []).map(text).join("");
const report = { homes: [], tours: 0, offers: 0, quoteOnlyWithoutOffers: 0 };
for (const [locale, path] of [["en", ""], ["es", "es"], ["pt", "pt"]]) {
	const html = await readFile(join(client, path, "index.html"), "utf8");
	const elements = nodes(parse(html));
	const description = elements.filter(n => n.tagName === "meta" && attrs(n).name === "description");
	assert.equal(description.length, 1);
	const copy = attrs(description[0]).content;
	assert(copy.length <= 160 && copy.endsWith("."), `${locale}: complete description`);
	assert.match(copy, { en: /^Tours and travel packages/, es: /^Tours y paquetes/, pt: /^Passeios e pacotes/ }[locale]);
	for (const property of ["og:description", "twitter:description"]) {
		const meta = elements.find(n => n.tagName === "meta" && (attrs(n).property ?? attrs(n).name) === property);
		assert.equal(attrs(meta).content, copy);
	}
	const map = elements.find(n => n.tagName === "img" && /mapa-peru\..*\.svg$/.test(attrs(n).src ?? ""));
	assert(map, "the map must be a separately cached SVG, not a data URL or inline path");
	assert.equal(attrs(map).alt, "");
	assert.equal(await readFile(join(client, attrs(map).src), "utf8"), await readFile("src/assets/svg/mapa-peru.svg", "utf8"));
	assert.equal(elements.filter(n => attrs(n)["data-point-id"]).length, 7, "keep map destinations");
	const cardImages = elements.filter(n => n.tagName === "img" && /group\/image/.test(attrs(n.parentNode ?? {}).class ?? ""));
	assert(cardImages.length > 0);
	assert(cardImages.every(n => attrs(n).alt?.trim()), "tour photography has a meaningful fallback");
	report.homes.push({ locale, bytes: Buffer.byteLength(html), tourImagesWithAlt: cardImages.length });
}
const map = JSON.parse(await readFile("dist/localized-route-map.json", "utf8"));
for (const [id, translations] of Object.entries(map.documents)) {
	if (!id.startsWith("tour:")) continue;
	for (const [locale, { slug }] of Object.entries(translations)) {
		const html = await readFile(join(client, locale === "en" ? "" : locale, slug, "index.html"), "utf8");
		const elements = nodes(parse(html));
		const schema = elements.filter(n => n.tagName === "script" && attrs(n).type === "application/ld+json")
			.map(n => JSON.parse(text(n))).find(s => s["@type"] === "TouristTrip");
		assert(schema, slug);
		report.tours++;
		if (schema.offers) {
			const offer = schema.offers;
			assert(offer.price > 0 && Number.isFinite(offer.price), slug);
			assert.equal(offer.priceCurrency, "USD");
			assert.equal(offer.url, schema.url);
			const card = elements.find(n => /\bbooking-summary\b/.test(attrs(n).class ?? ""));
			assert(card, slug);
			const formatted = new Intl.NumberFormat(locale === "en" ? "en-US" : locale === "es" ? "es-PE" : "pt-BR", { maximumFractionDigits: 2 }).format(offer.price);
			assert(text(card).replace(/\s+/g, " ").includes(`US$ ${formatted}`), `schema price must be visible: ${slug}`);
			report.offers++;
		} else if (["private-full-day-inca-trail", "camino-inca-full-day-privado", "trilha-inca-full-day-privado"].includes(slug)) {
			report.quoteOnlyWithoutOffers++;
		}
	}
}
assert.equal(report.quoteOnlyWithoutOffers, 3);
assert(report.offers > 0);
console.log(JSON.stringify(report, null, 2));
