const CACHE_NAME = "sanctuary-study-core-v4";
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/privacy.html",
  "/terms.html",
  "/style.css",
  "/legal.css",
  "/app.js",
  "/legal.js",
  "/auth.js",
  "/firebase.js",
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
  "/app.js",
  "/legal.js",
  "/auth.js",
  "/firebase.js"
]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
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
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
          return caches.match("/");
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
          return caches.match("/");
        });
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
