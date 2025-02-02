const CACHE_NAME = "slotbot-v1";
const urlsToCache = [
  "/",
  "/slotbot",
  "/favicon.ico",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Keep track of shown notifications
let shownNotifications = new Set();

self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log("Service Worker caching files");

        // Cache files one by one to handle failures gracefully
        for (const url of urlsToCache) {
          try {
            await cache.add(url);
            console.log(`Cached: ${url}`);
          } catch (error) {
            console.warn(`Failed to cache: ${url}`, error);
            // Continue with other files even if one fails
          }
        }
        console.log("Service Worker installation complete");
      } catch (error) {
        console.error("Service Worker installation failed:", error);
      }
    })()
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

self.addEventListener("push", async function (event) {
  try {
    const data = event.data.json();
    const notificationId = data.id || Date.now().toString();

    // Check if we've already shown this notification
    if (shownNotifications.has(notificationId)) {
      console.log("Notification already shown:", notificationId);
      return;
    }

    // Add to shown notifications set
    shownNotifications.add(notificationId);

    // Limit the size of the set to prevent memory issues
    if (shownNotifications.size > 100) {
      const oldestId = shownNotifications.values().next().value;
      shownNotifications.delete(oldestId);
    }

    // Check if any clients are focused
    const clientList = await clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });

    const isClientFocused = clientList.some((client) => client.focused);

    // Only show notification if app is not focused
    if (!isClientFocused) {
      const options = {
        body: data.message || data.body || "New notification",
        tag: notificationId, // Use unique ID as tag to prevent duplicates
        renotify: false, // Prevent renotification for same tag
        requireInteraction: true,
        data: {
          url: "/slotbot", // Always redirect to slotbot page
          id: notificationId,
          timestamp: Date.now(),
        },
      };

      await self.registration.showNotification("SlotBot Message", options);

      // Store notification in IndexedDB
      const db = await openLogsDB();
      const tx = db.transaction("logs", "readwrite");
      const store = tx.objectStore("logs");
      await store.put({
        id: notificationId,
        timestamp: Date.now(),
        data: data,
        status: "shown",
        platform: "web",
      });
    }
  } catch (error) {
    console.error("Error showing notification:", error);
  }
});

// Simplified click handler for iOS
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  // Always redirect to /slotbot
  const urlToOpen = new URL("/slotbot", self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then(function (clientList) {
        // If we have a matching client, focus it
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // If no matching client, open new window
        return clients.openWindow(urlToOpen);
      })
  );
});

// Helper function to open IndexedDB
async function openLogsDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("NotificationLogs", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("logs")) {
        db.createObjectStore("logs", { keyPath: "id" });
      }
    };
  });
}
