"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import AlertDisplay from "./AlertDisplay";
import { Alert } from "@prisma/client";

interface AlertWithRead extends Alert {
  read: boolean;
}

// Add types for iOS and Android specific features
interface SafariNavigator extends Navigator {
  standalone?: boolean;
}

interface WakeLockSentinel {
  released: boolean;
  release(): Promise<void>;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

// Add helper function for VAPID key conversion
const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export default function GlobalAlertDisplay() {
  const { data: session, status } = useSession();
  const [initialAlerts, setInitialAlerts] = useState<AlertWithRead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);

  // Debug log for session state
  useEffect(() => {
    console.log("Session state:", {
      status,
      hasSession: !!session,
      userEmail: session?.user?.email,
      userGeo: session?.user?.geo,
      userReferral: session?.user?.refferal,
      timestamp: new Date().toISOString(),
    });
  }, [session, status]);

  // Platform detection effect
  useEffect(() => {
    // Check platform and PWA status
    const isIOSStandalone = (window.navigator as SafariNavigator).standalone;
    const isStandaloneMode = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;
    const isIOSDevice = /iPad|iPhone|iPod/.test(window.navigator.userAgent);
    const isAndroidDevice = /Android/.test(window.navigator.userAgent);

    setIsAndroid(isAndroidDevice);
    setIsIOS(isIOSDevice);
    setIsStandalone(isIOSStandalone || isStandaloneMode);

    console.log("Platform detection:", {
      isIOSStandalone,
      isStandaloneMode,
      isIOSDevice,
      isAndroidDevice,
      userAgent: window.navigator.userAgent,
    });
  }, []);

