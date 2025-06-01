const CACHE_NAME = "numix-calc-v2.0";
const STATIC_CACHE = "numix-static-v2.0";
const DYNAMIC_CACHE = "numix-dynamic-v2.0";

// Static assets to cache immediately
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png"
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log("Service Worker: Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("Service Worker: Skip waiting");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("Service Worker: Cache failed", error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => 
            name !== STATIC_CACHE && 
            name !== DYNAMIC_CACHE &&
            name !== CACHE_NAME
          )
          .map((name) => {
            console.log("Service Worker: Deleting old cache", name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log("Service Worker: Claiming clients");
      return self.clients.claim();
    })
  );
});

// Fetch event - improved cache strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== "GET" || url.protocol === "chrome-extension:") {
    return;
  }

  // Skip requests to different origins unless they're for assets
  if (url.origin !== location.origin && !isStaticAsset(request.url)) {
    return;
  }
  
  // Handle navigation requests (HTML pages) - FIX WHITE SCREEN
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If fetch succeeds, return the response and cache it
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If fetch fails, try to serve from cache
          return caches.match("/index.html")
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Last resort: create a basic HTML response
              return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                  <title>Numix Calculator</title>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    body { 
                      font-family: system-ui; 
                      display: flex; 
                      align-items: center; 
                      justify-content: center; 
                      height: 100vh; 
                      margin: 0; 
                      background: linear-gradient(135deg, #e5e9f2 0%, #c7d2fe 100%);
                    }
                    .loading { text-align: center; }
                  </style>
                </head>
                <body>
                  <div class="loading">
                    <h1>Numix Calculator</h1>
                    <p>Loading... Please check your connection.</p>
                  </div>
                  <script>
                    setTimeout(() => window.location.reload(), 2000);
                  </script>
                </body>
                </html>
              `, {
                headers: { 'Content-Type': 'text/html' }
              });
            });
        })
    );
    return;
  }
  
  // Handle static assets (Cache First strategy)
  if (isStaticAsset(request.url)) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(request).then((fetchResponse) => {
            // Only cache successful responses
            if (fetchResponse.status === 200) {
              const responseClone = fetchResponse.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return fetchResponse;
          });
        })
        .catch(() => {
          // Return empty response for missing assets
          if (request.url.includes("/icons/")) {
            return new Response("", { status: 404 });
          }
          return new Response("", { status: 404 });
        })
    );
    return;
  }
  
  // Handle API requests (Network First strategy)
  if (isApiRequest(request.url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached response if network fails
          return caches.match(request);
        })
    );
    return;
  }
  
  // Default: Network first, then cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Helper functions
function isStaticAsset(url) {
  return url.includes("/assets/") || 
         url.includes("/icons/") || 
         url.includes(".js") || 
         url.includes(".css") || 
         url.includes(".png") || 
         url.includes(".jpg") || 
         url.includes(".ico") ||
         url.includes(".svg") ||
         url.includes(".woff") ||
         url.includes(".woff2");
}

function isApiRequest(url) {
  return url.includes("api.") || 
         url.includes("/api/") ||
         url.includes("mathjs.org") ||
         url.includes("forexrateapi.com");
}

// Background sync for offline calculations (if supported)
self.addEventListener("sync", (event) => {
  if (event.tag === "background-calculation") {
    event.waitUntil(doBackgroundCalculation());
  }
});

async function doBackgroundCalculation() {
  // Handle offline calculations when back online
  console.log("Service Worker: Handling background calculation sync");
}

// Push notifications (future feature)
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "New calculation result available",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification("Numix Calculator", options)
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow("/")
  );
});

// Handle messages from the main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
