import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const pages = [
  { name: "blog", url: "https://dreamy.tours/es/blog/guia-ausangate-trek/" },
  { name: "tour", url: "https://dreamy.tours/es/choquequirao-trek-6-dias/" },
];
const viewports = [
  { name: "390 DPR 1", width: 390, dpr: 1 },
  { name: "390 DPR 2", width: 390, dpr: 2 },
  { name: "768", width: 768, dpr: 1 },
  { name: "1366", width: 1366, dpr: 1 },
  { name: "1920", width: 1920, dpr: 1 },
];
const ms = (value) => Math.round(value * 10) / 10;

async function measure(browser, target, viewport, cacheState) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: 900 },
    deviceScaleFactor: viewport.dpr,
  });
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  const events = new Map();
  await client.send("Network.enable");
  await page.addInitScript(() => {
    window.__dreamyPerf = { lcp: null, cls: 0 };
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const entry = entries.at(-1);
      if (entry) {
        window.__dreamyPerf.lcp = {
          ...entry.toJSON(),
          tag: entry.element?.tagName,
          text: entry.element?.textContent?.trim().slice(0, 120),
        };
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__dreamyPerf.cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  client.on("Network.requestWillBeSent", (event) => {
    events.set(event.requestId, {
      id: event.requestId,
      url: event.request.url,
      type: event.type,
      start: event.timestamp,
      priority: event.request.initialPriority,
    });
  });
  client.on("Network.resourceChangedPriority", (event) => {
    const request = events.get(event.requestId);
    if (request) request.priority = event.newPriority;
  });
  client.on("Network.responseReceived", (event) => {
    const request = events.get(event.requestId);
    if (!request) return;
    request.response = {
      status: event.response.status,
      headers: event.response.headers,
      timing: event.response.timing,
      fromDiskCache: event.response.fromDiskCache,
      fromServiceWorker: event.response.fromServiceWorker,
      protocol: event.response.protocol,
      received: event.timestamp,
    };
  });
  client.on("Network.loadingFinished", (event) => {
    const request = events.get(event.requestId);
    if (request) request.finish = { timestamp: event.timestamp, encoded: event.encodedDataLength };
  });

  try {
    await page.goto(target.url, { waitUntil: "load", timeout: 60_000 });
    await page.waitForTimeout(4_000);
    if (cacheState === "browser-warm") {
      events.clear();
      await page.reload({ waitUntil: "load", timeout: 60_000 });
      await page.waitForTimeout(4_000);
    }
    const result = await page.evaluate(() => {
      const navigation = performance.getEntriesByType("navigation")[0]?.toJSON();
      const resources = performance.getEntriesByType("resource").map((entry) => entry.toJSON());
      const paints = performance.getEntriesByType("paint").map((entry) => entry.toJSON());
      const hero = document.querySelector('main img[fetchpriority="high"]');
      const lcp = window.__dreamyPerf.lcp;
      return {
        navigation,
        resources,
        paints,
        hero: hero && {
          currentSrc: hero.currentSrc,
          src: hero.src,
          srcset: hero.srcset,
          sizes: hero.sizes,
          naturalWidth: hero.naturalWidth,
          naturalHeight: hero.naturalHeight,
          loading: hero.loading,
          fetchPriority: hero.fetchPriority,
        },
        lcp: lcp && {
          startTime: lcp.startTime,
          size: lcp.size,
          url: lcp.url,
          tag: lcp.tag,
          text: lcp.text,
        },
        cls: window.__dreamyPerf.cls,
      };
    });
    const heroRequest = [...events.values()].find((request) => request.url === result.hero?.currentSrc);
    const heroCandidates = new Set([
      result.hero?.src,
      ...String(result.hero?.srcset || "").split(", ").map((candidate) => candidate.split(" ")[0]),
    ]);
    const heroRequests = [...events.values()].filter((request) => heroCandidates.has(request.url));
    const criticalImages = [...events.values()]
      .filter((request) => request.type === "Image" && request.url !== result.hero?.currentSrc)
      .filter((request) => heroRequest?.finish && request.start <= heroRequest.finish.timestamp)
      .map((request) => ({ url: request.url, priority: request.priority, start: request.start }));
    const criticalResources = [...events.values()]
      .filter((request) => ["Stylesheet", "Script", "Font"].includes(request.type))
      .filter((request) => heroRequest && request.start <= heroRequest.start)
      .map((request) => ({ url: request.url, type: request.type, priority: request.priority, start: request.start }));
    return {
      page: target.name,
      viewport,
      cacheState,
      ...result,
      heroRequest,
      heroRequests: heroRequests.map((request) => ({ url: request.url, priority: request.priority, encoded: request.finish?.encoded })),
      criticalImages,
      criticalResources,
    };
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
const output = [];
try {
  for (const target of pages) {
    for (const viewport of viewports) {
      output.push(await measure(browser, target, viewport, "browser-cold"));
      output.push(await measure(browser, target, viewport, "browser-warm"));
    }
  }
} finally {
  await browser.close();
}

for (const sample of output) {
  const nav = sample.navigation;
  const hero = sample.heroRequest;
  console.log(JSON.stringify({
    page: sample.page,
    viewport: sample.viewport.name,
    cache: sample.cacheState,
    ttfb: ms(nav.responseStart),
    fcp: ms(sample.paints.find((entry) => entry.name === "first-contentful-paint")?.startTime),
    lcp: ms(sample.lcp?.startTime),
    cls: sample.cls,
    hero: sample.hero?.currentSrc,
    priority: hero?.priority,
    heroDuration: hero?.finish && ms((hero.finish.timestamp - hero.start) * 1000),
  }));
}
await writeFile(".astro/production-performance-phase-3.json", JSON.stringify(output, null, 2));
