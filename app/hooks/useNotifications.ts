import { useState, useEffect, useCallback } from "react";

interface UseNotificationsReturn {
  permission: NotificationPermission;
  isSupported: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  registerPushSubscription: () => Promise<void>;
}

// Keep track of permission request state globally
let permissionRequested = false;

// Maximum number of retry attempts
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

export function useNotifications(): UseNotificationsReturn {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if notifications are supported
      const notificationsSupported = "Notification" in window;
      setIsSupported(notificationsSupported);
      if (notificationsSupported) {
        setPermission(Notification.permission);
      }

      // Check if device is iOS
      const isIOSDevice =
        /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(window as any).MSStream;
      setIsIOS(isIOSDevice);

      // Check if running as PWA
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as { standalone?: boolean }).standalone === true ||
        document.referrer.includes("ios-app://");
      setIsPWA(isStandalone);
    }
  }, []);

  const validateSubscription = async (
    subscription: PushSubscription
  ): Promise<boolean> => {
    try {
      const response = await fetch("/api/push/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      return response.ok;
    } catch (error) {
      console.error("Error validating subscription:", error);
      return false;
    }
  };

  const registerWithRetry = async (retryCount = 0): Promise<void> => {
    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      // If we have an existing subscription, validate it
      if (subscription) {
        const isValid = await validateSubscription(subscription);
        if (!isValid) {
          console.log("Existing subscription is invalid, unsubscribing...");
          await subscription.unsubscribe();
          subscription = null;
        }
      }

      if (!subscription) {
        console.log("Creating new push subscription");
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

        // Send subscription to server
        const registerResponse = await fetch("/api/push/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ subscription }),
        });

        if (!registerResponse.ok) {
          throw new Error("Failed to register push subscription with server");
        }

        console.log("Push subscription registered successfully");
      } else {
        console.log("Using existing valid push subscription");
      }
    } catch (error) {
      console.error("Error in push subscription process:", error);
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return registerWithRetry(retryCount + 1);
      }
      throw error;
    }
  };

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      throw new Error("Notifications not supported");
    }

    if (permission === "granted") {
      return permission;
    }

    if (permissionRequested) {
      console.log("Permission request already in progress");
      return permission;
    }

    try {
      permissionRequested = true;
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        await registerWithRetry();
      }

      return result;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      throw error;
    } finally {
      permissionRequested = false;
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

      // For iOS PWA, always register service worker
      if (isIOS && isPWA) {
        console.log("Registering service worker for iOS PWA");
        const registration = await navigator.serviceWorker.register("/sw.js");
        await registration.update();
      }

      await registerWithRetry();
    } catch (error) {
      console.error("Error registering push subscription:", error);
      throw error;
    }
  }, [isSupported, permission, isIOS, isPWA]);

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
