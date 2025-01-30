"use client";

import { useEffect, useState, useCallback } from "react";
import { markAlertAsRead } from "@/app/actions/alert";
import { Alert as PrismaAlert } from "@prisma/client";

interface AlertWithRead extends PrismaAlert {
  read: boolean;
}

export default function AlertDisplay({
  initialAlerts,
  userGeo,
  userReferral,
}: {
  initialAlerts: AlertWithRead[];
  userGeo: string;
  userReferral: string | null;
}) {
  const [alerts, setAlerts] = useState<AlertWithRead[]>(
    // Filter alerts based on user's geo and referral
    initialAlerts.filter(
      (alert) =>
        (alert.geoTargets.includes("all") ||
          alert.geoTargets.includes(userGeo)) &&
        (alert.referralCodes.includes("all") ||
          (userReferral && alert.referralCodes.includes(userReferral)))
    )
  );
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [notificationSound] = useState(() =>
    typeof Audio !== "undefined" ? new Audio("/notification.mp3") : null
  );

  const showNotification = useCallback(
    (alert: AlertWithRead) => {
      if (permission === "granted") {
        // Show browser notification
        const notification = new Notification("New Alert", {
          body: alert.message,
          icon: "/favicon.ico",
          tag: alert.id, // Prevent duplicate notifications
          requireInteraction: true, // Keep notification visible until user interacts
        });

        // Play sound
        if (notificationSound) {
          notificationSound
            .play()
            .catch((err) =>
              console.error("Error playing notification sound:", err)
            );
        }

        // Flash title
        const originalTitle = document.title;
        let isFlashing = true;
        const flashInterval = setInterval(() => {
          if (isFlashing) {
            document.title = isFlashing
              ? `🔔 New Alert! 🔔 - ${alert.message}`
              : originalTitle;
          } else {
            clearInterval(flashInterval);
            document.title = originalTitle;
          }
        }, 1000);

        // Stop flashing when user focuses the window
        window.addEventListener(
          "focus",
          () => {
            isFlashing = false;
            document.title = originalTitle;
          },
          { once: true }
        );

        // Handle notification click
        notification.onclick = () => {
          window.focus();
          notification.close();
          isFlashing = false;
          document.title = originalTitle;
        };
      }
    },
    [permission, notificationSound]
  );

  // Check for new alerts every 10 seconds
  useEffect(() => {
    const checkNewAlerts = async () => {
      try {
        const response = await fetch("/api/alerts/check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lastAlertTime: Math.max(
              ...alerts.map((a) => new Date(a.createdAt).getTime()),
              0
            ),
          }),
        });

        if (!response.ok) return;

        const newAlerts: AlertWithRead[] = await response.json();
        if (newAlerts.length > 0) {
          // Filter new alerts based on user's geo and referral
          const filteredNewAlerts = newAlerts.filter(
            (alert) =>
              (alert.geoTargets.includes("all") ||
                alert.geoTargets.includes(userGeo)) &&
              (alert.referralCodes.includes("all") ||
                (userReferral && alert.referralCodes.includes(userReferral)))
          );

          if (filteredNewAlerts.length > 0) {
            setAlerts((prev) => [...prev, ...filteredNewAlerts]);
            // Show notification for each new alert
            filteredNewAlerts.forEach(showNotification);
          }
        }
      } catch (error) {
        console.error("Error checking for new alerts:", error);
      }
    };

    const interval = setInterval(checkNewAlerts, 10000);
    return () => clearInterval(interval);
  }, [alerts, userGeo, userReferral, showNotification]);

  useEffect(() => {
    // Check if browser supports notifications
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    // Request notification permission if not granted
    const requestNotificationPermission = async () => {
      if (permission === "default") {
        const result = await Notification.requestPermission();
        setPermission(result);
      }
    };

    requestNotificationPermission();
  }, [permission]);

  useEffect(() => {
    // Show notifications for initial unread alerts
    alerts.forEach((alert) => {
      if (!alert.read) {
        showNotification(alert);
      }
    });
  }, []); // Only run once for initial alerts

  const handleMarkAsRead = async (alertId: string) => {
    await markAlertAsRead(alertId);
    setAlerts(
      alerts.map((alert) =>
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    );
  };

  const now = new Date();
  const activeAlerts = alerts.filter((alert) => {
    const startTime = new Date(alert.startTime);
    const endTime = new Date(alert.endTime);
    return startTime <= now && endTime >= now;
  });

  const expiredAlerts = alerts.filter((alert) => {
    const endTime = new Date(alert.endTime);
    return endTime < now;
  });

  return (
    <div className="space-y-6">
      {activeAlerts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Active Alerts</h3>
          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${
                  alert.read ? "bg-gray-50" : "bg-green-50 border-green-200"
                }`}
              >
                <p className="text-gray-800">{alert.message}</p>
                <div className="mt-2 flex justify-between items-center text-sm text-gray-500">
                  <span>
                    Expires: {new Date(alert.endTime).toLocaleString()}
                  </span>
                  {!alert.read && (
                    <button
                      onClick={() => handleMarkAsRead(alert.id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {expiredAlerts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Expired Alerts</h3>
          <div className="space-y-3">
            {expiredAlerts.map((alert) => (
              <div key={alert.id} className="p-4 rounded-lg border bg-gray-50">
                <p className="text-gray-600">{alert.message}</p>
                <div className="mt-2 text-sm text-gray-500">
                  <span>
                    Expired: {new Date(alert.endTime).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {alerts.length === 0 && (
        <p className="text-gray-500 text-center py-4">No alerts to display</p>
      )}
    </div>
  );
}
