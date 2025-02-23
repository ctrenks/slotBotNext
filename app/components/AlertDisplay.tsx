"use client";

import { useEffect, useState } from "react";
import { markAlertAsRead } from "@/app/actions/alert";
import Image from "next/image";
import { useNotifications } from "@/app/hooks/useNotifications";
import { AlertWithRead } from "@/app/types/alert";

function CountdownTimer({ endTime }: { endTime: Date }) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = endTime.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  return <span>{timeLeft}</span>;
}

export default function AlertDisplay({
  initialAlerts,
}: {
  initialAlerts: AlertWithRead[];
}) {
  console.log("AlertDisplay component mounted with:", {
    initialAlertsCount: initialAlerts.length,
    initialAlerts: initialAlerts.map((a) => ({
      id: a.id,
      message: a.message,
      startTime: a.startTime,
      endTime: a.endTime,
      read: a.read,
      startTimeType: typeof a.startTime,
      endTimeType: typeof a.endTime,
      startTimeValue: String(a.startTime),
      endTimeValue: String(a.endTime),
    })),
  });

  const [alerts, setAlerts] = useState<AlertWithRead[]>(() => {
    console.log("Initializing alerts state with:", initialAlerts);
    return initialAlerts;
  });
  const [isMobile] = useState(
    typeof window !== "undefined" &&
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        navigator.userAgent.toLowerCase()
      )
  );

  // Log when alerts state changes
  useEffect(() => {
    console.log("Alerts state updated:", {
      alertsCount: alerts.length,
      alerts: alerts.map((a) => ({
        id: a.id,
        message: a.message,
        startTime: a.startTime,
        endTime: a.endTime,
        read: a.read,
      })),
    });
  }, [alerts]);

  const { permission, isSupported, requestPermission } = useNotifications();

  const handleMarkAsRead = async (alertId: string) => {
    await markAlertAsRead(alertId);
    setAlerts(
      alerts.map((alert) =>
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    );
  };

  // Active alerts - currently running
  const activeAlerts = alerts.filter((alert) => {
    console.log("Processing alert for active status:", {
      id: alert.id,
      startTime: alert.startTime,
      endTime: alert.endTime,
      currentTime: new Date().toISOString(),
    });

    // Parse dates from ISO strings
    const startTime = new Date(alert.startTime);
    const endTime = new Date(alert.endTime);

    // Convert all times to UTC timestamps for comparison
    const nowUTC = Date.now();
    const startUTC = startTime.getTime();
    const endUTC = endTime.getTime();

    const isActive = startUTC <= nowUTC && endUTC >= nowUTC;

    console.log("Alert filtering details:", {
      id: alert.id,
      message: alert.message.substring(0, 50) + "...",
      rawStartTime: alert.startTime,
      rawEndTime: alert.endTime,
      startTimeType: typeof alert.startTime,
      endTimeType: typeof alert.endTime,
      parsedStartTime: startTime,
      parsedEndTime: endTime,
      parsedStartTimeISO: startTime.toISOString(),
      parsedEndTimeISO: endTime.toISOString(),
      now: new Date().toISOString(),
      startUTC,
      endUTC,
      nowUTC,
      startCheck: startUTC <= nowUTC,
      endCheck: endUTC >= nowUTC,
      isActive,
      timeDiff: {
        startToNow: Math.floor((nowUTC - startUTC) / 1000 / 60) + " minutes",
        nowToEnd: Math.floor((endUTC - nowUTC) / 1000 / 60) + " minutes",
      },
    });

    return isActive;
  });

  // Expired alerts
  const expiredAlerts = alerts.filter((alert) => {
    const endTime = new Date(alert.endTime);
    const isExpired = endTime.getTime() < Date.now();
    console.log("Expired check:", {
      id: alert.id,
      endTime: endTime.toISOString(),
      now: new Date().toISOString(),
      isExpired,
    });
    return isExpired;
  });

  console.log("Final filtering results:", {
    total: alerts.length,
    active: activeAlerts.length,
    expired: expiredAlerts.length,
    now: new Date().toISOString(),
    allAlerts: alerts.map((a) => ({
      id: a.id,
      startTime: String(a.startTime),
      endTime: String(a.endTime),
    })),
  });

  return (
    <div className="space-y-6">
      {!isMobile && isSupported && permission === "default" && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <p className="text-blue-800 mb-2">
            Would you like to receive notifications for new alerts?
          </p>
          <button
            onClick={requestPermission}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Enable Notifications
          </button>
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
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Left Column - Images and Play Button */}
                  <div className="flex flex-row md:flex-col justify-between md:justify-start items-center md:items-start gap-4 md:min-w-[200px]">
                    {/* Casino Logo and Play Button */}
                    {alert.casino?.button && (
                      <div className="flex flex-col items-center">
                        <img
                          src={`/image/casino/${alert.casino.button}`}
                          alt={alert.casinoName || "Casino logo"}
                          className="max-w-[80px] md:max-w-[100px] w-auto h-auto object-contain"
                        />
                        <a
                          href={`/out/${alert.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm whitespace-nowrap"
                        >
                          Play Now
                        </a>
                      </div>
                    )}
                    {/* Slot Image */}
                    {alert.slotImage && (
                      <div className="flex justify-center">
                        <Image
                          src={`/image/sloticonssquare/${alert.slotImage}`}
                          alt={alert.slot || ""}
                          className="w-[100px] h-[100px] md:w-[160px] md:h-[160px] object-contain"
                          width={160}
                          height={160}
                        />
                      </div>
                    )}
                  </div>

                  {/* Right Column - Details */}
                  <div className="flex-1 min-w-0">
                    {/* Casino and Slot Names */}
                    <div className="mb-3">
                      {alert.casinoName && (
                        <h4 className="text-base md:text-lg font-semibold break-words">
                          {alert.casinoName} has {alert.slot} at {alert.rtp}%
                        </h4>
                      )}
                    </div>

                    {/* Alert Message */}
                    <p className="text-gray-800 mb-4 text-sm md:text-base break-words">
                      {alert.message}
                    </p>

                    {/* Additional Details */}
                    {(alert.maxPotential ||
                      alert.recommendedBet ||
                      alert.rtp) && (
                      <div className="grid grid-cols-2 md:grid-cols-2 gap-2 text-xs md:text-sm text-gray-600">
                        {alert.maxPotential && (
                          <div>
                            <span className="font-medium">
                              ✅Max Potential:
                            </span>{" "}
                            {alert.maxPotential}x
                          </div>
                        )}
                        {alert.recommendedBet && (
                          <div>
                            <span className="font-medium">✅Bet Range:</span> $
                            {alert.recommendedBet}
                          </div>
                        )}
                        {alert.rtp && (
                          <div>
                            <span className="font-medium">✅Slot RTP:</span>{" "}
                            {alert.rtp}%
                          </div>
                        )}
                        {alert.stopLimit && (
                          <div>
                            <span className="font-medium">
                              ☢️Stop Loss Limit:
                            </span>{" "}
                            ${alert.stopLimit}
                          </div>
                        )}
                        {alert.targetWin && (
                          <div>
                            <span className="font-medium">✅Target Win:</span> $
                            {alert.targetWin}
                          </div>
                        )}
                        {alert.maxWin && (
                          <div>
                            <span className="font-medium">
                              ✅Max Win Limit:
                            </span>{" "}
                            ${alert.maxWin}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Timer and Mark as Read */}
                    <div className="mt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-xs md:text-sm text-gray-500">
                      <span>
                        Time remaining:{" "}
                        <CountdownTimer endTime={new Date(alert.endTime)} />
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
                <h5 className="text-base md:text-lg font-semibold break-words">
                  {alert.casinoName} has {alert.slot} at {alert.rtp}%
                </h5>
                <p className="text-gray-600 text-sm md:text-base break-words">
                  {alert.message}
                </p>
                <div className="mt-2 text-xs md:text-sm text-gray-500">
                  <span>Expired</span>
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
