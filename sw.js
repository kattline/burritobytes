var cacheName = "burrito-bytes-pwa";
var filesToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/fallback.html",
  "https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js"
];

// ... rest of your existing service worker code remains exactly the same ...

// Install Event
self.addEventListener("install", async (e) => {
  console.log("Service Worker: Installing...");
  const cache = await caches.open(cacheName);
  await cache.addAll(filesToCache);
  self.skipWaiting();
  console.log("Service Worker: Installation Complete.");
});

// Activate Event
self.addEventListener("activate", async (e) => {
  console.log("Service Worker: Activating...");
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map((name) => {
      if (name !== cacheName) {
        console.log(`Service Worker: Deleting Cache: ${name}`);
        return caches.delete(name);
      }
    })
  );
  self.clients.claim();
  console.log("Service Worker: Activation Complete.");
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only same-origin
  if (request.url.startsWith(self.location.origin)) {

    // Network-first for HTML
    if (request.headers.get("accept")?.includes("text/html")) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            const clone = response.clone();
            caches.open(cacheName).then((cache) => cache.put(request, clone));
            return response;
          })
          .catch(() =>
            caches.match(request).then((r) => r || caches.match("/fallback.html"))
          )
      );
      return;
    }

    // Cache-first for CSS, JS, Images
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
  }
});