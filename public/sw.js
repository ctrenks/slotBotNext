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

    // Ensure we have a message
    const message = pushData.message || pushData.body || "New SlotBot Alert";

    // iOS-optimized notification options
    const notificationOptions = {
      // Basic notification info
      title: "SlotBot Alert", // Keep consistent branding
      body: message,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",

      // iOS specific options
      timestamp: Date.now(), // Required for iOS background notifications
      tag: `slotbot-${Date.now()}`, // Unique tag to prevent duplicates
      renotify: true, // Force notification even if same tag
      silent: false, // Enable sound
      vibrate: [200, 100, 200], // Vibration pattern

      // Data for handling clicks
      data: {
        url: pushData.url || "/slotbot",
        messageId: pushData.id || Date.now().toString(),
        openTime: Date.now(),
      },

      // Actions
      actions: [
        {
          action: "open",
          title: "View",
        },
      ],

      // Critical for iOS background notifications
      requireInteraction: true,
    };

    console.log("Showing notification with options:", notificationOptions);

    event.waitUntil(
      (async () => {
        try {
          // Play notification sound for iOS
          const audio = new Audio("/notification.mp3");
          await audio
            .play()
            .catch((err) => console.log("Audio play failed:", err));

          // Show the notification
          await self.registration.showNotification(
            notificationOptions.title,
            notificationOptions
          );
          console.log("Notification shown successfully");
        } catch (err) {
          console.error("Error showing notification:", err);
          // Fallback notification for iOS
          try {
            await self.registration.showNotification("SlotBot", {
              body: message,
              badge: "/icons/icon-192x192.png",
              sound: "default",
              data: { url: "/slotbot" },
              timestamp: Date.now(),
              requireInteraction: true,
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
  console.log("Notification clicked:", event);
  event.notification.close();

  // Handle notification click
  event.waitUntil(
    (async () => {
      try {
        // Get all windows
        const windowClients = await clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });

        // If we have a window open, focus it
        for (const client of windowClients) {
          if (client.url.includes("/slotbot")) {
            await client.focus();
            return;
          }
        }

        // If no window is open, open a new one
        await clients.openWindow("/slotbot");
      } catch (err) {
        console.error("Error handling notification click:", err);
        // Fallback: direct window open
        await clients.openWindow("/slotbot");
      }
    })()
  );
});
