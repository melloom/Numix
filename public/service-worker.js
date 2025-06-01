const CACHE_NAME = "numix-calc-v1.2";
const STATIC_CACHE = "numix-static-v1.2";
const DYNAMIC_CACHE = "numix-dynamic-v1.2";

// Static assets to cache immediately
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
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

// Fetch event - cache strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== "GET" || url.protocol === "chrome-extension:") {
    return;
  }
  
  // Handle navigation requests (HTML pages)
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match("/index.html")
        .then((response) => {
          return response || fetch(request);
        })
        .catch(() => {
          return caches.match("/index.html");
        })
    );
    return;
  }
  
  // Handle static assets (Cache First strategy)
  if (isStaticAsset(request.url)) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          return response || fetch(request).then((fetchResponse) => {
            return caches.open(STATIC_CACHE).then((cache) => {
              if (fetchResponse.status === 200) {
                cache.put(request, fetchResponse.clone());
              }
              return fetchResponse;
            });
          });
        })
        .catch(() => {
          // Return offline fallback for important assets
          if (request.url.includes("/icons/")) {
            return new Response("", { status: 200 });
          }
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
  
  // Default: try cache first, then network
  event.respondWith(
    caches.match(request)
      .then((response) => {
        return response || fetch(request);
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
         url.includes(".ico");
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
