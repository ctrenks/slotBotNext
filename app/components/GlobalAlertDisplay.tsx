"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AlertDisplay from "./AlertDisplay";
import { Alert } from "@prisma/client";

interface AlertWithRead extends Alert {
  read: boolean;
}

export default function GlobalAlertDisplay() {
  const { data: session, status } = useSession();
  const [initialAlerts, setInitialAlerts] = useState<AlertWithRead[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialAlerts = async () => {
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
        });

        const response = await fetch("/api/alerts/check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error fetching initial alerts:", {
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
        console.error("Error fetching initial alerts:", error);
        setError(
          error instanceof Error ? error.message : "Unknown error occurred"
        );
      }
    };

    fetchInitialAlerts();
    // Re-fetch alerts when session changes
  }, [session, status]);

  // Don't render anything if not authenticated
  if (status !== "authenticated" || !session?.user) {
    console.log("Not rendering AlertDisplay - not authenticated", { status });
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {error ? (
        <div className="p-4 text-red-500">{error}</div>
      ) : (
        <AlertDisplay initialAlerts={initialAlerts} />
      )}
    </div>
  );
}
