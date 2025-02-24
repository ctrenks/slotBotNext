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
      try {
        await clients.claim();
        // Test IndexedDB access
        await openLogsDB();
        console.log("IndexedDB access confirmed during activation");

        // Log activation success
        await logToIndexedDB({
          type: "activation",
          status: "success",
          timestamp: Date.now(),
        });

        // Clean up any old caches
        const cacheKeys = await caches.keys();
        await Promise.all(
          cacheKeys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        );
        console.log("Old caches cleaned up");
      } catch (error) {
        console.error("Failed to access IndexedDB during activation:", error);
        // Try to log the error even if IndexedDB failed
        try {
          await logToIndexedDB({
            type: "activation",
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: Date.now(),
          });
        } catch (e) {
          console.error("Failed to log activation error:", e);
        }
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
  console.log(
    "Push event received with data:",
    event.data ? await event.data.text() : "no data"
  );

  event.waitUntil(
    (async function () {
      try {
        // Check if we can show notifications
        if (
          !(self.Notification && self.Notification.permission === "granted")
        ) {
          console.error("Notifications not permitted");
          return;
        }

        // Log push event receipt immediately
        await logToIndexedDB({
          type: "push_received",
          timestamp: Date.now(),
          data: event.data ? await event.data.text() : null,
        }).catch((err) => console.error("Failed to log push event:", err));

        let notificationData;
        if (!event.data) {
          console.log("Push event has no data, showing default notification");
          notificationData = {
            title: "New Alert",
            body: "New SlotBot alert available",
            data: { url: "/slotbot" },
          };
        } else {
          try {
            const rawData = await event.data.text();
            console.log("Raw push data:", rawData);
            notificationData = JSON.parse(rawData);
          } catch (error) {
            console.error("Error parsing push data:", error);
            notificationData = {
              title: "New Alert",
              body: "New SlotBot alert available",
              data: { url: "/slotbot" },
            };
          }
        }

        const timestamp = Date.now();
        const notificationId =
          notificationData.data?.alertId || timestamp.toString();

        // Clean up old notifications
        await cleanupOldNotifications().catch((err) =>
          console.error("Failed to cleanup old notifications:", err)
        );

        // Detect iOS
        const isIOS = /iPhone|iPad|iPod/.test(self.navigator?.userAgent || "");
        console.log("Platform detection:", { isIOS });

        // Configure notification options
        const options = {
          body: notificationData.body || "New notification",
          tag: `${notificationId}-${timestamp}`,
          renotify: true,
          requireInteraction: !isIOS,
          icon: notificationData.data?.icon || "/img/defaultuser.png",
          badge: "/img/defaultuser.png",
          silent: isIOS, // No sound on iOS
          vibrate: isIOS ? undefined : [100, 50, 100],
          timestamp: timestamp,
          data: {
            url: "/slotbot",
            playUrl: `/out/${notificationId}`,
            id: notificationId,
            timestamp: timestamp,
            isIOS: isIOS,
          },
        };

        if (!isIOS) {
          options.actions = [
            {
              action: "play",
              title: "▶️ Play Now",
            },
          ];
        }

        console.log("Attempting to show notification with options:", options);

        // Show the notification
        await self.registration.showNotification(
          notificationData.title || "SlotBot Message",
          options
        );
        console.log("Notification shown successfully");

        // Store notification in logs
        await logToIndexedDB({
          id: `${notificationId}-${timestamp}`,
          type: "notification",
          timestamp: timestamp,
          data: notificationData,
          status: "shown",
          platform: isIOS ? "ios" : "web",
        }).catch((err) => console.error("Failed to log notification:", err));
      } catch (error) {
        console.error("Error in push event handler:", error);
        // Log the error and show fallback notification
        try {
          await logToIndexedDB({
            type: "error",
            message: error instanceof Error ? error.message : "Unknown error",
            timestamp: Date.now(),
            data: event.data ? await event.data.text() : null,
          });

          await self.registration.showNotification("New Alert", {
            body: "New SlotBot alert available",
            tag: `error-${Date.now()}`,
            renotify: true,
            requireInteraction: false,
          });
        } catch (e) {
          console.error("Critical error in error handler:", e);
        }
      }
    })()
  );
});

self.addEventListener("notificationclick", function (event) {
  console.log("Notification clicked:", event.notification.tag);

  event.notification.close();

  let urlToOpen;
  const notificationData = event.notification.data || {};

  // Handle play button click or direct notification click
  if (event.action === "play" && notificationData.playUrl) {
    urlToOpen = new URL(notificationData.playUrl, self.location.origin).href;
  } else {
    // Default to slotbot page
    urlToOpen = new URL("/slotbot", self.location.origin).href;
  }

  // Log the click
  event.waitUntil(
    (async () => {
      try {
        await logToIndexedDB({
          type: "notification_click",
          timestamp: Date.now(),
          notificationTag: event.notification.tag,
          action: event.action || "direct",
          url: urlToOpen,
          isIOS: notificationData.isIOS,
        });

        const allClients = await clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });

        // If we have a matching client, focus it
        for (const client of allClients) {
          if (client.url === urlToOpen && "focus" in client) {
            await client.focus();
            return;
          }
        }
        // If no matching client, open new window
        await clients.openWindow(urlToOpen);
      } catch (error) {
        console.error("Error handling notification click:", error);
        // Try to log the error
        await logToIndexedDB({
          type: "error",
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: Date.now(),
          context: "notification_click",
        });
      }
    })()
  );
});
