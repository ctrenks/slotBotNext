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
  const [isMacSafari, setIsMacSafari] = useState(false);

  useEffect(() => {
    // Check platform
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafariOnMac =
      /^((?!chrome|android).)*safari/i.test(navigator.userAgent) &&
      /Mac/.test(navigator.platform);
    setIsIOS(isIOSDevice);
    setIsMacSafari(isSafariOnMac);

    // Multiple checks for PWA mode
    const displayMode = window.matchMedia("(display-mode: standalone)").matches;
    const safariStandalone =
      "standalone" in window.navigator &&
      (window.navigator as SafariNavigator).standalone === true;
    const isPWAMode = displayMode || safariStandalone;
    setIsPWA(isPWAMode);

    async function checkServiceWorker() {
      const debugSteps: string[] = [];

      // Browser compatibility check
      if (isMacSafari) {
        debugSteps.push(
          "❌ Safari on macOS does not support web push notifications"
        );
        debugSteps.push("ℹ️ Please use Chrome, Firefox, or Edge on macOS");
      }

      // Check notification support
      if (!("Notification" in window)) {
        debugSteps.push("❌ Notifications API not supported in this browser");
      } else {
        debugSteps.push("✅ Notifications API is supported");
      }

      // Check service worker support and registration
      if (!("serviceWorker" in navigator)) {
        debugSteps.push("❌ Service Workers not supported");
      } else {
        debugSteps.push("✅ Service Workers are supported");
        try {
          // Unregister any existing service workers
          const existingRegistrations =
            await navigator.serviceWorker.getRegistrations();
          for (const reg of existingRegistrations) {
            await reg.unregister();
            debugSteps.push("ℹ️ Unregistered existing service worker");
          }

          // Register new service worker
          debugSteps.push("ℹ️ Registering new service worker...");
          const registration = await navigator.serviceWorker.register(
            "/sw.js",
            {
              scope: "/",
            }
          );
          debugSteps.push(
            `✅ Service Worker registered with scope: ${registration.scope}`
          );

          // Wait for the service worker to be activated
          if (registration.active) {
            debugSteps.push("✅ Service Worker is already active");
          } else {
            debugSteps.push("ℹ️ Waiting for Service Worker to activate...");
            await new Promise<void>((resolve) => {
              registration.addEventListener("activate", () => {
                debugSteps.push("✅ Service Worker activated");
                resolve();
              });
            });
          }

          // Check for existing push subscription
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            debugSteps.push("✅ Found existing push subscription");
            setSubscription(subscription);
          } else {
            debugSteps.push("ℹ️ No existing push subscription found");
          }
        } catch (error) {
          debugSteps.push(`❌ Service Worker error: ${error}`);
        }
      }

      // Check push API support
      if (!("PushManager" in window)) {
        debugSteps.push("❌ Push API not supported in this browser");
        if (isMacSafari) {
          debugSteps.push(
            "ℹ️ Consider using Chrome, Firefox, or Edge for push notifications"
          );
        }
      } else {
        debugSteps.push("✅ Push API is supported");
      }

      setDebugInfo(debugSteps);
    }

    checkServiceWorker();
  }, [isMacSafari]);

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
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error requesting permission:", error.message);
      } else {
        console.error("Unknown error requesting permission");
      }
    }
  };

  const subscribeToNotifications = async () => {
    console.log("Subscribe button clicked");
    try {
      if (!("serviceWorker" in navigator)) {
        throw new Error("Service Worker not supported");
      }

      if (!("PushManager" in window)) {
        throw new Error("Push API not supported");
      }

      // Wait for service worker to be ready
      console.log("Waiting for service worker to be ready...");
      const registration = await navigator.serviceWorker.ready;
      console.log("Service worker is ready:", registration);

      // Get the server's public key
      console.log("Fetching VAPID key...");
      const response = await fetch("/api/push/vapid-public-key");
      if (!response.ok) {
        throw new Error(
          `Failed to fetch VAPID key: ${response.status} ${response.statusText}`
        );
      }
      const vapidPublicKey = await response.text();
      console.log("Got VAPID key:", vapidPublicKey);

      // Convert VAPID key to Uint8Array
      console.log("Converting VAPID key...");
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push notifications
      console.log("Subscribing to push notifications...");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });
      console.log("Push subscription created:", subscription);

      // Get user email from session
      const sessionResponse = await fetch("/api/auth/session");
      const session = await sessionResponse.json();
      const userEmail = session?.user?.email;

      if (!userEmail) {
        throw new Error("User email not found in session");
      }

      // Send the subscription to your server
      console.log("Sending subscription to server...");
      const serverResponse = await fetch("/api/push/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscription, userEmail }),
      });

      if (!serverResponse.ok) {
        const errorText = await serverResponse.text();
        throw new Error(
          `Failed to send subscription to server: ${serverResponse.status} ${errorText}`
        );
      }

      console.log("Subscription sent to server successfully");
      setSubscription(subscription);
      setDebugInfo((prev) => [
        ...prev,
        "✅ Successfully subscribed to push notifications",
      ]);
    } catch (error) {
      console.error("Error in subscription process:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setDebugInfo((prev) => [...prev, `❌ Error: ${errorMessage}`]);
      alert(`Error subscribing to notifications: ${errorMessage}`);
    }
  };

  // Helper function to convert VAPID key
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

  const refreshStatus = async () => {
    window.location.reload();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Push Notification Debug</h1>
        <button
          onClick={refreshStatus}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Refresh Status
        </button>
      </div>

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
                  onClick={() => {
                    console.log("Subscribe button clicked in UI");
                    subscribeToNotifications();
                  }}
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
