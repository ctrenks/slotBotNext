"use client";

import { useState, useEffect } from "react";

interface EnableNotificationsProps {
  variant?: "button" | "banner";
}

export default function EnableNotifications({
  variant = "button",
}: EnableNotificationsProps) {
  const [mounted, setMounted] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if device is iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
  };

  // Don't render anything on the server side or if not mounted
  if (!mounted) {
    return null;
  }

  // Show iOS-specific instructions
  if (isIOS) {
    if (variant === "banner") {
      return (
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
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    permission === "granted"
  ) {
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
            onClick={requestPermission}
            className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
          >
            Enable Alerts
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={requestPermission}
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
  );
}
