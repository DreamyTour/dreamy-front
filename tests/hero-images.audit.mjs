// Run after `bun run build`: node tests/hero-images.audit.mjs
// Optional arguments: tour HTML path, blog HTML path (relative to dist/client).
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { chromium } from "@playwright/test";

const root = resolve("dist/client");
const pages = process.argv.slice(2);
if (!pages.length) {
  pages.push(
    "es/choquequirao-trek-6-dias/index.html",
    "es/blog/mal-de-altura-cusco/index.html",
  );
}
const browser = await chromium.launch({ channel: "chrome" });
const mime = {
  css: "text/css",
  js: "text/javascript",
  svg: "image/svg+xml",
  woff2: "font/woff2",
  jpg: "image/jpeg",
  webp: "image/webp",
};

try {
  for (const file of pages) {
    const html = await readFile(resolve(root, file), "utf8");
    for (const [width, dpr] of [
      [390, 1],
      [390, 2],
      [768, 1],
      [1440, 1],
      [1920, 1],
    ]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        deviceScaleFactor: dpr,
      });
      try {
        const page = await context.newPage();
        await page.route("https://hero-audit.test/**", async (route) => {
          const pathname = new URL(route.request().url()).pathname;
          if (pathname === "/")
            return route.fulfill({ contentType: "text/html", body: html });
          const asset = resolve(root, `.${decodeURIComponent(pathname)}`);
          if (!asset.startsWith(root + sep))
            return route.fulfill({ status: 404, body: "" });
          try {
            await route.fulfill({
              body: await readFile(asset),
              contentType:
                mime[pathname.split(".").at(-1)] || "application/octet-stream",
            });
          } catch {
            await route.fulfill({ status: 404, body: "" });
          }
        });
        const requests = [];
        page.on("request", (request) => {
          if (request.resourceType() === "image") requests.push(request.url());
        });
        await page.goto("https://hero-audit.test/", { waitUntil: "load" });
        const hero = await page
          .locator('main img[fetchpriority="high"]')
          .first()
          .evaluate(async (img) => {
            await img.decode();
            return {
              src: img.src,
              srcset: img.srcset,
              sizes: img.sizes,
              currentSrc: img.currentSrc,
              loading: img.loading,
              decoding: img.decoding,
            };
          });
        const preload = await page
          .locator('link[as="image"]')
          .evaluate((link) => ({
            src: link.href,
            srcset: link.imageSrcset,
            sizes: link.imageSizes,
          }));
        assert.equal(preload.src, hero.src);
        assert.equal(preload.srcset, hero.srcset);
        assert.equal(preload.sizes, hero.sizes);
        assert.equal(hero.loading, "eager");
        assert.equal(hero.decoding, "async");
        const candidates = new Set([
          hero.src,
          ...hero.srcset.split(", ").map((item) => item.split(" ")[0]),
        ]);
        const heroRequests = requests.filter((url) => candidates.has(url));
        assert.equal(
          heroRequests.length,
          1,
          "The hero must be requested exactly once",
        );
        const selectedWidth = await page.evaluate(async (url) => {
          const img = new Image();
          img.src = url;
          await img.decode();
          return img.naturalWidth;
        }, hero.currentSrc);
        if (width === 390)
          assert(selectedWidth < 2000, "Mobile selected the desktop original");
        if (width >= 1440)
          assert(selectedWidth >= 1440, "Desktop resolution is insufficient");
        console.log(
          JSON.stringify({
            file,
            width,
            dpr,
            selectedWidth,
            requests: heroRequests.length,
          }),
        );
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}
