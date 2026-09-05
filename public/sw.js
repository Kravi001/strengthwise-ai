// Self-destruct service worker: unregisters any old cached PWA service worker and clears all caches
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: "window" }))
      .then((clients) => {
        clients.forEach((client) => {
          client.navigate(client.url);
        });
      })
  );
});

self.addEventListener("fetch", (event) => {
  // Always bypass cache and fetch directly from network
  event.respondWith(fetch(event.request));
});
