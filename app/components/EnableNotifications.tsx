"use client";

import { useState, useEffect } from "react";
import { useNotifications } from "@/app/hooks/useNotifications";

interface EnableNotificationsProps {
  variant?: "button" | "banner";
}

interface DebugLog {
  timestamp: Date;
  message: string;
  type: "info" | "error" | "success";
}

export default function EnableNotifications({
  variant = "button",
}: EnableNotificationsProps) {
  const [mounted, setMounted] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  const {
    permission,
    isSupported,
    requestPermission,
    registerPushSubscription,
  } = useNotifications();

  const addDebugLog = (
    message: string,
    type: "info" | "error" | "success" = "info"
  ) => {
    console.log(`[${type}] ${message}`);
    setDebugLogs((prev) => [...prev, { timestamp: new Date(), message, type }]);
  };

  useEffect(() => {
    setMounted(true);
    // Check if device is iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);
    addDebugLog(`Device detection: ${isIOSDevice ? "iOS" : "Not iOS"}`, "info");

    // Check if running as PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator &&
        (window.navigator as { standalone?: boolean }).standalone) ||
      document.referrer.includes("ios-app://");
    setIsPWA(isStandalone);
    addDebugLog(`PWA detection: ${isStandalone ? "PWA" : "Browser"}`, "info");

    if (isSupported) {
      addDebugLog(`Current notification permission: ${permission}`, "info");
    } else {
      addDebugLog("Notifications not supported in this environment", "error");
    }

    // Check service worker support
    if ("serviceWorker" in navigator) {
      addDebugLog("Service Worker supported", "success");
    } else {
      addDebugLog("Service Worker not supported", "error");
    }

    // Check Push API support
    if ("PushManager" in window) {
      addDebugLog("Push API supported", "success");
    } else {
      addDebugLog("Push API not supported", "error");
    }
  }, [isSupported, permission]);

  const handleEnableNotifications = async () => {
    try {
      const result = await requestPermission();
      if (result === "granted") {
        await registerPushSubscription();
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to enable notifications"
      );
    }
  };

  // Don't render anything on the server side or if not mounted
  if (!mounted) {
    return null;
  }

  // Show iOS-specific instructions when not in PWA mode
  if (isIOS && !isPWA) {
    if (variant === "banner") {
      return (
        <>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <div className="w-full bg-black/90 p-4 rounded-lg shadow-lg mb-4">
            <div className="flex items-start space-x-3">
              <svg
                className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-emerald-500 mb-2">
                  Enable SlotBot Alerts on iOS
                </h3>
                <ol className="text-white space-y-1 list-decimal ml-4">
                  <li>Tap the share button in your browser</li>
                  <li>Select &quot;Add to Home Screen&quot;</li>
                  <li>Open SlotBot from your home screen to receive alerts</li>
                </ol>
              </div>
            </div>
          </div>
          {showDebug && (
            <div className="fixed bottom-0 left-0 right-0 bg-black/95 text-white p-4 max-h-[50vh] overflow-auto">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Debug Logs</h3>
                <button
                  onClick={() => setDebugLogs([])}
                  className="px-2 py-1 bg-gray-700 rounded text-sm"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1 text-sm font-mono">
                {debugLogs.map((log, i) => (
                  <div
                    key={i}
                    className={`${
                      log.type === "error"
                        ? "text-red-400"
                        : log.type === "success"
                        ? "text-green-400"
                        : "text-gray-300"
                    }`}
                  >
                    [{log.timestamp.toLocaleTimeString()}] {log.message}
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="fixed bottom-4 right-4 bg-black/80 text-white px-3 py-1 rounded-full text-sm"
          >
            {showDebug ? "Hide Debug" : "Show Debug"}
          </button>
        </>
      );
    }
    return (
      <button className="flex items-center text-white hover:text-emerald-500 transition-colors">
        <svg
          className="w-5 h-5 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        Enable Alerts
      </button>
    );
  }

  // Only show button if notifications are supported and not already granted
  if (!isSupported || permission === "granted") {
    return null;
  }

  if (variant === "banner") {
    return (
      <div className="w-full bg-black/90 p-4 rounded-lg shadow-lg mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg
              className="w-6 h-6 text-emerald-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-emerald-500">
                Enable SlotBot Alerts
              </h3>
              <p className="text-white text-sm">
                Get instant notifications when slots are hot!
              </p>
            </div>
          </div>
          <button
            onClick={handleEnableNotifications}
            className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
          >
            Enable Alerts
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleEnableNotifications}
        className="flex items-center text-white hover:text-emerald-500 transition-colors"
      >
        <svg
          className="w-5 h-5 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        Enable Alerts
      </button>
      {showDebug && (
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="fixed bottom-4 right-4 bg-black/80 text-white px-3 py-1 rounded-full text-sm"
        >
          {showDebug ? "Hide Debug" : "Show Debug"}
        </button>
      )}
    </>
  );
}
