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

        // First, unregister any existing service workers
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log("Unregistered old service worker");
        }

        // Register the new service worker
        console.log("Registering service worker...");
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        console.log(
          "Service Worker registration successful with scope:",
          registration.scope
        );

        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;
        console.log("Service Worker is ready");
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
