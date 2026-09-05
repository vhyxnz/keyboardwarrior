const CACHE_NAME = "keyboard-warrior-pwa-v52";
const APP_SHELL = [
    "./",
    "./index.html",
    "./index.html?v=52",
    "./arcade-mobile.js",
    "./arcade-mobile.css",
    "./quality-upgrades.js",
    "./quality-upgrades.css",
    "./practice-lab.js",
    "./practice-lab.css",
    "./insights.js",
    "./final-upgrades.js",
    "./final-upgrades.css",
    "./banner-highlights.css",
    "./chaos-view.js",
    "./chaos-view.css",
    "./profile-layout.js",
    "./cosmetics.js",
    "./shortcuts.js",
    "./treasure.js",
    "./banner-default.svg",
    "./banner-sunset.svg",
    "./banner-matrix.svg",
    "./rewards-core.js",
    "./rewards.js",
    "./rewards.css",
    "./manifest.webmanifest",
    "./KWLogo-v2.png",
    "./icon-180.png",
    "./icon-192.png",
    "./icon-512.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys
                .filter(key => key !== CACHE_NAME)
                .map(key => caches.delete(key))
        ))
    );
    self.clients.claim();
});

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    event.respondWith(
        fetch(event.request, {
            cache: event.request.mode === "navigate" ? "no-store" : "default"
        })
            .then(response => {
                const copy = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
                return response;
            })
            .catch(() => caches.match(event.request).then(cached =>
                cached || caches.match("./index.html")
            ))
    );
});
