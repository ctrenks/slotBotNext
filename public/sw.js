const CACHE_NAME = "slotbot-v1";
const urlsToCache = [
  "/",
  "/slotbot",
  "/favicon.ico",
  "/manifest.json",
  "/img/defaultuser.png",
];

// Helper function to open IndexedDB with better error handling
async function openLogsDB() {
  return new Promise((resolve, reject) => {
    console.log("Opening IndexedDB...");
    const request = indexedDB.open("NotificationLogs", 2);

    request.onerror = () => {
      const error = request.error;
      console.error("IndexedDB error:", error?.message || "Unknown error");
      reject(error || new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = () => {
      console.log("Successfully opened IndexedDB");
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log(
        "Upgrading IndexedDB from version",
        event.oldVersion,
        "to",
        event.newVersion
      );

      // Create or update stores based on version
      if (event.oldVersion < 1) {
        if (!db.objectStoreNames.contains("logs")) {
          console.log("Creating logs store");
          const logsStore = db.createObjectStore("logs", { keyPath: "id" });
          logsStore.createIndex("timestamp", "timestamp");
        }
      }

      if (event.oldVersion < 2) {
        if (!db.objectStoreNames.contains("shown")) {
          console.log("Creating shown store");
          const shownStore = db.createObjectStore("shown", { keyPath: "id" });
          shownStore.createIndex("timestamp", "timestamp");
        }
      }
    };
  });
}

// Helper function to log to IndexedDB with better error handling
async function logToIndexedDB(data) {
  try {
    console.log("Attempting to log to IndexedDB:", data);
    const db = await openLogsDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction("logs", "readwrite");
      const store = tx.objectStore("logs");

      const timestamp = Date.now();
      const id = `${data.id || "notification"}-${timestamp}`;

      const record = {
        id,
        timestamp,
        data,
        status: "logged",
        platform: /iPhone|iPad|iPod/.test(self.navigator?.userAgent || "")
          ? "ios"
          : "web",
      };

      const request = store.put(record);

      request.onerror = () => {
        const error = request.error;
        console.error(
          "Failed to write to IndexedDB:",
          error?.message || "Unknown error"
        );
        reject(error || new Error("Failed to write to IndexedDB"));
      };

      request.onsuccess = () => {
        console.log("Successfully logged to IndexedDB:", id);
        resolve(id);
      };

      tx.oncomplete = () => {
        console.log("IndexedDB transaction completed");
      };
    });
  } catch (error) {
    console.error("Failed to log to IndexedDB:", error);
    throw error;
  }
}

// Helper function to clean up old notifications
async function cleanupOldNotifications() {
  try {
    console.log("Cleaning up old notifications...");
    const db = await openLogsDB();
    const tx = db.transaction("shown", "readwrite");
    const store = tx.objectStore("shown");
    const index = store.index("timestamp");
    const tenSecondsAgo = Date.now() - 10 * 1000;

    const request = index.openCursor(IDBKeyRange.upperBound(tenSecondsAgo));

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      }
    };

    tx.oncomplete = () => {
      console.log("Cleanup completed");
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
  event.waitUntil(
    (async () => {
      await clients.claim();
      // Test IndexedDB access
      try {
        await openLogsDB();
        console.log("IndexedDB access confirmed during activation");
      } catch (error) {
        console.error("Failed to access IndexedDB during activation:", error);
      }
    })()
  );
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
  console.log("Push event received");

  event.waitUntil(
    (async function () {
      try {
        if (!event.data) {
          console.log("Push event has no data, showing default notification");
          await logToIndexedDB({
            type: "default",
            message: "No data in push event",
            timestamp: Date.now(),
          });

          await self.registration.showNotification("New Alert", {
            body: "New SlotBot alert available",
          });
          return;
        }

        const data = event.data.json();
        console.log("Received push data:", data);

        // Log the push event immediately
        await logToIndexedDB({
          type: "push",
          data: data,
          timestamp: Date.now(),
        });

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
        await logToIndexedDB({
          id: `${notificationId}-${timestamp}`,
          type: "notification",
          timestamp: timestamp,
          data: data,
          status: "shown",
          platform: isIOS ? "ios" : "web",
        });
      } catch (error) {
        console.error("Error in push event handler:", error);
        // Log the error
        await logToIndexedDB({
          type: "error",
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: Date.now(),
        });
        // Show a fallback notification
        await self.registration.showNotification("New Alert", {
          body: "New SlotBot alert available",
        });
      }
    })()
  );
});

self.addEventListener("notificationclick", function (event) {
  console.log("Notification clicked:", event.notification.tag);

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
