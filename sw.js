const CACHE_NAME = "keyboard-warrior-pwa-v63";
const APP_SHELL = [
    "./",
    "./index.html",
    "./index.html?v=63",
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
    "./trash-talk.js",
    "./trash-talk.css",
    "./profile-layout.js",
    "./cosmetics.js",
    "./shortcuts.js",
    "./treasure.js",
    "./banner-default.svg",
    "./banner-sunset.svg",
    "./banner-matrix.svg",
    "./rewards-core.js",
    "./rewards.js",
    "./word-packs.js",
    "./word-packs.css",
    "./dev-code.js",
    "./dev-code.css",
    "./rewards.css",
    "./manifest.webmanifest",
    "./KWLogo-v2.png",
    "./icon-180.png",
    "./icon-192.png",
    "./icon-512.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => Promise.all(APP_SHELL.map(url =>
            fetch(new Request(url, { cache:"reload" })).then(response => {
                if (!response.ok) throw new Error("Could not cache " + url);
                return cache.put(url, response);
            })
        )))
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
        fetch(event.request, { cache:"no-store" })
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
