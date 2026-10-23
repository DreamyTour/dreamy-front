import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parse } from "parse5";

const client = resolve("dist/client");
const origin = "https://dreamy.tours";
const exclusions = JSON.parse(await readFile("src/data/sitemapExclusions.json", "utf8"));
const excludedPaths = new Set([...exclusions.checkout, ...exclusions.blogPagination]);
const additionallyExcluded = url => excludedPaths.has(new URL(url).pathname);
const legacy = value => {
	if (typeof value !== "string" || !/^(?:\/|https?:\/\/)/i.test(value)) return false;
	try {
		const url = new URL(value, origin);
		return url.origin === origin && /^\/en(?:\/|$)/.test(url.pathname);
	} catch { return false; }
};
const locs = xml => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const index = await readFile(join(client, "sitemap-index.xml"), "utf8");
const children = locs(index);
assert(children.length > 0);
const urls = [];
for (const child of children) {
	const xml = await readFile(join(client, new URL(child).pathname), "utf8");
	urls.push(...locs(xml));
}
assert(urls.length > 0);
assert.deepEqual(urls.filter(legacy), [], "no old /en/ URLs, including backlinks, may enter the sitemap");
assert.deepEqual(urls.filter(additionallyExcluded), [], "the 27 authorized checkout and blog index pages must stay outside the sitemap");
const files = await readdir(client, { recursive: true });
assert.deepEqual(files.filter(file => /^en[\\/].*\.html$/.test(file)), [], "do not generate old English assets");
const references = [];
function inspectSchema(value, file) {
	if (typeof value === "string" && legacy(value)) references.push({ file, type: "JSON-LD", value });
	else if (Array.isArray(value)) for (const item of value) inspectSchema(item, file);
	else if (value && typeof value === "object") for (const item of Object.values(value)) inspectSchema(item, file);
}
function inspect(node, file) {
	const attrs = Object.fromEntries((node.attrs ?? []).map(attr => [attr.name, attr.value]));
	for (const name of ["href", "action"]) if (attrs[name] && legacy(attrs[name])) references.push({ file, type: `${node.tagName}:${name}`, value: attrs[name] });
	if (["og:url", "twitter:url"].includes(attrs.property ?? attrs.name) && legacy(attrs.content)) references.push({ file, type: "meta", value: attrs.content });
	if (node.tagName === "script" && attrs.type === "application/ld+json") {
		inspectSchema(JSON.parse((node.childNodes ?? []).map(child => child.value ?? "").join("")), file);
	}
	for (const child of node.childNodes ?? []) inspect(child, file);
}
const htmlFiles = files.filter(file => file.endsWith(".html"));
for (const file of htmlFiles) inspect(parse(await readFile(join(client, file), "utf8")), file);
assert.deepEqual(references, [], "internal links, canonical, hreflang and schema URLs must not target /en/");
const redirects = await readFile("public/_redirects", "utf8");
const original = execFileSync("git", ["show", "HEAD:public/_redirects"], { encoding: "utf8" });
assert.equal(redirects.replace(/\r\n/g, "\n"), original.replace(/\r\n/g, "\n"), "historical rules must remain unchanged");
assert.equal(await readFile(join(client, "_redirects"), "utf8"), redirects, "the original rules must be copied into the release unchanged");
const report = { sitemapChildren: children.length, urls: urls.length, legacyEn: 0, htmlDocuments: htmlFiles.length, legacyReferences: references.length, historicalRulesUnchanged: true };
try {
	const baseline = JSON.parse(await readFile(".astro/legacy-en-baseline.json", "utf8"));
	const current = new Set(urls);
	const removed = baseline.urls.filter(url => !current.has(url));
	Object.assign(report, { previousLocalBuild: baseline.urls.length, previousLocalOnly: removed.filter(url => !legacy(url) && !additionallyExcluded(url)) });
} catch (error) {
	if (error.code !== "ENOENT") throw error;
}
// The public CMS and localhost contain different records. Release safety must
// be checked against the captured public sitemap, not a different content source.
try {
	const baseline = JSON.parse(await readFile(".astro/sitemap-phase2-baseline.json", "utf8"));
	const expected = baseline.live.filter(url => !legacy(url) && !additionallyExcluded(url));
	assert.deepEqual(expected.filter(url => !urls.includes(url)), [], "must not lose legitimate URLs from the public sitemap");
	assert.deepEqual(urls.filter(url => !expected.includes(url)), [], "review unexpected CMS changes before claiming an exact sitemap comparison");
	Object.assign(report, { publicBefore: baseline.live.length, removedLegacyEn: baseline.live.filter(legacy).length, checkoutPresentBefore: baseline.live.filter(url => exclusions.checkout.includes(new URL(url).pathname)).length, blogPaginationPresentBefore: baseline.live.filter(url => exclusions.blogPagination.includes(new URL(url).pathname)).length, retainedPublicUrls: expected.length });
} catch (error) {
	if (error.code !== "ENOENT") throw error;
}
console.log(JSON.stringify(report, null, 2));
