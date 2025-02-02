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

// IndexedDB helper functions
async function openLogsDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("NotificationLogs", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("logs")) {
        db.createObjectStore("logs", { keyPath: "id" });
      }
    };
  });
}

async function getRecentLogs(): Promise<NotificationLog[]> {
  try {
    const db = await openLogsDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("logs", "readonly");
      const store = transaction.objectStore("logs");
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const logs = request.result as NotificationLog[];
        resolve(logs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10));
      };
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return [];
  }
}

export default function NotificationDebug() {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const [isIOS, setIsIOS] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [recentLogs, setRecentLogs] = useState<NotificationLog[]>([]);

  useEffect(() => {
    // Check platform
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    const isStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;
    const isSafariStandalone =
      "standalone" in window.navigator &&
      (window.navigator as SafariNavigator).standalone === true;
    setIsPWA(isStandalone || isSafariStandalone);

    const debugSteps: string[] = [];

    // Check notification support
    if (!("Notification" in window)) {
      debugSteps.push("❌ Notifications API not supported in this browser");
    } else {
      debugSteps.push("✅ Notifications API is supported");
    }

    // Check service worker support
    if (!("serviceWorker" in navigator)) {
      debugSteps.push("❌ Service Workers not supported");
    } else {
      debugSteps.push("✅ Service Workers are supported");
    }

    // Check push API support
    if (!("PushManager" in window)) {
      debugSteps.push("❌ Push API not supported");
    } else {
      debugSteps.push("✅ Push API is supported");
    }

    // iOS specific checks
    if (isIOSDevice) {
      debugSteps.push("📱 iOS device detected");
      if (!isPWA) {
        debugSteps.push(
          "❌ Not running as PWA - Add to Home Screen required for notifications"
        );
      } else {
        debugSteps.push("✅ Running as PWA");
      }
    }

    // Check notification permission
    if ("Notification" in window) {
      setPermission(Notification.permission);
      debugSteps.push(
        `🔔 Notification permission status: ${Notification.permission}`
      );
    }

    // Get push subscription
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then(async (registration) => {
          try {
            const sub = await registration.pushManager.getSubscription();
            setSubscription(sub);
            if (sub) {
              debugSteps.push("✅ Push subscription active");
            } else {
              debugSteps.push("❌ No active push subscription");
            }
          } catch (error) {
            debugSteps.push(`❌ Error getting push subscription: ${error}`);
          }
        })
        .catch((error) => {
          debugSteps.push(`❌ Service Worker registration error: ${error}`);
        });
    }

    setDebugInfo(debugSteps);
  }, []);

  // Fetch logs on mount and periodically
  useEffect(() => {
    const fetchLogs = async () => {
      const logs = await getRecentLogs();
      setRecentLogs(logs);
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support notifications");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      window.location.reload(); // Reload to update all states
    } catch (error) {
      console.error("Error requesting permission:", error);
    }
  };

  const subscribeToNotifications = async () => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        alert("Push notifications are not supported");
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      // Get the server's public key
      const response = await fetch("/api/push/vapidkey");
      const { publicKey } = await response.json();

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      });

      // Send the subscription to your server
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: subscription,
        }),
      });

      // Update state
      setSubscription(subscription);
      window.location.reload(); // Reload to update all states
    } catch (error: any) {
      console.error("Error subscribing to notifications:", error);
      alert(
        "Error subscribing to notifications: " +
          (error.message || "Unknown error")
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
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

        {/* Debug Steps */}
        <section className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Troubleshooting Steps</h2>
          <div className="space-y-2">
            {debugInfo.map((step, index) => (
              <div key={index} className="font-mono text-sm">
                {step}
              </div>
            ))}
          </div>
        </section>

        {/* Notification Status */}
        <section className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Notification Status</h2>
          <div className="space-y-4">
            <div>
              <p className="font-medium">Permission: {permission}</p>
              {permission !== "granted" && (
                <button
                  onClick={requestPermission}
                  className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                >
                  Request Permission
                </button>
              )}
              {permission === "granted" && !subscription && (
                <button
                  onClick={subscribeToNotifications}
                  className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                >
                  Subscribe to Notifications
                </button>
              )}
            </div>
            <div>
              <p className="font-medium">Subscription Status:</p>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-sm">
                {subscription
                  ? JSON.stringify(subscription, null, 2)
                  : "No active subscription"}
              </pre>
            </div>
          </div>
        </section>

        {/* iOS Instructions */}
        {isIOS && !isPWA && (
          <section className="border-2 border-yellow-500 rounded-lg p-4 bg-yellow-50">
            <h2 className="text-lg font-semibold mb-2">iOS Setup Required</h2>
            <div className="space-y-2">
              <p>To enable push notifications on iOS:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Tap the share button in Safari</li>
                <li>Select &quot;Add to Home Screen&quot;</li>
                <li>Open the app from your home screen</li>
                <li>Return to this page and request notification permission</li>
              </ol>
            </div>
          </section>
        )}

        {/* Notification Logs */}
        <section className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Recent Notifications</h2>
          <div className="space-y-2">
            {recentLogs.length === 0 ? (
              <p className="text-gray-500">No notification logs found</p>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="p-2 bg-gray-50 rounded">
                  <p className="font-medium">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                  <p>Status: {log.status}</p>
                  {log.error && (
                    <p className="text-red-500">Error: {log.error}</p>
                  )}
                  <pre className="mt-1 text-sm">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
