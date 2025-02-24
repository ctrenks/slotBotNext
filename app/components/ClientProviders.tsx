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
    let registration: ServiceWorkerRegistration | null = null;
    let updateInterval: NodeJS.Timeout | null = null;

    async function registerServiceWorker() {
      try {
        // Double check session data
        if (!session?.user?.email) {
          console.log(
            "No session data available, skipping service worker registration"
          );
          return;
        }

        if (!("serviceWorker" in navigator)) {
          console.error("Service Worker not supported in this browser");
          return;
        }

        // Check if we're on iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        interface SafariNavigator extends Navigator {
          standalone?: boolean;
        }
        const isPWA =
          window.matchMedia("(display-mode: standalone)").matches ||
          (navigator as SafariNavigator).standalone === true;

        console.log("Platform detection:", {
          isIOS,
          isPWA,
          userAgent: navigator.userAgent,
        });

        // Always unregister existing service workers first
        const existingRegistrations =
          await navigator.serviceWorker.getRegistrations();
        for (const reg of existingRegistrations) {
          console.log("Unregistering existing service worker:", {
            scope: reg.scope,
            state: reg.active?.state,
          });
          await reg.unregister();
        }

        // Register new service worker with specific options for iOS
        console.log("Registering new service worker...");
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
          type: isIOS ? "classic" : "module",
        });

        console.log("Service worker registered:", {
          scope: registration.scope,
          state: registration.active?.state,
          scriptURL: registration.active?.scriptURL,
          isIOS,
          isPWA,
        });

        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;

        // Set up push notifications if supported
        if ("PushManager" in window && "Notification" in window) {
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
                    body: JSON.stringify({
                      endpoint: subscription.endpoint,
                      userEmail: session.user.email,
                    }),
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
        const currentReg = registration;
        if (currentReg) {
          currentReg.addEventListener("updatefound", () => {
            const newWorker = currentReg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                console.log("Service Worker state changed:", newWorker.state);
              });
            }
          });

          // Set up periodic update checks
          updateInterval = setInterval(() => {
            if (currentReg && document.visibilityState === "visible") {
              currentReg.update().catch(console.error);
            }
          }, 60 * 60 * 1000); // Check every hour
        }
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    }

    // Only register service worker if we have a valid session
    if (status === "authenticated" && session?.user?.email) {
      registerServiceWorker();
    }

    // Cleanup function
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, [session, status]);

  return <>{children}</>;
}
