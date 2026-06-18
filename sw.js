/* Tread service worker — tiny, dependency-free, offline-first.
   The app is fully static and makes no data network calls, so the strategy is simply:
   precache the whole app shell on install, then serve it cache-first. We deliberately do
   NOT cache arbitrary runtime responses — the precache already covers every asset, and
   skipping runtime caching keeps the cache bounded and behaviour predictable. */
const VERSION = "tread-precache-v2"; // bump whenever the SHELL list or shell file contents change
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-64.png",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  // Cache-first against the precached shell. ignoreSearch so a launch URL carrying query
  // params (e.g. "/?source=pwa") still resolves to the cached "./" shell entry.
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).catch(() => {
        // Offline and not precached: for page navigations, fall back to the app shell.
        if (req.mode === "navigate") return caches.match("./index.html");
      });
    }),
  );
});
