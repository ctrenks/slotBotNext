import { redirect } from "next/navigation";
import { prisma } from "@/prisma";
import { isAdmin } from "@/app/utils/auth";
import AlertManager from "@/app/components/AlertManager";
import { Metadata } from "next";
import { Alert, AlertRecipient, AlertClick, User } from "@prisma/client";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Alert Management",
  description: "Manage system alerts and notifications",
};

interface AlertWithRecipientsAndClicks extends Alert {
  recipients: AlertRecipient[];
  clicks: (AlertClick & {
    user: User | null;
  })[];
  _count: {
    clicks: number;
  };
}

export default async function AlertManagementPage() {
  // Check if user is admin
  if (!(await isAdmin())) {
    redirect("/");
  }

  // Get all alerts for display with click tracking data
  const alerts = (await prisma.alert.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      recipients: true,
      clicks: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              geo: true,
              paid: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          clicks: true,
        },
      },
    },
  })) as AlertWithRecipientsAndClicks[];

  // Calculate summary statistics
  const totalClicks = alerts.reduce(
    (sum, alert) => sum + alert._count.clicks,
    0
  );
  const alertsWithClicks = alerts.filter(
    (alert) => alert._count.clicks > 0
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Alert Management</h1>

        {/* Export Controls */}
        <div className="flex gap-2">
          <a
            href="/api/admin/alerts/clicks?format=csv"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white text-sm font-medium"
            download
          >
            Export All Clicks (CSV)
          </a>
          <Link
            href="/api/admin/alerts/clicks"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white text-sm font-medium"
            target="_blank"
          >
            View API Data
          </Link>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400">Total Alerts</h3>
          <p className="text-2xl font-bold text-white">{alerts.length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400">
            Alerts with Clicks
          </h3>
          <p className="text-2xl font-bold text-green-400">
            {alertsWithClicks}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400">Total Clicks</h3>
          <p className="text-2xl font-bold text-blue-400">{totalClicks}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400">
            Avg Clicks/Alert
          </h3>
          <p className="text-2xl font-bold text-purple-400">
            {alerts.length > 0 ? (totalClicks / alerts.length).toFixed(1) : "0"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="lg:w-1/2">
          <AlertManager />
        </div>

        <div className="w-full">
          <h2 className="text-2xl font-bold mb-4">Existing Alerts</h2>
          <div className="space-y-6">
            {alerts.map((alert: AlertWithRecipientsAndClicks) => (
              <div key={alert.id} className="border rounded-lg p-6 bg-gray-800">
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium text-lg text-white flex-1">
                      {alert.message}
                    </p>
                    {alert._count.clicks > 0 && (
                      <a
                        href={`/api/admin/alerts/clicks?alertId=${alert.id}&format=csv`}
                        className="ml-4 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-xs font-medium"
                        download
                      >
                        Export CSV
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-300">
                    <div>
                      <span className="font-medium">Start:</span>
                      <br />
                      {new Date(alert.startTime).toLocaleString("en-US", {
                        timeZone: "America/New_York",
                      })}{" "}
                      EST
                    </div>
                    <div>
                      <span className="font-medium">End:</span>
                      <br />
                      {new Date(alert.endTime).toLocaleString("en-US", {
                        timeZone: "America/New_York",
                      })}{" "}
                      EST
                    </div>
                    <div>
                      <span className="font-medium">Recipients:</span>
                      <br />
                      {alert.recipients.length}
                    </div>
                    <div>
                      <span className="font-medium">Total Clicks:</span>
                      <br />
                      <span className="text-green-400 font-bold">
                        {alert._count.clicks}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-400">
                    <p>
                      <span className="font-medium">Geo Targets:</span>{" "}
                      {alert.geoTargets.join(", ") || "All"}
                    </p>
                    <p>
                      <span className="font-medium">Referral Codes:</span>{" "}
                      {alert.referralCodes.join(", ") || "All"}
                    </p>
                    {alert.casinoName && (
                      <p>
                        <span className="font-medium">Casino:</span>{" "}
                        {alert.casinoName}
                      </p>
                    )}
                    {alert.slot && (
                      <p>
                        <span className="font-medium">Slot:</span> {alert.slot}
                      </p>
                    )}
                  </div>
                </div>

                {/* Click Tracking Section */}
                {alert.clicks.length > 0 && (
                  <div className="mt-4 border-t border-gray-700 pt-4">
                    <h3 className="text-lg font-medium text-white mb-3">
                      Users Who Clicked ({alert.clicks.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-300">
                              User
                            </th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-300">
                              Email
                            </th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-300">
                              Status
                            </th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-300">
                              Location
                            </th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-300">
                              Click Time
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {alert.clicks.map((click) => (
                            <tr
                              key={click.id}
                              className="border-b border-gray-800"
                            >
                              <td className="py-2 px-3 text-sm text-white">
                                {click.user?.name ||
                                  click.username ||
                                  "Anonymous"}
                              </td>
                              <td className="py-2 px-3 text-sm text-gray-300">
                                {click.user?.email || click.userEmail || "N/A"}
                              </td>
                              <td className="py-2 px-3">
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${
                                    click.user?.paid
                                      ? "bg-green-800 text-green-100"
                                      : "bg-yellow-800 text-yellow-100"
                                  }`}
                                >
                                  {click.user?.paid ? "Paid" : "Free"}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-sm text-gray-300">
                                <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                                  {click.geo || click.user?.geo || "Unknown"}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-sm text-gray-300">
                                {new Date(click.createdAt).toLocaleString(
                                  "en-US",
                                  {
                                    timeZone: "America/New_York",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {alert.clicks.length === 0 && (
                  <div className="mt-4 border-t border-gray-700 pt-4">
                    <p className="text-gray-500 text-center py-2">
                      No clicks recorded for this alert
                    </p>
                  </div>
                )}
              </div>
            ))}
            {alerts.length === 0 && (
              <p className="text-gray-500">No alerts created yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
