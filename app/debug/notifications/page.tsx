"use client";

import { useEffect, useState } from "react";

interface PushData {
  message?: string;
  body?: string;
  id?: string;
  url?: string;
  timestamp?: number;
}

interface NotificationLog {
  id: string;
  timestamp: number;
  data: PushData;
  status: string;
  error?: string;
  platform: string;
}

// Type for Safari/iOS specific navigator
interface SafariNavigator extends Navigator {
  standalone?: boolean;
}

export default function NotificationDebug() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const [isIOS, setIsIOS] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Ensure we're running in the browser
    if (typeof window === "undefined") return;

    // Check platform
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));

    // Check if running as PWA
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;
    const isSafariStandalone =
      "standalone" in window.navigator &&
      (window.navigator as SafariNavigator).standalone === true;
    setIsPWA(isStandalone || isSafariStandalone);

    // Check notification permission
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    // Get push subscription
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(async (registration) => {
        const sub = await registration.pushManager.getSubscription();
        setSubscription(sub);
      });
    }

    // Get notification logs from IndexedDB
    const loadLogs = async () => {
      try {
        const db = await openDatabase();
        const allLogs = await getAllNotifications(db);
        setLogs(allLogs.sort((a, b) => b.timestamp - a.timestamp));
      } catch (err) {
        console.error("Error loading notification logs:", err);
      }
    };

    loadLogs();
    // Set up polling to refresh logs
    const interval = setInterval(loadLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  // Early return while on server
  if (typeof window === "undefined") {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Push Notification Debug</h1>

      <div className="space-y-6">
        {/* Device Info */}
        <section className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Device Information</h2>
          <dl className="grid grid-cols-2 gap-2">
            <dt>Platform:</dt>
            <dd>{navigator.platform}</dd>
            <dt>User Agent:</dt>
            <dd className="break-all">{navigator.userAgent}</dd>
            <dt>iOS Device:</dt>
            <dd>{isIOS ? "Yes" : "No"}</dd>
            <dt>Running as PWA:</dt>
            <dd>{isPWA ? "Yes" : "No"}</dd>
          </dl>
        </section>

        {/* Notification Status */}
        <section className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Notification Status</h2>
          <dl className="grid grid-cols-2 gap-2">
            <dt>Permission:</dt>
            <dd>{permission}</dd>
            <dt>Service Worker:</dt>
            <dd>
              {"serviceWorker" in navigator ? "Supported" : "Not Supported"}
            </dd>
            <dt>Push Manager:</dt>
            <dd>{"PushManager" in window ? "Supported" : "Not Supported"}</dd>
            <dt>Push Subscription:</dt>
            <dd>{subscription ? "Active" : "None"}</dd>
          </dl>
        </section>

        {/* Notification Logs */}
        <section className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Notification History</h2>
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="border-b pb-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <dt>Time:</dt>
                  <dd>{new Date(log.timestamp).toLocaleString()}</dd>
                  <dt>Status:</dt>
                  <dd
                    className={
                      log.status === "failed"
                        ? "text-red-500"
                        : "text-green-500"
                    }
                  >
                    {log.status}
                  </dd>
                  <dt>Platform:</dt>
                  <dd>{log.platform}</dd>
                  {log.error && (
                    <>
                      <dt>Error:</dt>
                      <dd className="text-red-500">{log.error}</dd>
                    </>
                  )}
                  <dt>Data:</dt>
                  <dd className="break-all">{JSON.stringify(log.data)}</dd>
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-gray-500">No notifications recorded yet</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// IndexedDB helpers
async function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("PushNotificationDebug", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function getAllNotifications(
  db: IDBDatabase
): Promise<NotificationLog[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("notifications", "readonly");
    const store = transaction.objectStore("notifications");
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}
