const CACHE_NAME = "slotbot-v1";
const urlsToCache = [
  "/",
  "/slotbot",
  "/favicon.ico",
  "/manifest.json",
  "/img/defaultuser.png",
];

// Helper function to open IndexedDB
async function openLogsDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("NotificationLogs", 2);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("logs")) {
        db.createObjectStore("logs", { keyPath: "id" });
      }
      // Add a new object store for tracking shown notifications
      if (!db.objectStoreNames.contains("shown")) {
        db.createObjectStore("shown", { keyPath: "id" });
      }
    };
  });
}

// Helper function to clean up old notifications
async function cleanupOldNotifications() {
  try {
    const db = await openLogsDB();
    const tx = db.transaction("shown", "readwrite");
    const store = tx.objectStore("shown");
    const tenSecondsAgo = Date.now() - 10 * 1000;

    // Get all records
    const request = store.openCursor();
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        if (cursor.value.timestamp < tenSecondsAgo) {
          store.delete(cursor.key);
        }
        cursor.continue();
      }
    };
  } catch (error) {
    console.error("Error cleaning up old notifications:", error);
  }
}

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
  // Prevent the service worker from terminating before everything is done
  event.waitUntil(
    (async function () {
      try {
        if (!event.data) {
          console.log("Push event has no data, showing default notification");
          await self.registration.showNotification("New Alert", {
            body: "New SlotBot alert available",
          });
          return;
        }

        const data = event.data.json();
        console.log("Received push data:", data);
        const notificationId = data.data?.alertId || Date.now().toString();
        const timestamp = Date.now();

        // Clean up old notifications periodically
        await cleanupOldNotifications();

        // Always show notifications
        const isIOS = /iPhone|iPad|iPod/.test(self.navigator?.userAgent || "");
        const options = {
          title: data.title || "SlotBot Message",
          body: data.body || "New notification",
          tag: `${notificationId}-${timestamp}`, // Make each notification unique
          renotify: true,
          requireInteraction: !isIOS,
          icon: data.data?.icon || "/img/defaultuser.png",
          badge: "/img/defaultuser.png",
          vibrate: [100, 50, 100],
          timestamp: timestamp,
          actions: [
            {
              action: "play",
              title: "▶️ Play Now",
            },
          ],
          data: {
            url: "/slotbot",
            playUrl: `/out/${notificationId}`,
            id: notificationId,
            timestamp: timestamp,
          },
        };

        console.log("Showing notification with options:", options);

        // Show the notification
        await self.registration.showNotification(options.title, options);
        console.log("Notification shown successfully");

        // Store notification in logs
        const db = await openLogsDB();
        const tx = db.transaction("logs", "readwrite");
        const store = tx.objectStore("logs");
        await store.put({
          id: `${notificationId}-${timestamp}`,
          timestamp: timestamp,
          data: data,
          status: "shown",
          platform: isIOS ? "ios" : "web",
        });
      } catch (error) {
        console.error("Error in push event handler:", error);
        // Show a fallback notification if something went wrong
        await self.registration.showNotification("New Alert", {
          body: "New SlotBot alert available",
        });
      }
    })()
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  let urlToOpen;

  // Handle play button click
  if (event.action === "play" && event.notification.data.playUrl) {
    urlToOpen = new URL(event.notification.data.playUrl, self.location.origin)
      .href;
  } else {
    // Default to slotbot page
    urlToOpen = new URL("/slotbot", self.location.origin).href;
  }

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
