"use client";

import { useEffect, useState } from "react";
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

export default function GlobalAlertDisplay() {
  const { data: session, status } = useSession();
  const [initialAlerts, setInitialAlerts] = useState<AlertWithRead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);

  useEffect(() => {
    // Check platform and PWA status
    const isIOSStandalone = (window.navigator as SafariNavigator).standalone;
    const isStandaloneMode = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;
    const isAndroidDevice = /Android/.test(window.navigator.userAgent);

    setIsAndroid(isAndroidDevice);
    setIsStandalone(isIOSStandalone || isStandaloneMode);

    // Request wake lock for Android PWA
    const requestWakeLock = async () => {
      if (
        isAndroidDevice &&
        isStandaloneMode &&
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
  }, []);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        // Only fetch if session is authenticated
        if (status !== "authenticated") {
          console.log("Session not authenticated, skipping alert fetch", {
            status,
          });
          return;
        }

        console.log("Fetching alerts with session:", {
          status,
          hasSession: !!session,
          userEmail: session?.user?.email,
          userGeo: session?.user?.geo,
          userRefferal: session?.user?.refferal,
          isPWA: isStandalone,
          platform: isAndroid ? "Android" : "iOS/Other",
        });

        const response = await fetch("/api/alerts/check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error fetching alerts:", {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
          });
          setError(`Failed to fetch alerts: ${response.status} ${errorText}`);
          return;
        }

        const alerts = await response.json();
        console.log("Received alerts:", {
          count: alerts.length,
          alerts: alerts.map((a: AlertWithRead) => ({
            id: a.id,
            message: a.message,
            startTime: a.startTime,
            endTime: a.endTime,
            read: a.read,
          })),
        });
        setInitialAlerts(alerts);
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
    let pollInterval: NodeJS.Timeout;

    if (isStandalone) {
      // More frequent polling for standalone PWA mode (every 30 seconds)
      pollInterval = setInterval(fetchAlerts, 30000);

      // Set up visibility change listener for PWA
      const handleVisibilityChange = async () => {
        if (document.visibilityState === "visible") {
          // Re-request wake lock if needed
          if (
            isAndroid &&
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
        } else if (document.visibilityState === "hidden" && wakeLock) {
          // Release wake lock when app is hidden
          try {
            await wakeLock.release();
            setWakeLock(null);
            console.log("Wake Lock released");
          } catch (err) {
            console.error("Failed to release wake lock:", err);
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
        clearInterval(pollInterval);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
        window.removeEventListener("online", handleOnline);
        // Release wake lock on cleanup
        if (wakeLock) {
          wakeLock
            .release()
            .catch((err) =>
              console.error("Failed to release wake lock on cleanup:", err)
            );
        }
      };
    } else {
      // Less frequent polling for browser mode (every 60 seconds)
      pollInterval = setInterval(fetchAlerts, 60000);
      return () => clearInterval(pollInterval);
    }
  }, [session, status, isStandalone, isAndroid, wakeLock]);

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
