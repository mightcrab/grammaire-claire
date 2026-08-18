import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the complete French grammar course shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Grammaire Claire/);
  assert.match(html, /Learn one thing well/);
  assert.match(html, /Begin the course/);
  assert.match(html, /Quality &amp; sources/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|Your site is taking shape/);
});

test("ships the complete, sourced A1–B2 curriculum", async () => {
  const [a, b, sources, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/courseDataA.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/courseDataB.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/courseSources.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  const lessonCount = (a.match(/\n\s+id:\s*"/g) ?? []).length + (b.match(/\n\s+id:\s*"/g) ?? []).length;
  assert.equal(lessonCount, 58);
  for (const key of ["cei", "fei", "delf", "eduscol", "academie", "oqlf", "tv5"]) {
    assert.match(sources, new RegExp(`key: "${key}"`));
  }
  assert.match(b, /recognitionOnly:\s*true/);
  assert.match(layout, /French grammar from A1 to B2/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton|site-creator-vinext-starter/);
});

test("pre-caches the rendered application shell for a complete offline fallback", async () => {
  const serviceWorker = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  assert.match(serviceWorker, /async function precacheShell/);
  assert.match(serviceWorker, /html\.matchAll\(\/\(\?:src\|href\)/);
  assert.match(serviceWorker, /event\.waitUntil\(precacheShell\(\)/);
  assert.match(serviceWorker, /event\.waitUntil\(caches\.open\(CACHE\)/);
  assert.match(serviceWorker, /request\.mode === "navigate"/);
  assert.match(serviceWorker, /url\.pathname\.startsWith\("\/api\/"\)/);
  assert.match(serviceWorker, /await caches\.match\("\/"\)/);
});

test("packages progress storage as additive database migrations", async () => {
  const [hosting, initial, receipts] = await Promise.all([
    readFile(new URL("../dist/.openai/hosting.json", import.meta.url), "utf8"),
    readFile(new URL("../dist/.openai/drizzle/0000_progress_sync.sql", import.meta.url), "utf8"),
    readFile(new URL("../dist/.openai/drizzle/0001_progress_mutations.sql", import.meta.url), "utf8"),
  ]);
  assert.equal(JSON.parse(hosting).d1, "DB");
  assert.match(initial, /CREATE TABLE `progress_sync`/);
  assert.doesNotMatch(initial, /progress_mutations/);
  assert.match(receipts, /CREATE TABLE `progress_mutations`/);
});
