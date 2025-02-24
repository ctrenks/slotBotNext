"use client";

import { useEffect, useState, memo } from "react";
import Image from "next/image";
import { AlertWithRead } from "@/app/types/alert";

const AlertDisplay = memo(function AlertDisplay({
  initialAlerts,
}: {
  initialAlerts: AlertWithRead[];
}) {
  const [alerts, setAlerts] = useState<AlertWithRead[]>(initialAlerts);

  // Update alerts only when initialAlerts actually changes
  useEffect(() => {
    const hasChanges =
      alerts.length !== initialAlerts.length ||
      initialAlerts.some((newAlert, index) => {
        const existingAlert = alerts[index];
        return (
          !existingAlert ||
          newAlert.id !== existingAlert.id ||
          newAlert.read !== existingAlert.read
        );
      });

    if (hasChanges) {
      console.log("Updating alerts due to changes:", {
        oldCount: alerts.length,
        newCount: initialAlerts.length,
        alerts: initialAlerts.map((a) => ({
          id: a.id,
          message: a.message.substring(0, 50) + "...",
          read: a.read,
        })),
      });
      setAlerts(initialAlerts);
    }
  }, [initialAlerts]);

  return (
    <div className="space-y-6">
      {alerts.length > 0 ? (
        <div>
          <h3 className="text-lg font-semibold mb-3">Active Alerts</h3>
          <div className="space-y-3">
            {alerts.map((alert) => (
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
                        <Image
                          src={`/image/casino/${alert.casino.button}`}
                          alt={alert.casinoName || "Casino logo"}
                          className="max-w-[80px] md:max-w-[100px] w-auto h-auto object-contain"
                          width={100}
                          height={100}
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No alerts to display</p>
      )}
    </div>
  );
});

export default AlertDisplay;
