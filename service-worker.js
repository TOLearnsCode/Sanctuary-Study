const ASSET_VERSION = "20260221-mobile-ui2";
const CACHE_NAME = `sanctuary-study-core-${ASSET_VERSION}`;
const withVersion = (path) => `${path}?v=${ASSET_VERSION}`;
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/privacy.html",
  "/terms.html",
  withVersion("/style.css"),
  withVersion("/legal.css"),
  withVersion("/js/constants.js"),
  withVersion("/js/sync.js"),
  withVersion("/js/analytics.js"),
  withVersion("/js/ui.js"),
  withVersion("/js/timer.js"),
  withVersion("/js/music.js"),
  withVersion("/app.js"),
  withVersion("/legal.js"),
  withVersion("/auth.js"),
  withVersion("/firebase.js"),
  "/favicon.ico",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/apple-touch-icon.png"
];
const APP_SHELL_PATHS = new Set([
  "/",
  "/index.html",
  "/privacy.html",
  "/terms.html",
  "/style.css",
  "/legal.css",
  "/js/constants.js",
  "/js/sync.js",
  "/js/analytics.js",
  "/js/ui.js",
  "/js/timer.js",
  "/js/music.js",
  "/app.js",
  "/legal.js",
  "/auth.js",
  "/firebase.js"
]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        CORE_ASSETS.map((assetPath) => cache.add(assetPath))
      );
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.map((cacheName) => {
        if (cacheName !== CACHE_NAME) {
          return caches.delete(cacheName);
        }
        return Promise.resolve();
      })
    ))
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isAppShellRequest = isSameOrigin && APP_SHELL_PATHS.has(requestUrl.pathname);
  const isCodeOrDocument = isSameOrigin && (
    event.request.destination === "document"
    || event.request.destination === "script"
    || event.request.destination === "style"
  );
  const shouldUseNetworkFirst = isAppShellRequest || isCodeOrDocument;

  // Keep core HTML/CSS/JS fresh after deploys: network first, cache fallback.
  if (shouldUseNetworkFirst) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache).catch(() => {
                // Ignore cache write issues for non-critical resources.
              });
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          if (isAppShellRequest) {
            const fallbackByPath = await caches.match(requestUrl.pathname);
            if (fallbackByPath) {
              return fallbackByPath;
            }
          }
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
          return Response.error();
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (requestUrl.origin === self.location.origin && networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache).catch(() => {
                // Ignore cache write issues for non-critical resources.
              });
            });
          }
          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
          return Response.error();
        });
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
