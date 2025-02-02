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
const shownNotifications = new Set();

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
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

self.addEventListener("push", (event) => {
  console.log("Push event received");

  if (!event.data) {
    console.log("No data in push event");
    return;
  }

  try {
    const data = event.data.json();
    console.log("Push data received:", data);

    // Check if we've already shown this notification
    const notificationId = data.id || data.body; // Use alert ID or message as unique identifier
    if (shownNotifications.has(notificationId)) {
      console.log("Duplicate notification prevented:", notificationId);
      return;
    }

    // Add to shown notifications set
    shownNotifications.add(notificationId);
    // Limit set size to prevent memory issues
    if (shownNotifications.size > 100) {
      const firstItem = shownNotifications.values().next().value;
      shownNotifications.delete(firstItem);
    }

    const options = {
      body: data.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      vibrate: [100, 50, 100],
      data: {
        ...data.data,
        id: notificationId,
      },
      tag: notificationId, // Use unique ID as tag to prevent duplicates
      renotify: true, // Force notification even if tag exists
      actions: [
        {
          action: "open",
          title: "View Alert",
        },
      ],
      // iOS specific options
      timestamp: Date.now(), // Add timestamp for iOS
      requireInteraction: true,
    };

    console.log("Showing notification with options:", options);
    event.waitUntil(
      self.registration
        .showNotification(data.title, options)
        .then(() => console.log("Notification shown successfully"))
        .catch((err) => console.error("Error showing notification:", err))
    );
  } catch (err) {
    console.error("Error processing push event:", err);
  }
});

self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event.notification.tag);
  event.notification.close();

  if (event.action === "open" || event.action === "") {
    // Open the app and navigate to the alerts page
    event.waitUntil(
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((windowClients) => {
          // Check if there is already a window/tab open with the target URL
          for (var i = 0; i < windowClients.length; i++) {
            var client = windowClients[i];
            if (client.url === "/slotbot" && "focus" in client) {
              return client.focus();
            }
          }
          // If no window/tab is already open, open a new one
          if (clients.openWindow) {
            return clients.openWindow("/slotbot");
          }
        })
    );
  }
});
