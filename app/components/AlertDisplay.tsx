"use client";

import { useEffect, useState } from "react";
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
    // Set up browser notifications for new alerts
    if (permission === "granted") {
      alerts.forEach((alert) => {
        if (!alert.read) {
          new Notification("New Alert", {
            body: alert.message,
            icon: "/favicon.ico", // Add your favicon path
          });
        }
      });
    }
  }, [alerts, permission]);

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
