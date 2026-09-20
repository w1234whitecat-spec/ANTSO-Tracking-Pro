// =====================================================
// ANTSO Tracking Pro — Service Worker (PWA)
// =====================================================
const VERSION = 'v1.0.0';
const CACHE_NAME = `antsotracking-${VERSION}`;

const APP_STATIC_RESOURCES = [
    './',
    './index.html',
    './cells-data.js',
    './manifest.json'
];

// Installation : mise en cache
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Installation');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('📦 Mise en cache des ressources');
            return cache.addAll(APP_STATIC_RESOURCES);
        })
    );
    self.skipWaiting();
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker: Activation');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
    // Ne pas intercepter Firebase et CDN externes
    if (event.request.url.includes('firebase') ||
        event.request.url.includes('gstatic.com') ||
        event.request.url.includes('googleapis.com') ||
        event.request.url.includes('unpkg.com') ||
        event.request.url.includes('cdnjs.cloudflare.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            });
        }).catch(() => {
            if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
            }
        })
    );
});