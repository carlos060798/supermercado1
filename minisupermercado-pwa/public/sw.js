const CACHE_NAME = 'minisupermercado-pwa-v1'
const RUNTIME_CACHE = 'runtime-cache-v1'

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/login',
  '/dashboard',
  '/dashboard/products',
  '/dashboard/sales',
  '/dashboard/reports',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// API routes that should be cached
const API_CACHE_PATTERNS = [
  /^\/api\/products/,
  /^\/api\/sales/,
  /^\/api\/users/,
  /^\/api\/reports/,
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        // Claim all clients immediately
        return self.clients.claim()
      })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network First with cache fallback
    event.respondWith(handleAPIRequest(request))
  } else if (url.pathname.startsWith('/_next/static/')) {
    // Static assets - Cache First
    event.respondWith(handleStaticAssets(request))
  } else {
    // Page requests - Network First with cache fallback
    event.respondWith(handlePageRequest(request))
  }
})

// Handle API requests with Network First strategy
async function handleAPIRequest(request) {
  const url = new URL(request.url)
  
  // Check if this API should be cached
  const shouldCache = API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))
  
  if (!shouldCache) {
    // Don't cache write operations or auth requests
    return fetch(request)
  }

  try {
    // Try network first
    const networkResponse = await fetch(request.clone())
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Network failed for API request, trying cache:', url.pathname)
    
    // Network failed, try cache
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for critical API calls
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Offline - no cached data available',
        offline: true,
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}

// Handle static assets with Cache First strategy
async function handleStaticAssets(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Failed to fetch static asset:', request.url)
    throw error
  }
}

// Handle page requests with Network First strategy
async function handlePageRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful page responses
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Network failed for page request, trying cache:', request.url)
    
    // Network failed, try cache
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page
    const offlinePage = await caches.match('/offline.html')
    if (offlinePage) {
      return offlinePage
    }
    
    // Fallback offline response
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - Minisupermercado</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #f7fafc;
              color: #2d3748;
            }
            .container {
              text-align: center;
              max-width: 400px;
              padding: 2rem;
            }
            .icon {
              font-size: 4rem;
              margin-bottom: 1rem;
            }
            .title {
              font-size: 1.5rem;
              font-weight: bold;
              margin-bottom: 0.5rem;
            }
            .message {
              color: #718096;
              margin-bottom: 2rem;
            }
            .button {
              background: #4299e1;
              color: white;
              padding: 0.75rem 1.5rem;
              border: none;
              border-radius: 0.375rem;
              cursor: pointer;
              font-size: 1rem;
            }
            .button:hover {
              background: #3182ce;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">📱</div>
            <h1 class="title">Estás trabajando offline</h1>
            <p class="message">
              No hay conexión a internet. Puedes seguir usando la aplicación 
              y los datos se sincronizarán cuando vuelva la conexión.
            </p>
            <button class="button" onclick="window.location.reload()">
              Intentar de nuevo
            </button>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    )
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(performBackgroundSync())
  }
})

async function performBackgroundSync() {
  try {
    // This would trigger the sync manager to upload pending changes
    const clients = await self.clients.matchAll()
    
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC',
        message: 'Performing background sync...',
      })
    })
    
    console.log('Background sync completed')
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event)
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación del minisupermercado',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalles',
        icon: '/icons/icon-72x72.png',
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icons/icon-72x72.png',
      },
    ],
  }
  
  event.waitUntil(
    self.registration.showNotification('Minisupermercado', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event)
  
  event.notification.close()
  
  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/dashboard')
    )
  }
})

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            return caches.delete(cacheName)
          })
        )
      })
    )
  }
})

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('Periodic sync triggered:', event.tag)
  
  if (event.tag === 'sync-data') {
    event.waitUntil(performPeriodicSync())
  }
})

async function performPeriodicSync() {
  try {
    // Perform lightweight sync operations
    console.log('Performing periodic sync...')
    
    // Notify clients about the sync
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'PERIODIC_SYNC',
        message: 'Periodic sync completed',
      })
    })
  } catch (error) {
    console.error('Periodic sync failed:', error)
  }
}

// Handle errors
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error)
})

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason)
})
