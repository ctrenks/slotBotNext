"use client";

import { useEffect } from "react";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    async function registerServiceWorker() {
      try {
        if (!("serviceWorker" in navigator)) {
          console.error("Service Worker not supported in this browser");
          return;
        }

        // Always register the service worker
        console.log("Registering service worker...");
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        console.log(
          "Service Worker registration successful with scope:",
          registration.scope
        );

        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;
        console.log("Service Worker is ready");

        // Handle updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              console.log("Service Worker state changed:", newWorker.state);
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                console.log("New service worker installed and ready");
                // Force reload to activate new service worker
                window.location.reload();
              }
            });
          }
        });

        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 3600000);

        // Handle communication with service worker
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data && event.data.type === "NOTIFICATION_CLICKED") {
            // Handle notification click
            window.focus();
            window.location.href = event.data.url || "/slotbot";
          }
        });

        // Test IndexedDB
        if ("indexedDB" in window) {
          try {
            const request = indexedDB.open("NotificationLogs", 2);
            request.onerror = () => {
              const error = request.error;
              console.error(
                "IndexedDB error:",
                error?.message || "Unknown error"
              );
            };
            request.onsuccess = () => {
              console.log("Successfully opened IndexedDB");
            };
          } catch (error) {
            console.error("Error testing IndexedDB:", error);
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error("Service Worker registration failed:", error.message);
        } else {
          console.error(
            "Service Worker registration failed with unknown error"
          );
        }
      }
    }

    // Call the registration function
    registerServiceWorker();
  }, []);

  return <>{children}</>;
}
