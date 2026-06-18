/* Tread service-worker unit test — run with:  cd dev && npm test
   Executes ../sw.js inside a mock ServiceWorkerGlobalScope and asserts install (precache),
   activate (stale-cache cleanup), and fetch (cache-first, ignoreSearch, offline navigation
   fallback, non-GET passthrough, no runtime caching). No jsdom needed. Non-zero exit on failure. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

let passed = 0, failed = 0;
const ok = (c, m) => { if (c) { passed++; console.log("  ✓ " + m); } else { failed++; console.log("  ✗ " + m); } };
const section = (s) => console.log("\n" + s);

const SCOPE = "https://tread.example/";
const full = (u) => { const x = new URL(typeof u === "string" ? u : u.url, SCOPE); return x.pathname + x.search; };
const pathOf = (u) => new URL(typeof u === "string" ? u : u.url, SCOPE).pathname;

// --- minimal CacheStorage / Cache mock ---
class MockCache {
  constructor() { this.m = new Map(); }
  async addAll(urls) { for (const u of urls) this.m.set(full(u), { kind: "precached", url: full(u) }); }
  async put(req, res) { this.m.set(full(req), res); }
  async match(req, opts) {
    if (this.m.has(full(req))) return this.m.get(full(req));
    if (opts && opts.ignoreSearch) { const p = pathOf(req); for (const [k, v] of this.m) if (k.split("?")[0] === p) return v; }
    return undefined;
  }
}
function makeCaches() {
  const store = new Map();
  return {
    store,
    async open(n) { if (!store.has(n)) store.set(n, new MockCache()); return store.get(n); },
    async keys() { return [...store.keys()]; },
    async delete(n) { return store.delete(n); },
    async match(req, opts) { for (const c of store.values()) { const r = await c.match(req, opts); if (r) return r; } return undefined; },
  };
}

const SW_SRC = fs.readFileSync(path.join(__dirname, "..", "sw.js"), "utf8");
function loadSW(fetchImpl) {
  const handlers = {};
  const caches = makeCaches();
  const self = { addEventListener: (t, fn) => { handlers[t] = fn; }, skipWaiting: () => {}, clients: { claim: () => {} } };
  const sandbox = { self, caches, fetch: fetchImpl, URL, Promise, console };
  vm.createContext(sandbox);
  vm.runInContext(SW_SRC, sandbox);
  return { handlers, caches };
}
const request = (url, { method = "GET", mode = "navigate" } = {}) => ({ url: new URL(url, SCOPE).href, method, mode });
async function fireInstall(h) { let p; h.install({ waitUntil: (x) => { p = x; } }); await p; }
async function fireActivate(h) { let p; h.activate({ waitUntil: (x) => { p = x; } }); await p; }
async function fireFetch(h, req) { let called = false, resp; h.fetch({ request: req, respondWith: (x) => { called = true; resp = x; } }); return { called, value: called ? await resp : undefined }; }

(async () => {
  try {
    section("install — precache the shell");
    {
      const { handlers, caches } = loadSW(async () => { throw new Error("offline"); });
      await fireInstall(handlers);
      const keys = await caches.keys();
      ok(keys.length === 1 && /v2/.test(keys[0]), `creates one versioned cache (${keys[0]})`);
      const c = caches.store.get(keys[0]);
      ["/", "/index.html", "/manifest.webmanifest", "/icon-64.png", "/icon-192.png", "/icon-512.png"]
        .forEach((p) => ok(c.m.has(p), `precaches ${p}`));
    }

    section("activate — drop stale caches");
    {
      const { handlers, caches } = loadSW(async () => { throw new Error("offline"); });
      caches.store.set("tread-v1", new MockCache());          // a stale cache from an older version
      await fireInstall(handlers);
      await fireActivate(handlers);
      const keys = await caches.keys();
      ok(!keys.includes("tread-v1"), "deletes the stale cache on activate");
      ok(keys.some((k) => /v2/.test(k)), "keeps the current versioned cache");
    }

    section("fetch — cache-first, ignoreSearch, no runtime caching");
    {
      let networkCalls = 0;
      const { handlers, caches } = loadSW(async (r) => { networkCalls++; return { kind: "network", url: r.url }; });
      await fireInstall(handlers);

      const hit = await fireFetch(handlers, request(SCOPE + "index.html"));
      ok(hit.called && hit.value.kind === "precached" && networkCalls === 0, "serves a precached asset from cache (no network)");

      const q = await fireFetch(handlers, request(SCOPE + "?source=pwa"));
      ok(q.called && q.value.kind === "precached", "ignoreSearch: '/?source=pwa' resolves to the cached shell");

      const before = networkCalls;
      const miss = await fireFetch(handlers, request(SCOPE + "not-precached.json", { mode: "cors" }));
      ok(miss.value && miss.value.kind === "network", "uncached request falls through to the network");
      ok(networkCalls === before + 1, "network is hit exactly once for a cache miss");
      const c = caches.store.get((await caches.keys())[0]);
      ok(!c.m.has("/not-precached.json"), "runtime responses are NOT cached (cache stays bounded)");

      const post = await fireFetch(handlers, request(SCOPE + "submit", { method: "POST" }));
      ok(!post.called, "non-GET requests are passed through (respondWith not called)");
    }

    section("fetch — offline navigation falls back to the shell");
    {
      const { handlers } = loadSW(async () => { throw new Error("offline"); });
      await fireInstall(handlers);
      const nav = await fireFetch(handlers, request(SCOPE + "deep/link", { mode: "navigate" }));
      ok(nav.value && nav.value.kind === "precached" && nav.value.url === "/index.html",
        "offline navigation to an uncached path returns the cached index.html");
    }

    console.log(`\n${failed === 0 ? "✅ PASS" : "❌ FAIL"} — ${passed} passed, ${failed} failed`);
    process.exit(failed === 0 ? 0 : 1);
  } catch (e) {
    console.log("\n❌ sw-test threw:", e.stack || e.message);
    process.exit(1);
  }
})();
