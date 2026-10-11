/* Scale of Legends service worker — makes the app installable and work offline.
 * Strategy:
 *  - Same-origin GET: network-first (fresh code when online) with a cache fallback
 *    (works offline, and survives flaky connections). Successful responses are cached.
 *  - Cross-origin GET (Tailwind CDN, Google Fonts, Data Dragon portraits): cache-first,
 *    since those rarely change and this makes repeat loads fast.
 * Bump CACHE when you want clients to drop the old cache.
 */
const CACHE = 'sol-v3';
const APP_SHELL = ['./', './index.html'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const sameOrigin = new URL(req.url).origin === self.location.origin;

    if (sameOrigin) {
        event.respondWith(
            fetch(req)
                .then((resp) => {
                    const copy = resp.clone();
                    caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
                    return resp;
                })
                .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
        );
    } else {
        event.respondWith(
            caches.match(req).then((cached) =>
                cached ||
                fetch(req).then((resp) => {
                    const copy = resp.clone();
                    caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
                    return resp;
                }).catch(() => cached)
            )
        );
    }
});
