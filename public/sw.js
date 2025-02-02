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

    // iOS-optimized notification options
    const notificationOptions = {
      // Required for iOS
      title: "SlotBot", // Keep title short for iOS
      body: pushData.message || pushData.body || "New message available", // Simple message text
      badge: "/icons/icon-192x192.png", // iOS badge icon
      icon: "/icons/icon-192x192.png", // iOS notification icon

      // iOS-specific options
      sound: "default", // Enable sound on iOS
      vibrate: true, // Enable vibration
      timestamp: Date.now(),

      // Data for handling clicks
      data: {
        url: "/slotbot",
        messageId: pushData.id || Date.now().toString(),
      },

      // Make sure notification appears even in foreground
      requireInteraction: true,
      renotify: true,
      tag: "slotbot-message",

      // Actions for iOS
      actions: [
        {
          action: "open",
          title: "Open",
        },
      ],
    };

    console.log("Showing notification with options:", notificationOptions);

    event.waitUntil(
      (async () => {
        try {
          await self.registration.showNotification(
            notificationOptions.title,
            notificationOptions
          );
          console.log("Notification shown successfully");
        } catch (err) {
          console.error("Error showing notification:", err);
          // Try fallback notification for iOS
          try {
            await self.registration.showNotification("SlotBot", {
              body: pushData.message || "New message",
              badge: "/icons/icon-192x192.png",
              sound: "default",
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

self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked");
  event.notification.close();

  // For iOS, try to focus existing window first
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If we have an existing window, focus it
        for (const client of clientList) {
          if (client.url.includes("/slotbot") && "focus" in client) {
            return client.focus();
          }
        }
        // If no existing window, open a new one
        if (clients.openWindow) {
          return clients.openWindow("/slotbot");
        }
      })
      .catch((err) => {
        console.error("Error handling notification click:", err);
        // Fallback: try direct window open
        return clients.openWindow("/slotbot");
      })
  );
});
