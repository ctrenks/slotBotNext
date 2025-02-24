"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

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
  const { data: session } = useSession();

  useEffect(() => {
    async function registerServiceWorker() {
      try {
        if (!("serviceWorker" in navigator)) {
          console.error("Service Worker not supported in this browser");
          return;
        }

        // Check for existing service worker
        const registrations = await navigator.serviceWorker.getRegistrations();
        let registration;

        if (registrations.length > 0) {
          // Use the existing registration if it's valid
          registration = registrations[0];
          console.log("Found existing service worker:", {
            scope: registration.scope,
            state: registration.active?.state,
            scriptURL: registration.active?.scriptURL,
          });

          // Check if update is needed
          try {
            await registration.update();
            console.log("Service worker updated");
          } catch (error) {
            console.error("Error updating service worker:", error);
          }
        } else {
          // Register new service worker if none exists
          console.log("Registering new service worker...");
          registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
            updateViaCache: "none",
          });
        }

        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;
        console.log("Service Worker is active:", {
          scope: registration.scope,
          state: registration.active?.state,
          scriptURL: registration.active?.scriptURL,
        });

        // Test push manager and notification support
        if (
          "PushManager" in window &&
          "Notification" in window &&
          session?.user?.email
        ) {
          try {
            // Request notification permission first
            const permission = await Notification.requestPermission();
            console.log("Notification permission status:", permission);

            if (permission === "granted") {
              // Get VAPID key
              console.log("Fetching VAPID key...");
              const response = await fetch("/api/push/vapid-public-key");
              if (!response.ok) {
                throw new Error("Failed to fetch VAPID key");
              }
              const vapidPublicKey = await response.text();
              console.log("Received VAPID key");

              // Convert VAPID key
              const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

              // Check existing subscription
              let subscription =
                await registration.pushManager.getSubscription();

              // Only create new subscription if none exists or if validation fails
              if (!subscription) {
                console.log("Creating new push subscription...");
                subscription = await registration.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: convertedVapidKey,
                });

                console.log("Push subscription created:", {
                  endpoint: subscription.endpoint,
                });

                // Send subscription to server
                const registerResponse = await fetch("/api/push/register", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    subscription,
                    userEmail: session.user.email,
                  }),
                });

                if (!registerResponse.ok) {
                  throw new Error(
                    "Failed to register push subscription with server"
                  );
                }

                console.log("Push subscription registered with server");
              } else {
                console.log("Using existing push subscription:", {
                  endpoint: subscription.endpoint,
                });
              }
            }
          } catch (error) {
            console.error("Error setting up push notifications:", error);
          }
        } else if (!session?.user?.email) {
          console.log(
            "Skipping push notification setup - no user email available"
          );
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

    // Call the registration function immediately
    registerServiceWorker();

    // Cleanup function
    return () => {
      // No cleanup needed for service worker
    };
  }, [session]); // Add session to dependency array

  return <>{children}</>;
}
