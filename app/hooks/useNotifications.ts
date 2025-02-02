import { useState, useEffect, useCallback } from "react";

interface UseNotificationsReturn {
  permission: NotificationPermission;
  isSupported: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  registerPushSubscription: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      throw new Error("Notifications not supported");
    }

    // Check if we already have permission to prevent unnecessary prompts
    if (permission === "granted") {
      return permission;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      throw error;
    }
  }, [isSupported, permission]);

  const registerPushSubscription = useCallback(async () => {
    if (!isSupported || permission !== "granted") {
      return;
    }

    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Push notifications not supported");
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        const response = await fetch("/api/push/vapid-public-key");
        if (!response.ok) {
          throw new Error("Failed to fetch VAPID key");
        }
        const vapidPublicKey = await response.text();

        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });

        await fetch("/api/push/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ subscription }),
        });
      }
    } catch (error) {
      console.error("Error registering push subscription:", error);
      throw error;
    }
  }, [isSupported, permission]);

  return {
    permission,
    isSupported,
    requestPermission,
    registerPushSubscription,
  };
}

// Helper function for VAPID key conversion
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
