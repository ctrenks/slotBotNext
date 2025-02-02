const CACHE_NAME = "slotbot-v1";
const urlsToCache = [
  "/",
  "/slotbot",
  "/favicon.ico",
  "/manifest.json",
  "/img/defaultuser.png",
];

// Keep track of shown notifications with timestamps
const shownNotifications = new Map();

// Helper function to clean up old notifications (keep last 24 hours)
function cleanupOldNotifications() {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  for (const [id, timestamp] of shownNotifications) {
    if (timestamp < oneDayAgo) {
      shownNotifications.delete(id);
    }
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
    console.log("Received push data:", data); // Debug log
    const notificationId = data.data?.alertId || Date.now().toString();
    const timestamp = Date.now();

    // Clean up old notifications periodically
    cleanupOldNotifications();

    // Check if we've already shown this notification recently (within last minute)
    const lastShownTime = shownNotifications.get(notificationId);
    if (lastShownTime && timestamp - lastShownTime < 60000) {
      console.log("Notification shown recently, skipping:", notificationId);
      return;
    }

    // Update shown notifications with current timestamp
    shownNotifications.set(notificationId, timestamp);

    // Always show notification on iOS, regardless of focus state
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    let shouldShowNotification = true;

    if (!isIOS) {
      // On non-iOS, check if any clients are focused
      const clientList = await clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      shouldShowNotification = !clientList.some((client) => client.focused);
    }

    // Show notification if conditions are met
    if (shouldShowNotification) {
      const options = {
        body: data.body || "New notification",
        tag: notificationId, // Use unique ID as tag to prevent duplicates
        renotify: true, // Enable renotification for iOS
        requireInteraction: !isIOS, // Don't require interaction on iOS
        icon: data.data?.icon || "/img/defaultuser.png",
        badge: "/img/defaultuser.png",
        timestamp: timestamp, // Add timestamp to notification
        actions: [
          {
            action: "play",
            title: "▶️ Play Now",
          },
        ],
        data: {
          url: "/slotbot", // Default redirect to slotbot
          playUrl: `/out/${notificationId}`, // Always use the outbound link
          id: notificationId,
          timestamp: timestamp,
        },
      };

      console.log("Notification options:", options); // Debug log

      await self.registration.showNotification("SlotBot Message", options);

      // Store notification in IndexedDB
      const db = await openLogsDB();
      const tx = db.transaction("logs", "readwrite");
      const store = tx.objectStore("logs");
      await store.put({
        id: notificationId,
        timestamp: timestamp,
        data: data,
        status: "shown",
        platform: isIOS ? "ios" : "web",
      });
    }
  } catch (error) {
    console.error("Error showing notification:", error);
  }
});

// Simplified click handler for iOS
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
