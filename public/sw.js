const CACHE_NAME = "slotbot-v1";
const urlsToCache = [
  "/",
  "/slotbot",
  "/favicon.ico",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Keep track of shown notifications to prevent duplicates
const shownNotificationIds = new Set();

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
    console.log("No message data in push event");
    return;
  }

  try {
    const pushData = event.data.json();
    console.log("Push message data received:", pushData);

    // Generate a unique ID for this notification
    const notificationId =
      pushData.data?.id || pushData.body || Date.now().toString();

    // Check if we've already shown a notification for this message
    if (shownNotificationIds.has(notificationId)) {
      console.log(
        "Duplicate notification prevented for message:",
        notificationId
      );
      return;
    }

    // Track this notification
    shownNotificationIds.add(notificationId);
    // Limit set size to prevent memory issues
    if (shownNotificationIds.size > 100) {
      const firstItem = shownNotificationIds.values().next().value;
      shownNotificationIds.delete(firstItem);
    }

    const notificationOptions = {
      body: pushData.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      vibrate: [100, 50, 100],
      data: {
        id: notificationId,
        url: "/slotbot",
        messageData: pushData.data?.messageData || pushData, // Store original message data
        timestamp: new Date().toISOString(),
      },
      tag: notificationId,
      renotify: true, // Show notification even if one with same tag exists
      actions: [
        {
          action: "open",
          title: "View Message",
        },
      ],
      // iOS specific options
      timestamp: Date.now(),
      requireInteraction: true,
      silent: false, // Ensure notification sound plays
    };

    console.log("Creating notification for message:", {
      title: pushData.title,
      options: notificationOptions,
    });

    event.waitUntil(
      (async () => {
        try {
          // Check if we have permission to show notifications
          if (self.Notification && self.Notification.permission === "granted") {
            await self.registration.showNotification(
              pushData.title,
              notificationOptions
            );
            console.log(
              "Notification shown successfully for message:",
              notificationId
            );
          } else {
            console.log(
              "Cannot show notification - permission not granted:",
              self.Notification?.permission
            );
          }
        } catch (err) {
          console.error("Error showing notification for message:", err);
        }
      })()
    );
  } catch (err) {
    console.error("Error processing push message:", err);
  }
});

self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked for message:", event.notification.tag);
  event.notification.close();

  // Get the message data
  const messageData = event.notification.data;
  const urlToOpen = messageData?.url || "/slotbot";

  if (event.action === "open" || event.action === "") {
    // Open the app and navigate to the messages page
    event.waitUntil(
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((windowClients) => {
          // Check if there is already a window/tab open with the target URL
          for (var i = 0; i < windowClients.length; i++) {
            var client = windowClients[i];
            if (client.url.includes(urlToOpen) && "focus" in client) {
              return client.focus();
            }
          }
          // If no window/tab is already open, open a new one
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});
