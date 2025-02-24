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

        console.log("Starting service worker registration:", {
          isIOS,
          isPWA,
          userAgent: navigator.userAgent,
          email: session.user.email,
          timestamp: new Date().toISOString(),
        });

        // Always unregister existing service workers first
        const existingRegistrations =
          await navigator.serviceWorker.getRegistrations();
        for (const reg of existingRegistrations) {
          console.log("Unregistering existing service worker:", {
            scope: reg.scope,
            state: reg.active?.state,
            timestamp: new Date().toISOString(),
          });
          await reg.unregister();
        }

        // Wait a moment before registering new service worker
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Register new service worker
        console.log("Registering new service worker...");
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;
        console.log("Service worker is ready:", {
          scope: registration.scope,
          state: registration.active?.state,
          scriptURL: registration.active?.scriptURL,
          timestamp: new Date().toISOString(),
        });

        // Set up push notifications if supported
        if ("PushManager" in window && "Notification" in window) {
          try {
            // Check if we already have permission
            let permission = Notification.permission;
            if (permission === "default") {
              console.log("Requesting notification permission...");
              permission = await Notification.requestPermission();
            }
            console.log("Notification permission status:", permission);

            if (permission === "granted") {
              // Get existing subscription first
              let subscription =
                await registration.pushManager.getSubscription();
              console.log("Existing push subscription:", {
                exists: !!subscription,
                endpoint: subscription?.endpoint,
                timestamp: new Date().toISOString(),
              });

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
                console.log("Fetching VAPID key...");
                const response = await fetch("/api/push/vapid-public-key");
                if (!response.ok) throw new Error("Failed to fetch VAPID key");

                const vapidPublicKey = await response.text();
                const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

                console.log("Creating new push subscription...");
                subscription = await registration.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: convertedVapidKey,
                });

                // Register new subscription with server
                console.log("Registering subscription with server...");
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

                console.log("Push subscription registered successfully:", {
                  endpoint: subscription.endpoint,
                  timestamp: new Date().toISOString(),
                });
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
                console.log("Service Worker state changed:", {
                  state: newWorker.state,
                  timestamp: new Date().toISOString(),
                });
              });
            }
          });

          // Set up periodic update checks
          updateInterval = setInterval(() => {
            if (currentReg && document.visibilityState === "visible") {
              console.log("Checking for service worker updates...");
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
