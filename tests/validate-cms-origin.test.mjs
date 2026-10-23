import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { validateCmsOrigin } from "../scripts/validate-cms-origin.mjs";

const validator = fileURLToPath(new URL("../scripts/validate-cms-origin.mjs", import.meta.url));
const expected = "https://cms.dreamy.tours";

test("accepts the exact CMS origin with or without one trailing slash", () => {
	assert.equal(validateCmsOrigin(expected), true);
	assert.equal(validateCmsOrigin(`${expected}/`), true);
});

test("rejects malformed, decorated, and different origins", () => {
	for (const value of [
		"",
		"https://cms.dreamy.tours//",
		"https://cms.dreamy.tours/path",
		"https://cms.dreamy.tours?query=1",
		"https://user:password@cms.dreamy.tours",
		"http://cms.dreamy.tours",
		"https://other.example",
	]) {
		assert.equal(validateCmsOrigin(value), false, `should reject ${value}`);
	}
	assert.equal(validateCmsOrigin(undefined), false);
});

test("build preflight succeeds without printing the variable value", () => {
	const result = spawnSync(process.execPath, [validator], {
		env: { ...process.env, VITE_STRAPI_URL: `${expected}/` },
		encoding: "utf8",
	});
	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /coincide/);
	assert.equal(result.stdout.includes(expected), false);
});

test("build preflight fails for a wrong or missing variable without revealing it", () => {
	for (const value of ["https://wrong.example", undefined]) {
		const env = { ...process.env };
		if (value === undefined) delete env.VITE_STRAPI_URL;
		else env.VITE_STRAPI_URL = value;
		const result = spawnSync(process.execPath, [validator], { env, encoding: "utf8" });
		assert.notEqual(result.status, 0);
		assert.match(result.stderr, /Error/);
		if (value) assert.equal(result.stderr.includes(value), false);
	}
});
