// Define a new cache name to force an update
const CACHE_NAME = "checkin-app-cache-v3";

// List of files to cache - Using relative paths
const urlsToCache = [
  '.', // Caches the root of the PWA's scope (the current directory)
  './index.html',
  './manifest.json',
  // It's good practice to cache the icons your manifest refers to
  './icons/us_192.png',
  './icons/us_512.png',
  // External resources are cached as-is
  "https://cdn.tailwindcss.com",
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1887",
  "https://placehold.co/180x180/16a34a/ffffff?text=App"
];

// Install event: open cache and add all files to it
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching app shell");
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log("Service Worker: Installation complete");
        return self.skipWaiting(); // Activate the new service worker immediately
      })
      .catch(error => {
          console.error('Service Worker: Caching failed:', error);
      })
  );
});

// Activate event: clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              console.log("Service Worker: Clearing old cache:", cache);
              return caches.delete(cache);
            }
          })
        );
      })
      .then(() => {
        console.log("Service Worker: Activation complete");
        return self.clients.claim(); // Take control of all open clients
      })
  );
});

// Fetch event: decide how to respond to network requests
self.addEventListener("fetch", (event) => {
  // For navigation requests (e.g., loading the page), use a network-first strategy.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If the fetch is successful, clone it, cache it, and return it.
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If the network fails, serve the main page from the cache.
          return caches.match('./index.html');
        })
    );
    return;
  }

  // For all other requests (CSS, JS, images), use a cache-first strategy.
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return from cache if found, otherwise fetch from the network.
      return response || fetch(event.request);
    })
  );
});
