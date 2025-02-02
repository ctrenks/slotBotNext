const CACHE_NAME = "slotbot-v1";
const urlsToCache = [
  "/",
  "/slotbot",
  "/favicon.ico",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker caching files");
      return cache.addAll(urlsToCache);
    })
  );
  // Activate worker immediately
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");
  // Claim control immediately
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch new version
      return response || fetch(event.request);
    })
  );
});

self.addEventListener("push", (event) => {
  console.log("Push event received in service worker");

  if (!event.data) {
    console.log("No data in push event");
    return;
  }

  try {
    const pushData = event.data.json();
    console.log("Push data received:", pushData);

    // Simple notification options for iOS
    const notificationOptions = {
      body: pushData.message || pushData.body || "New message",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      tag: Date.now().toString(), // Unique tag for each notification
      timestamp: Date.now(),
      data: {
        url: "/slotbot",
      },
      // iOS specific
      sound: true,
      renotify: true,
      requireInteraction: true,
    };

    console.log("Showing notification with options:", notificationOptions);

    event.waitUntil(
      (async () => {
        try {
          // Show the notification with minimal options first
          await self.registration.showNotification(
            "SlotBot",
            notificationOptions
          );
          console.log("Notification shown successfully");
        } catch (err) {
          console.error("Error showing notification:", err);
          // Ultra minimal fallback
          try {
            await self.registration.showNotification("SlotBot", {
              body: pushData.message || "New message",
              tag: Date.now().toString(),
            });
          } catch (fallbackErr) {
            console.error("Fallback notification failed:", fallbackErr);
          }
        }
      })()
    );
  } catch (err) {
    console.error("Error processing push event:", err);
  }
});

// Simplified click handler for iOS
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(clients.openWindow("/slotbot"));
});
