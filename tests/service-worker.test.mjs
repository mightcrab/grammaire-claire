import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

test("the installed service worker can recover the whole shell while offline", async () => {
  const origin = "https://course.example";
  const listeners = new Map();
  const stores = new Map();
  let online = true;

  const keyFor = (input) => {
    const value = typeof input === "string" ? input : input.url;
    const url = new URL(value, origin);
    return `${url.pathname}${url.search}`;
  };
  const cacheApi = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async put(input, response) { store.set(keyFor(input), response.clone()); },
      };
    },
    async match(input) {
      const key = keyFor(input);
      for (const store of stores.values()) {
        const response = store.get(key);
        if (response) return response.clone();
      }
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
  };
  class WorkerRequest extends Request {
    constructor(input, init) {
      super(typeof input === "string" ? new URL(input, origin) : input, init);
    }
  }
  const shell = '<!doctype html><link rel="stylesheet" href="/assets/app.css"><script src="/assets/app.js"></script><main>Grammaire Claire</main>';
  const assets = new Map([
    ["/", new Response(shell, { status: 200, headers: { "Content-Type": "text/html" } })],
    ["/assets/app.css", new Response("body{}", { status: 200 })],
    ["/assets/app.js", new Response("export{}", { status: 200 })],
    ["/manifest.webmanifest", new Response("{}", { status: 200 })],
  ]);
  const fetchStub = async (input) => {
    if (!online) throw new TypeError("offline");
    const response = assets.get(keyFor(input));
    return response ? response.clone() : new Response("missing", { status: 404 });
  };
  const selfObject = {
    location: { origin },
    clients: { claim: async () => undefined },
    skipWaiting: async () => undefined,
    addEventListener(type, listener) { listeners.set(type, listener); },
  };
  const context = vm.createContext({ self: selfObject, caches: cacheApi, fetch: fetchStub, Request: WorkerRequest, Response, URL, Set, Promise, Error, TypeError });
  const code = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  vm.runInContext(code, context);

  let apiWasIntercepted = false;
  listeners.get("fetch")({
    request: { method: "GET", mode: "cors", url: `${origin}/api/progress` },
    respondWith() { apiWasIntercepted = true; },
    waitUntil() {},
  });
  assert.equal(apiWasIntercepted, false, "private API responses must never enter the offline cache");

  let installWork;
  listeners.get("install")({ waitUntil(promise) { installWork = promise; } });
  await installWork;
  const installed = [...stores.values()][0];
  assert.deepEqual([...installed.keys()].sort(), ["/", "/assets/app.css", "/assets/app.js", "/manifest.webmanifest"]);

  let activateWork;
  listeners.get("activate")({ waitUntil(promise) { activateWork = promise; } });
  await activateWork;

  online = false;
  let offlineResponse;
  listeners.get("fetch")({
    request: { method: "GET", mode: "navigate", url: `${origin}/course/deep-link` },
    respondWith(promise) { offlineResponse = promise; },
    waitUntil() {},
  });
  const response = await offlineResponse;
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Grammaire Claire/);
});
