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
    const request = indexedDB.open("NotificationLogs", 2); // Increased version number

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

// Helper function to check if notification was recently shown
async function wasRecentlyShown(notificationId, timestamp) {
  try {
    const db = await openLogsDB();
    const tx = db.transaction("shown", "readonly");
    const store = tx.objectStore("shown");
    const record = await store.get(notificationId);

    if (!record) {
      return false;
    }

    // Only consider it a duplicate if it's the exact same notification (same ID and timestamp)
    // Or if it's within 10 seconds (to prevent rapid-fire notifications)
    const tenSecondsAgo = Date.now() - 10 * 1000;
    return (
      record.timestamp > tenSecondsAgo && record.alertTimestamp === timestamp
    );
  } catch (error) {
    console.error("Error checking recent notifications:", error);
    return false;
  }
}

// Helper function to mark notification as shown
async function markAsShown(notificationId, timestamp) {
  try {
    const db = await openLogsDB();
    const tx = db.transaction("shown", "readwrite");
    const store = tx.objectStore("shown");
    await store.put({
      id: notificationId,
      timestamp: Date.now(),
      alertTimestamp: timestamp,
    });
  } catch (error) {
    console.error("Error marking notification as shown:", error);
  }
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
  try {
    const data = event.data.json();
    console.log("Received push data:", data);
    const notificationId = data.data?.alertId || Date.now().toString();
    const timestamp = Date.now();

    // Clean up old notifications periodically
    await cleanupOldNotifications();

    // Check if we've already shown this exact notification recently
    if (await wasRecentlyShown(notificationId, timestamp)) {
      console.log("Exact notification shown recently, skipping:", {
        notificationId,
        timestamp,
      });
      return;
    }

    // Mark notification as shown with timestamp
    await markAsShown(notificationId, timestamp);

    // Always show notifications
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const options = {
      body: data.body || "New notification",
      tag: `${notificationId}-${timestamp}`, // Make each notification unique
      renotify: true,
      requireInteraction: !isIOS,
      icon: data.data?.icon || "/img/defaultuser.png",
      badge: "/img/defaultuser.png",
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

    console.log("Notification options:", options);

    await self.registration.showNotification("SlotBot Message", options);

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
    console.error("Error showing notification:", error);
  }
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
