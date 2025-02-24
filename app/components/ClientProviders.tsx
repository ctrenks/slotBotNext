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

        // Check for existing service worker
        const existingRegistration =
          await navigator.serviceWorker.getRegistration();
        if (existingRegistration?.active) {
          console.log(
            "Active service worker found with scope:",
            existingRegistration.scope
          );

          // Check push subscription status
          if ("PushManager" in window) {
            try {
              const subscription =
                await existingRegistration.pushManager.getSubscription();
              console.log(
                "Current push subscription status:",
                subscription ? "active" : "none"
              );

              // If no subscription, we might need to re-register
              if (!subscription) {
                console.log(
                  "No push subscription found, will attempt to register new service worker"
                );
                await existingRegistration.unregister();
              } else {
                // Use existing service worker
                console.log(
                  "Using existing service worker with active push subscription"
                );
                return existingRegistration;
              }
            } catch (error) {
              console.error("Error checking push subscription:", error);
            }
          }
        }

        // Register new service worker if needed
        console.log("Registering new service worker...");
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

        // Test push manager and notification support
        if ("PushManager" in window && "Notification" in window) {
          try {
            const permission = await Notification.requestPermission();
            console.log("Notification permission status:", permission);

            if (permission === "granted") {
              const subscription =
                await registration.pushManager.getSubscription();
              if (!subscription) {
                console.log(
                  "No push subscription found, service worker may need to request one"
                );
              } else {
                console.log("Push subscription active");
              }
            }
          } catch (error) {
            console.error("Error setting up push notifications:", error);
          }
        } else {
          console.log("Push notifications not supported in this browser");
        }

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
          registration.update().catch((err) => {
            console.error("Error updating service worker:", err);
          });
        }, 3600000);

        // Handle communication with service worker
        navigator.serviceWorker.addEventListener("message", (event) => {
          console.log("Received message from service worker:", event.data);
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
              console.error(
                "IndexedDB error:",
                request.error?.message || "Unknown error"
              );
            };
            request.onsuccess = () => {
              console.log("Successfully opened IndexedDB");
              const db = request.result;
              // Log the object stores
              console.log(
                "Available object stores:",
                Array.from(db.objectStoreNames)
              );
              db.close();
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

    // Cleanup function
    return () => {
      // Clear the update check interval
      // Note: We don't need to unregister the service worker on cleanup
    };
  }, []);

  return <>{children}</>;
}
