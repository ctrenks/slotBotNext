"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { markAlertAsRead } from "@/app/actions/alert";
import { Alert as PrismaAlert } from "@prisma/client";

interface AlertWithRead extends PrismaAlert {
  read: boolean;
}

export default function AlertDisplay({
  initialAlerts,
}: {
  initialAlerts: AlertWithRead[];
}) {
  const [alerts, setAlerts] = useState<AlertWithRead[]>(initialAlerts);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(true);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== "undefined") {
      notificationSoundRef.current = new Audio("/notification.mp3");
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission();
      console.log("Notification permission:", result);
      setPermission(result);
      setShowPermissionPrompt(false);
    }
  };

  const showNotification = useCallback(
    async (alert: AlertWithRead) => {
      console.log("Showing notification for:", alert);

      if (permission === "granted") {
        // Show browser notification
        const notification = new Notification("New Alert", {
          body: alert.message,
          icon: "/favicon.ico",
          tag: alert.id,
          requireInteraction: true,
        });

        // Play sound
        try {
          if (notificationSoundRef.current) {
            await notificationSoundRef.current.play();
          }
        } catch (err) {
          console.error("Error playing notification sound:", err);
        }

        // Flash title
        const originalTitle = document.title;
        let isFlashing = true;
        const flashInterval = setInterval(() => {
          if (isFlashing) {
            document.title = `🔔 New Alert! 🔔 - ${alert.message}`;
          } else {
            document.title = originalTitle;
          }
          isFlashing = !isFlashing;
        }, 1000);

        // Stop flashing when user focuses the window
        window.addEventListener(
          "focus",
          () => {
            isFlashing = false;
            document.title = originalTitle;
            clearInterval(flashInterval);
          },
          { once: true }
        );

        // Handle notification click
        notification.onclick = () => {
          window.focus();
          notification.close();
          isFlashing = false;
          document.title = originalTitle;
          clearInterval(flashInterval);
        };
      }
    },
    [permission]
  );

  // Check for new alerts every minute
  useEffect(() => {
    const checkNewAlerts = async () => {
      try {
        console.log("Checking for new alerts...");
        const response = await fetch("/api/alerts/check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.error("Error response from alert check:", response.status);
          return;
        }

        const newAlerts = await response.json();
        console.log("Received alerts:", newAlerts);

        if (newAlerts.length > 0) {
          setAlerts((prev) => {
            // Filter out any duplicates
            const newAlertIds = new Set(
              newAlerts.map((a: AlertWithRead) => a.id)
            );
            const existingAlerts = prev.filter((a) => !newAlertIds.has(a.id));
            return [...existingAlerts, ...newAlerts];
          });

          // Show notification for each new alert if permission is granted
          if (permission === "granted") {
            for (const alert of newAlerts) {
              if (!alert.read) {
                await showNotification(alert);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error checking for new alerts:", error);
      }
    };

    // Initial check
    checkNewAlerts();

    // Set up polling interval (60000ms = 1 minute)
    const interval = setInterval(checkNewAlerts, 60000);

    // Cleanup
    return () => {
      console.log("Cleaning up alert polling...");
      clearInterval(interval);
    };
  }, [permission, showNotification]);

  const handleMarkAsRead = async (alertId: string) => {
    await markAlertAsRead(alertId);
    setAlerts(
      alerts.map((alert) =>
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    );
  };

  const now = new Date();

  // Active alerts - currently running
  const activeAlerts = alerts.filter((alert) => {
    const startTime = new Date(alert.startTime);
    const endTime = new Date(alert.endTime);
    return startTime <= now && endTime >= now;
  });

  // Upcoming alerts - starting within the next 24 hours
  const upcomingAlerts = alerts.filter((alert) => {
    const startTime = new Date(alert.startTime);
    const endTime = new Date(alert.endTime);
    const twentyFourHoursFromNow = new Date(
      now.getTime() + 24 * 60 * 60 * 1000
    );
    return (
      startTime > now && startTime <= twentyFourHoursFromNow && endTime >= now
    );
  });

  // Expired alerts
  const expiredAlerts = alerts.filter((alert) => {
    const endTime = new Date(alert.endTime);
    return endTime < now;
  });

  return (
    <div className="space-y-6">
      {showPermissionPrompt && permission === "default" && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <p className="text-blue-800 mb-2">
            Would you like to receive notifications for new alerts?
          </p>
          <button
            onClick={requestNotificationPermission}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Enable Notifications
          </button>
        </div>
      )}

      {upcomingAlerts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Upcoming Alerts</h3>
          <div className="space-y-3">
            {upcomingAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-lg border bg-yellow-50 border-yellow-200"
              >
                <p className="text-gray-800">{alert.message}</p>
                <div className="mt-2 flex justify-between items-center text-sm text-gray-500">
                  <span>
                    Starts: {new Date(alert.startTime).toLocaleString()}
                  </span>
                  <span>Ends: {new Date(alert.endTime).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
