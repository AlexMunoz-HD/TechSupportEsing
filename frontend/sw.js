// Service Worker para modo offline
const CACHE_NAME = 'techsupport-v2';
const RUNTIME_CACHE = 'techsupport-runtime-v2';

// Archivos estáticos para cachear
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/tailwind.css',
    '/js/app.js',
    '/js/auth.js',
    '/js/dashboard.js',
    '/js/assets.js',
    '/js/audit.js',
    '/js/onboarding.js',
    '/js/offboarding.js',
    '/js/preferences.js',
    '/js/theme.js',
    '/js/toast.js',
    '/favicon.svg'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cacheName) => {
                        return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
                    })
                    .map((cacheName) => {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    })
            );
        })
            .then(() => self.clients.claim())
    );
});

// Estrategia: Network First, luego Cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Solo cachear requests del mismo origen
    if (url.origin !== location.origin) {
        return;
    }

    // Para API requests, usar Network First con fallback a cache
    // NO cachear peticiones HEAD o POST (no soportadas por Cache API)
    if (url.pathname.startsWith('/api/') && request.method !== 'HEAD' && request.method !== 'POST') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Solo cachear respuestas exitosas
                    if (response.ok) {
                        // Clonar la respuesta para cachearla
                        const responseClone = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Si falla la red, intentar desde cache
                    return caches.match(request).then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Si no hay cache, devolver respuesta offline
                        return new Response(
                            JSON.stringify({ 
                                error: 'Offline', 
                                message: 'No hay conexión y no hay datos en caché',
                                offline: true 
                            }),
                            {
                                status: 503,
                                headers: { 'Content-Type': 'application/json' }
                            }
                        );
                    });
                })
        );
        return;
    }
    
    // Para peticiones HEAD o POST, solo hacer fetch sin cachear
    if (url.pathname.startsWith('/api/') && (request.method === 'HEAD' || request.method === 'POST')) {
        event.respondWith(fetch(request));
        return;
    }

    // Para assets estáticos, usar Cache First
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(request)
                    .then((response) => {
                        // Cachear solo respuestas exitosas
                        if (response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, responseClone);
                            });
                        }
                        return response;
                    });
            })
    );
});

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_API_RESPONSE') {
        const { url, data } = event.data;
        caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(url, new Response(JSON.stringify(data), {
                headers: { 'Content-Type': 'application/json' }
            }));
        });
    }
});

