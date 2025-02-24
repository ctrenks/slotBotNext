"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import AlertDisplay from "./AlertDisplay";
import { Session } from "next-auth";
import { AlertWithRead } from "@/app/types/alert";

// Add type definitions for extended Window interfaces
interface WindowWithMSStream extends Window {
  MSStream?: boolean;
}

interface WindowWithStandalone extends Navigator {
  standalone?: boolean;
}

// Helper function for VAPID key conversion
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

// Platform detection
function detectPlatform() {
  if (typeof window === "undefined") return { isIOS: false, isPWA: false };

  const isIOS =
    /iPad|iPhone|iPod/.test(window.navigator.userAgent) &&
    !(window as WindowWithMSStream).MSStream;
  const isPWA =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as WindowWithStandalone).standalone === true;

  return { isIOS, isPWA };
}

// IndexedDB setup
async function openAlertsDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("AlertsDB", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("shownAlerts")) {
        const store = db.createObjectStore("shownAlerts", { keyPath: "id" });
        store.createIndex("timestamp", "timestamp");
      }
    };
  });
}

async function hasAlertBeenShown(alertId: string): Promise<boolean> {
  try {
    const db = await openAlertsDB();
    return new Promise((resolve) => {
      const tx = db.transaction("shownAlerts", "readonly");
      const store = tx.objectStore("shownAlerts");
      const request = store.get(alertId);
      request.onsuccess = () => resolve(!!request.result);
    });
  } catch (error) {
    console.error("Error checking alert status:", error);
    return false;
  }
}

async function markAlertAsShown(alertId: string) {
  try {
    const db = await openAlertsDB();
    const tx = db.transaction("shownAlerts", "readwrite");
    const store = tx.objectStore("shownAlerts");
    await store.put({
      id: alertId,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error marking alert as shown:", error);
  }
}

async function cleanupOldRecords() {
  try {
    const db = await openAlertsDB();
    const tx = db.transaction("shownAlerts", "readwrite");
    const store = tx.objectStore("shownAlerts");
    const index = store.index("timestamp");

    const request = index.getAllKeys();
    request.onsuccess = () => {
      const keys = request.result as IDBValidKey[];
      if (keys.length > 100) {
        keys
          .sort((a, b) => Number(b) - Number(a))
          .slice(100)
          .forEach((key) => store.delete(key));
      }
    };
  } catch (error) {
    console.error("Error cleaning up old records:", error);
  }
}

export default function GlobalAlertDisplay() {
  const { data: session, status } = useSession() as {
    data: Session | null;
    status: "loading" | "authenticated" | "unauthenticated";
  };
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AlertWithRead[]>([]);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");
  const [platform] = useState(detectPlatform());

  // Check notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // iOS PWA service worker registration
  const registerServiceWorker = useCallback(async () => {
    if (platform.isIOS && platform.isPWA && "serviceWorker" in navigator) {
      try {
        console.log("Registering service worker for iOS PWA...");
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          type: "classic",
        });

        // Set up push subscription if we have permission
        if (notificationPermission === "granted" && session?.user?.email) {
          let subscription = await registration.pushManager.getSubscription();

          if (!subscription) {
            const response = await fetch("/api/push/vapid-public-key");
            if (!response.ok) throw new Error("Failed to fetch VAPID key");

            const vapidPublicKey = await response.text();
            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: convertedVapidKey,
            });

            await fetch("/api/push/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                subscription,
                userEmail: session.user.email,
              }),
            });
          }
        }
      } catch (error) {
        console.error("Failed to register service worker:", error);
      }
    }
  }, [
    platform.isIOS,
    platform.isPWA,
    notificationPermission,
    session?.user?.email,
  ]);

  // Register service worker for iOS PWA
  useEffect(() => {
    if (platform.isIOS && platform.isPWA) {
      registerServiceWorker();

      // Re-register when page becomes visible
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          registerServiceWorker();
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      };
    }
  }, [platform.isIOS, platform.isPWA, registerServiceWorker]);

  // Handle new alerts and show notifications
  const handleNewAlerts = useCallback(
    async (newAlerts: AlertWithRead[]) => {
      const hasChanges =
        newAlerts.length !== alerts.length ||
        newAlerts.some((newAlert, index) => {
          const existingAlert = alerts[index];
          return !existingAlert || newAlert.id !== existingAlert.id;
        });

      if (hasChanges) {
        console.log("New alerts detected:", {
          oldCount: alerts.length,
          newCount: newAlerts.length,
          platform: platform,
        });

        // Find truly new alerts (not just updates)
        const brandNewAlerts = newAlerts.filter(
          (newAlert) =>
            !alerts.some((existingAlert) => existingAlert.id === newAlert.id)
        );

        // Show notifications for new alerts (desktop only)
        if (
          brandNewAlerts.length > 0 &&
          notificationPermission === "granted" &&
          !platform.isIOS
        ) {
          // Skip for iOS as it uses service worker
          for (const alert of brandNewAlerts) {
            try {
              const alreadyShown = await hasAlertBeenShown(alert.id);
              if (!alreadyShown) {
                const notification = new Notification(
                  alert.casinoName || "New Alert",
                  {
                    body: alert.message,
                    icon: alert.casinoImage
                      ? `/image/casino/${alert.casinoImage}`
                      : "/img/defaultuser.png",
                    badge: "/img/defaultuser.png",
                    tag: alert.id,
                    data: {
                      url: "/slotbot",
                      alertId: alert.id,
                      timestamp: Date.now(),
                    },
                  }
                );

                notification.onclick = function () {
                  window.focus();
                  window.location.href = "/slotbot";
                };

                await markAlertAsShown(alert.id);
              }
            } catch (error) {
              console.error("Error showing notification:", error);
            }
          }

          // Cleanup old records periodically
          await cleanupOldRecords();
        }

        setAlerts(newAlerts);
      }
    },
    [alerts, notificationPermission, platform]
  );

  // Alert polling effect
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        if (!session?.user?.email) {
          console.log("No session data available yet", {
            status,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        const response = await fetch("/api/alerts/check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch alerts: ${response.status}`);
        }

        const alerts = await response.json();
        await handleNewAlerts(alerts);
        setAlerts(alerts);
        setError(null);
      } catch (error) {
        console.error("Error fetching alerts:", error);
        setError(
          error instanceof Error ? error.message : "Unknown error occurred"
        );
      }
    };

    // Initial fetch
    fetchAlerts();

    // Set up polling interval
    const pollInterval = setInterval(fetchAlerts, 30000);

    // Cleanup
    return () => clearInterval(pollInterval);
  }, [session, status, handleNewAlerts]);

  // Don't block rendering on session loading
  if (status === "loading" && !session?.user) {
    return (
      <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-8 p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Allow rendering if we have session data
  const userData = session?.user;
  if (!userData) {
    return null;
  }

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-8">
      {error ? (
        <div className="p-4 text-red-500">{error}</div>
      ) : (
        <AlertDisplay initialAlerts={alerts} />
      )}
    </div>
  );
}
