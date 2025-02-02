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

    // Generate unique ID for this notification
    const notificationId = Date.now().toString();

    // Simple notification options that work on both desktop and iOS
    const notificationOptions = {
      body: pushData.message || pushData.body || "New message",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      tag: notificationId,
      timestamp: Date.now(),
      renotify: true, // Force new notification even if same tag
      silent: false, // Enable sound
      data: {
        url: "/slotbot",
        id: notificationId,
        timestamp: Date.now(),
      },
    };

    console.log("Showing notification with options:", notificationOptions);

    // Store notification data in IndexedDB for debug page
    event.waitUntil(
      (async () => {
        try {
          // First try to show the notification
          await self.registration.showNotification(
            "SlotBot",
            notificationOptions
          );
          console.log("Notification shown successfully");

          // Then try to store it for debugging
          const db = await openDatabase();
          await storeNotification(db, {
            id: notificationId,
            timestamp: Date.now(),
            data: pushData,
            status: "shown",
            platform: navigator.platform,
          });
          console.log("Notification stored in debug database");
        } catch (err) {
          console.error("Error in push event:", err);

          // Try ultra minimal fallback
          try {
            await self.registration.showNotification("SlotBot", {
              body: pushData.message || "New message",
              tag: notificationId + "-fallback",
            });

            // Store fallback attempt
            const db = await openDatabase();
            await storeNotification(db, {
              id: notificationId,
              timestamp: Date.now(),
              data: pushData,
              status: "fallback-shown",
              error: err.message,
              platform: navigator.platform,
            });
          } catch (fallbackErr) {
            console.error("Fallback notification failed:", fallbackErr);

            // Store failure
            const db = await openDatabase();
            await storeNotification(db, {
              id: notificationId,
              timestamp: Date.now(),
              data: pushData,
              status: "failed",
              error: fallbackErr.message,
              platform: navigator.platform,
            });
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

// IndexedDB setup for debug logging
const DB_NAME = "PushNotificationDebug";
const STORE_NAME = "notifications";

async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

async function storeNotification(db, data) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(data);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}
