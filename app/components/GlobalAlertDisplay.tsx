"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import AlertDisplay from "./AlertDisplay";
import { Session } from "next-auth";
import { AlertWithRead } from "@/app/types/alert";

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

  // Check notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

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
        });

        // Find truly new alerts (not just updates)
        const brandNewAlerts = newAlerts.filter(
          (newAlert) =>
            !alerts.some((existingAlert) => existingAlert.id === newAlert.id)
        );

        // Show notifications for new alerts
        if (brandNewAlerts.length > 0 && notificationPermission === "granted") {
          for (const alert of brandNewAlerts) {
            try {
              // Check if we've already shown this alert
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
    [alerts, notificationPermission]
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
