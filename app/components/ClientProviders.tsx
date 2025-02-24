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
  const { data: session, status } = useSession();

  useEffect(() => {
    // Only proceed if we have an authenticated session
    if (status !== "authenticated" || !session?.user?.email) {
      console.log(
        "Waiting for authentication before registering service worker...",
        {
          status,
          hasSession: !!session,
          userEmail: session?.user?.email,
        }
      );
      return;
    }

    console.log("Starting service worker registration process...", {
      status,
      userEmail: session.user.email,
      timestamp: new Date().toISOString(),
    });

    let registration: ServiceWorkerRegistration | null = null;

    async function registerServiceWorker() {
      try {
        if (!("serviceWorker" in navigator)) {
          console.error("Service Worker not supported in this browser");
          return;
        }

        // Unregister any existing service workers first
        const existingRegistrations =
          await navigator.serviceWorker.getRegistrations();
        console.log(
          "Found existing service workers:",
          existingRegistrations.length
        );

        for (const reg of existingRegistrations) {
          console.log("Unregistering existing service worker:", {
            scope: reg.scope,
            state: reg.active?.state,
          });
          await reg.unregister();
        }

        // Register new service worker
        console.log("Registering new service worker...");
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        console.log("New service worker registered:", {
          scope: registration.scope,
          state: registration.active?.state,
          scriptURL: registration.active?.scriptURL,
        });

        // Ensure registration is available before proceeding
        if (!registration) {
          throw new Error("Failed to obtain service worker registration");
        }

        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;
        console.log("Service Worker is ready:", {
          scope: registration.scope,
          state: registration.active?.state,
          scriptURL: registration.active?.scriptURL,
        });

        // Set up push notifications if supported
        if (
          "PushManager" in window &&
          "Notification" in window &&
          session?.user?.email
        ) {
          try {
            const permission = await Notification.requestPermission();
            console.log("Notification permission status:", permission);

            if (permission === "granted") {
              // Get existing subscription first
              let subscription =
                await registration.pushManager.getSubscription();

              if (subscription) {
                // Validate existing subscription
                try {
                  const validateResponse = await fetch("/api/push/validate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ endpoint: subscription.endpoint }),
                  });

                  if (!validateResponse.ok) {
                    console.log(
                      "Existing subscription is invalid, will create new one"
                    );
                    await subscription.unsubscribe();
                    subscription = null;
                  } else {
                    console.log("Using existing valid subscription");
                  }
                } catch (error) {
                  console.error("Error validating subscription:", error);
                  subscription = null;
                }
              }

              if (!subscription) {
                // Get VAPID key and create new subscription
                const response = await fetch("/api/push/vapid-public-key");
                if (!response.ok) throw new Error("Failed to fetch VAPID key");

                const vapidPublicKey = await response.text();
                const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

                subscription = await registration.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: convertedVapidKey,
                });

                // Register new subscription with server
                const registerResponse = await fetch("/api/push/register", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    subscription,
                    userEmail: session.user.email,
                  }),
                });

                if (!registerResponse.ok) {
                  throw new Error(
                    "Failed to register subscription with server"
                  );
                }

                console.log("New push subscription registered successfully");
              }
            }
          } catch (error) {
            console.error("Error setting up push notifications:", error);
          }
        }

        // Handle service worker updates
        const currentRegistration = registration;
        currentRegistration.addEventListener("updatefound", () => {
          const newWorker = currentRegistration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              console.log("Service Worker state changed:", newWorker.state);
              if (newWorker.state === "activated") {
                console.log("New service worker activated");
              }
            });
          }
        });

        // Check for updates periodically
        const updateInterval = setInterval(() => {
          if (currentRegistration) {
            currentRegistration.update().catch(console.error);
          }
        }, 60 * 60 * 1000); // Check every hour

        return () => {
          clearInterval(updateInterval);
        };
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    }

    registerServiceWorker();
  }, [session, status]); // Add status to dependencies

  return <>{children}</>;
}
