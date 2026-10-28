// Service Worker for Posyandu Ceria PWA
const CACHE_NAME = 'posyandu-ceria-v1.0.0'
const API_CACHE_NAME = 'posyandu-ceria-api-v1.0.0'

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png'
]

// Install Event - Pre-cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Some precache assets failed to cache:', err)
      })
    }).then(() => self.skipWaiting())
  )
})

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== API_CACHE_NAME) {
            console.log('[SW] Removing old cache:', key)
            return caches.delete(key)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch Event
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignore non-HTTP/HTTPS schemes (e.g. chrome-extension://)
  if (!url.protocol.startsWith('http')) return

  // 1. Navigation Requests (HTML pages) -> Network first, fallback to cached App Shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
          }
          return response
        })
        .catch(async () => {
          // If offline, serve cached '/' or '/index.html'
          const cachedIndex = await caches.match('/index.html') || await caches.match('/')
          if (cachedIndex) return cachedIndex
          return new Response('<h1>Offline</h1><p>Aplikasi Posyandu Ceria sedang offline.</p>', {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          })
        })
    )
    return
  }

  // 2. API requests
  if (url.pathname.startsWith('/api/')) {
    // Only cache GET requests
    if (request.method !== 'GET') {
      return // Let browser handle non-GET network requests directly
    }

    event.respondWith(
      fetch(request)
        .then((response) => {
          // If response is valid, clone to API cache
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(API_CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(async () => {
          // If network failed, try to serve stale API data
          const cachedResponse = await caches.match(request)
          if (cachedResponse) {
            return cachedResponse
          }
          // Fallback offline JSON
          return new Response(
            JSON.stringify({
              error: 'Koneksi terputus. Anda sedang berada dalam mode offline.',
              offline: true
            }),
            {
              headers: { 'Content-Type': 'application/json' },
              status: 503
            }
          )
        })
    )
    return
  }

  // 3. Static Assets (JS, CSS, Images, Fonts) -> Stale While Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return networkResponse
        })
        .catch(() => cachedResponse)

      return cachedResponse || fetchPromise
    })
  )
})

// Message Event (e.g. skipWaiting)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