  // Register for push notifications if iOS PWA
  const registerForPush = useCallback(async () => {
    if (isIOS && isStandalone && "Notification" in window) {
      try {
        console.log("Requesting notification permission for iOS...");
        const permission = await Notification.requestPermission();
        console.log("Notification permission result:", permission);

        if (permission === "granted") {
          // Check if service worker is already registered
          const existingReg = await navigator.serviceWorker.getRegistration();
          const registration =
            existingReg || (await navigator.serviceWorker.register("/sw.js"));

          console.log(
            "Service worker registration status:",
            registration.active ? "active" : "inactive"
          );

          // Check for existing push subscription
          let subscription = await registration.pushManager.getSubscription();

          if (!subscription) {
            console.log("Creating new push subscription...");
            // Get VAPID key from server
            const vapidResponse = await fetch("/api/push/vapid-public-key");
            if (!vapidResponse.ok) {
              throw new Error("Failed to fetch VAPID key");
            }
            const vapidPublicKey = await vapidResponse.text();
            console.log("Received VAPID key");

            // Convert VAPID key
            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
            console.log("Converted VAPID key");

            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: convertedVapidKey,
            });
            console.log("Push subscription created:", subscription);

            // Send the subscription to your server
            const response = await fetch("/api/push/register", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                subscription,
                userEmail: session?.user?.email,
              }),
            });

            if (!response.ok) {
              throw new Error("Failed to register subscription with server");
            }

            console.log("Push notification subscription successful");
          } else {
            console.log("Using existing push subscription");
          }
        }
      } catch (err) {
        console.error("Failed to register for push notifications:", err);
      }
    }
  }, [isIOS, isStandalone, session?.user?.email]);

  // Push notification registration effect
  useEffect(() => {
    if (session?.user?.email && isIOS && isStandalone) {
      registerForPush();

      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          registerForPush();
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
  }, [session?.user?.email, isIOS, isStandalone, registerForPush]);

  // Request wake lock for Android PWA
  useEffect(() => {
    const requestWakeLock = async () => {
      if (
        isAndroid &&
        isStandalone &&
        "wakeLock" in navigator &&
        navigator.wakeLock
      ) {
        try {
          const lock = await navigator.wakeLock.request("screen");
          setWakeLock(lock);
          console.log("Wake Lock is active");
        } catch (err) {
          console.error("Failed to request wake lock:", err);
        }
      }
    };

    requestWakeLock();
  }, [isAndroid, isStandalone]);

  // Alert polling effect
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        // Only fetch if session is authenticated
        if (status !== "authenticated") {
          console.log("Session not authenticated, skipping alert fetch", {
            status,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        console.log("Starting alert fetch:", {
          status,
          hasSession: !!session,
          userEmail: session?.user?.email,
          userGeo: session?.user?.geo,
          isPWA: isStandalone,
          platform: isAndroid ? "Android" : isIOS ? "iOS" : "Other",
          timestamp: new Date().toISOString(),
        });

        const response = await fetch("/api/alerts/check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        const responseText = await response.text();
        console.log("Raw response:", {
          status: response.status,
          text: responseText,
          timestamp: new Date().toISOString(),
        });

        if (!response.ok) {
          console.error("Error fetching alerts:", {
            status: response.status,
            statusText: response.statusText,
            error: responseText,
            timestamp: new Date().toISOString(),
          });
          setError(
            `Failed to fetch alerts: ${response.status} ${responseText}`
          );
          return;
        }

        const alerts = JSON.parse(responseText);
        console.log("Received alerts:", {
          count: alerts.length,
          timestamp: new Date().toISOString(),
          alerts: alerts.map((a: AlertWithRead) => ({
            id: a.id,
            message: a.message,
            startTime: a.startTime,
            endTime: a.endTime,
            read: a.read,
            geoTargets: a.geoTargets,
            referralCodes: a.referralCodes,
          })),
        });
        setInitialAlerts(alerts);
        setError(null);
      } catch (error) {
        console.error("Error fetching alerts:", {
          error,
          timestamp: new Date().toISOString(),
        });
        setError(
          error instanceof Error ? error.message : "Unknown error occurred"
        );
      }
    };

    // Initial fetch
    fetchAlerts();

    // Set up polling interval - but don't poll in background on iOS PWA
    let pollInterval: NodeJS.Timeout | null = null;
    if (!isIOS || !isStandalone || document.visibilityState === "visible") {
      pollInterval = setInterval(fetchAlerts, 30000);
    }

    // Set up visibility change listener
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        console.log("App became visible, fetching alerts...");
        // Start polling when visible on iOS PWA
        if (isIOS && isStandalone && !pollInterval) {
          pollInterval = setInterval(fetchAlerts, 30000);
        }
        // Re-request wake lock if needed for Android PWA
        if (
          isAndroid &&
          isStandalone &&
          !wakeLock &&
          "wakeLock" in navigator &&
          navigator.wakeLock
        ) {
          try {
            const lock = await navigator.wakeLock.request("screen");
            setWakeLock(lock);
            console.log("Wake Lock reacquired");
          } catch (err) {
            console.error("Failed to reacquire wake lock:", err);
          }
        }
        fetchAlerts();
      } else {
        // Stop polling when hidden on iOS PWA
        if (isIOS && isStandalone && pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
        // Release wake lock when hidden
        if (wakeLock) {
          try {
            await wakeLock.release();
            setWakeLock(null);
            console.log("Wake Lock released");
          } catch (err) {
            console.error("Failed to release wake lock:", err);
          }
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Set up online/offline listeners
    const handleOnline = () => {
      console.log("App is online, fetching alerts...");
      fetchAlerts();
    };
    window.addEventListener("online", handleOnline);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      if (wakeLock) {
        wakeLock
          .release()
          .catch((err) =>
            console.error("Failed to release wake lock on cleanup:", err)
          );
      }
    };
  }, [session, status, isStandalone, isAndroid, isIOS, wakeLock]);

  // Don't render anything if not authenticated
  if (status !== "authenticated" || !session?.user) {
    console.log("Not rendering AlertDisplay - not authenticated", { status });
    return null;
  }

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-8">
      {error ? (
        <div className="p-4 text-red-500">{error}</div>
      ) : (
        <AlertDisplay initialAlerts={initialAlerts} />
      )}
    </div>
  );
}
