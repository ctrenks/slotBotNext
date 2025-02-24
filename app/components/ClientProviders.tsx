"use client";

import { useEffect } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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

        // Check for existing service worker registration
        const existingRegistration =
          await navigator.serviceWorker.getRegistration();

        if (existingRegistration) {
          console.log("Found existing service worker:", {
            scope: existingRegistration.scope,
            state: existingRegistration.active?.state,
            scriptURL: existingRegistration.active?.scriptURL,
          });

          // Test if the existing service worker is functioning
          const subscription =
            await existingRegistration.pushManager.getSubscription();
          if (subscription) {
            console.log("Found existing push subscription:", {
              endpoint: subscription.endpoint,
              expirationTime: subscription.expirationTime,
            });
            return; // Keep existing service worker if it has a valid subscription
          }
        }

        // Register new service worker
        console.log("Registering new service worker...");
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        console.log("Service Worker registration successful:", {
          scope: registration.scope,
          state: registration.active?.state || "installing",
        });

        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;
        console.log("Service Worker is ready");

        // Test push manager and notification support
        if ("PushManager" in window && "Notification" in window) {
          try {
            const permission = await Notification.requestPermission();
            console.log("Notification permission status:", permission);

            if (permission === "granted") {
              // Get VAPID key
              const response = await fetch("/api/push/vapid-public-key");
              if (!response.ok) {
                throw new Error("Failed to fetch VAPID key");
              }
              const vapidPublicKey = await response.text();

              // Convert VAPID key
              const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

              // Subscribe to push notifications
              const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey,
              });

              console.log("Push subscription created:", {
                endpoint: subscription.endpoint,
                expirationTime: subscription.expirationTime,
              });
            }
          } catch (error) {
            console.error("Error setting up push notifications:", error);
          }
        }

        // Handle service worker updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              console.log("Service Worker state changed:", newWorker.state);
              if (newWorker.state === "activated") {
                console.log(
                  "New service worker activated, reloading for clean state"
                );
                window.location.reload();
              }
            });
          }
        });

        // Check for updates every 30 minutes
        setInterval(() => {
          registration.update().catch((err) => {
            console.error("Error updating service worker:", err);
          });
        }, 1800000);

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
        console.error("Service Worker registration failed:", error);
      }
    }

    // Call the registration function
    registerServiceWorker();

    // Cleanup function
    return () => {
      // No cleanup needed for service worker
    };
  }, []);

  return <>{children}</>;
}
