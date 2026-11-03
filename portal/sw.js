// Minimal service worker: lets phones install the page; always fetches fresh (data is live).
self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => self.clients.claim());
self.addEventListener("fetch", () => {});
