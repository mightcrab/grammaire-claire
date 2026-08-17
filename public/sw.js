const CACHE = "grammaire-claire-shell-v2";

async function precacheShell() {
  const page = await fetch(new Request("/", { cache: "reload" }));
  if (!page.ok) throw new Error(`Unable to cache the course shell (${page.status})`);

  const html = await page.clone().text();
  const shellUrls = new Set(["/", "/manifest.webmanifest"]);
  for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    const url = new URL(match[1], self.location.origin);
    if (url.origin === self.location.origin) shellUrls.add(`${url.pathname}${url.search}`);
  }

  const cache = await caches.open(CACHE);
  await cache.put("/", page);
  await Promise.all(
    [...shellUrls]
      .filter((url) => url !== "/")
      .map(async (url) => {
        const response = await fetch(new Request(url, { cache: "reload" }));
        if (!response.ok) throw new Error(`Unable to cache ${url} (${response.status})`);
        await cache.put(url, response);
      }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    try {
      const response = await fetch(request);
      if (response.ok) {
        event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, response.clone())));
      }
      return response;
    } catch {
      if (cached) return cached;
      if (request.mode === "navigate") {
        const shell = await caches.match("/");
        if (shell) return shell;
      }
      return new Response("This part of the course is not available offline yet.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  })());
});
