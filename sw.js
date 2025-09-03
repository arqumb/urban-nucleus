
// Urban Nucleus Service Worker
// Provides offline caching and performance optimization

const CACHE_NAME = 'urban-nucleus-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/combined.min.css',
    '/combined.min.js',
    '/images/favicon.svg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Handle static assets
    if (event.request.url.includes('.css') || 
        event.request.url.includes('.js') || 
        event.request.url.includes('/images/')) {
        
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    if (response) {
                        return response;
                    }
                    
                    return fetch(event.request).then((response) => {
                        // Cache successful responses
                        if (response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => cache.put(event.request, responseClone));
                        }
                        return response;
                    });
                })
        );
    }
    
    // Handle API requests with network-first strategy
    else if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => cache.put(event.request, responseClone));
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
    }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'cart-sync') {
        event.waitUntil(syncCart());
    }
});

async function syncCart() {
    // Sync cart data when back online
    const cartData = await getStoredCartData();
    if (cartData) {
        try {
            await fetch('/api/cart/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cartData)
            });
            clearStoredCartData();
        } catch (error) {
            console.log('Cart sync failed, will retry later');
        }
    }
}
