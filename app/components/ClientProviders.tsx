"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

// Add TSS type definition at the top of the file
interface TSSState {
  state?: {
    excluded?: boolean;
  };
}

interface WindowWithTSS extends Window {
  TSS?: TSSState;
}

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
    let updateInterval: NodeJS.Timeout | null = null;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const TSS_WAIT_TIME = 5000; // Wait 5 seconds for TSS to initialize

    async function registerServiceWorker() {
      try {
        // Double check session data
        if (!session?.user?.email) {
          console.log(
            "No session data available, skipping service worker registration"
          );
          return;
        }

        console.log("Starting service worker registration:", {
          email: session.user.email,
          timestamp: new Date().toISOString(),
          status,
          retryCount,
        });

        if (!("serviceWorker" in navigator)) {
          console.error("Service Worker not supported in this browser");
          return;
        }

        // Wait for TSS initialization to complete
        console.log("Waiting for TSS initialization...");
        await new Promise((resolve) => setTimeout(resolve, TSS_WAIT_TIME));

        // Check if we're in an excluded state
        const tssState = (window as WindowWithTSS).TSS?.state;
        if (tssState?.excluded) {
          console.log(
            "TSS exclusion detected, skipping service worker registration"
          );
          return;
        }

        // Unregister any existing service workers
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

        // Wait for any in-progress TSS operations
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Register new service worker with classic type for better compatibility
        console.log("Registering new service worker...");
        const readyRegistration = await navigator.serviceWorker.register(
          "/sw.js",
          {
            scope: "/",
            type: "classic",
          }
        );

        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;
        console.log("Service worker is ready:", {
          scope: readyRegistration.scope,
          state: readyRegistration.active?.state,
          scriptURL: readyRegistration.active?.scriptURL,
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
                await readyRegistration.pushManager.getSubscription();
              console.log("Existing push subscription:", {
                exists: !!subscription,
                endpoint: subscription?.endpoint,
                timestamp: new Date().toISOString(),
              });

              if (!subscription) {
                // Get VAPID key and create new subscription
                console.log("Fetching VAPID key...");
                const response = await fetch("/api/push/vapid-public-key");
                if (!response.ok) throw new Error("Failed to fetch VAPID key");

                const vapidPublicKey = await response.text();
                const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

                console.log("Creating new push subscription...");
                subscription = await readyRegistration.pushManager.subscribe({
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

                console.log("Push subscription registered successfully");
              }
            }
          } catch (error) {
            console.error("Error setting up push notifications:", error);
          }
        }

        // Set up periodic update checks
        updateInterval = setInterval(() => {
          if (readyRegistration && document.visibilityState === "visible") {
            console.log("Checking for service worker updates...");
            readyRegistration.update().catch(console.error);
          }
        }, 60 * 60 * 1000); // Check every hour
      } catch (error) {
        console.error("Service Worker registration failed:", error);

        // Retry logic with exponential backoff
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
          console.log(
            `Retrying service worker registration in ${delay}ms (attempt ${retryCount}/${MAX_RETRIES})...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          await registerServiceWorker();
        }
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
