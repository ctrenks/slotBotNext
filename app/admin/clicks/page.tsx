import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/prisma";
import type { ClickTrack } from "@prisma/client";

export const metadata: Metadata = {
  title: "Click Tracking",
  description: "View and analyze inbound click tracking data",
};

export default async function ClickTrackingPage() {
  const session = await auth();

  // Check if user is admin
  if (session?.user?.email !== "chris@trenkas.com") {
    redirect("/");
  }

  // Get the latest click tracking data
  const clickTracks = await prisma.clickTrack.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
  });

  // Get some statistics
  const totalClicks = await prisma.clickTrack.count();
  const clicksWithClickId = await prisma.clickTrack.count({
    where: { clickId: { not: null } },
  });
  const clicksWithOfferCode = await prisma.clickTrack.count({
    where: { offerCode: { not: null } },
  });
  const clicksConverted = await prisma.clickTrack.count({
    where: { convertedToUser: true },
  });

  // Convert totalClicks to number for calculations
  const totalClicksNum = Number(totalClicks);

  // Group by country
  type CountryCount = {
    geo: string;
    count: bigint;
  };

  const countryCounts = await prisma.$queryRaw<CountryCount[]>`
    SELECT geo, COUNT(*) as count
    FROM "ClickTrack"
    WHERE geo IS NOT NULL
    GROUP BY geo
    ORDER BY count DESC
    LIMIT 10
  `;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Click Tracking Dashboard</h1>

      <div className="bg-blue-900 rounded-lg p-4 mb-8">
        <p className="text-white">
          <strong>Note:</strong> Internal traffic from beatonlineslots.com,
          localhost, and 127.0.0.1 is automatically excluded from tracking.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-bold mb-2">Total Clicks</h2>
          <p className="text-4xl font-bold text-green-500">
            {totalClicks.toString()}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-bold mb-2">With ClickID</h2>
          <p className="text-4xl font-bold text-blue-500">
            {clicksWithClickId.toString()}
          </p>
          <p className="text-sm text-gray-400">
            {totalClicksNum > 0
              ? `${((Number(clicksWithClickId) / totalClicksNum) * 100).toFixed(
                  1
                )}%`
              : "0%"}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-bold mb-2">With Offer Code</h2>
          <p className="text-4xl font-bold text-purple-500">
            {clicksWithOfferCode.toString()}
          </p>
          <p className="text-sm text-gray-400">
            {totalClicksNum > 0
              ? `${(
                  (Number(clicksWithOfferCode) / totalClicksNum) *
                  100
                ).toFixed(1)}%`
              : "0%"}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-bold mb-2">Converted</h2>
          <p className="text-4xl font-bold text-yellow-500">
            {clicksConverted.toString()}
          </p>
          <p className="text-sm text-gray-400">
            {totalClicksNum > 0
              ? `${((Number(clicksConverted) / totalClicksNum) * 100).toFixed(
                  1
                )}%`
              : "0%"}
          </p>
        </div>
      </div>

      {/* Country Distribution */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-md mb-8">
        <h2 className="text-xl font-bold mb-4">Top Countries</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2">Country</th>
                <th className="text-right py-2">Clicks</th>
                <th className="text-right py-2">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(countryCounts) &&
                countryCounts.map((country) => {
                  const countNum = Number(country.count);
                  return (
                    <tr key={country.geo} className="border-b border-gray-700">
                      <td className="py-2">{country.geo}</td>
                      <td className="text-right py-2">{countNum}</td>
                      <td className="text-right py-2">
                        {totalClicksNum > 0
                          ? `${((countNum / totalClicksNum) * 100).toFixed(1)}%`
                          : "0%"}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Clicks Table */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-bold mb-4">Recent Clicks</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">IP</th>
                <th className="text-left py-2">Country</th>
                <th className="text-left py-2">Referrer</th>
                <th className="text-left py-2">ClickID</th>
                <th className="text-left py-2">Offer Code</th>
                <th className="text-left py-2">Converted</th>
              </tr>
            </thead>
            <tbody>
              {clickTracks.map((click: ClickTrack) => (
                <tr key={click.id} className="border-b border-gray-700">
                  <td className="py-2">
                    {new Date(click.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2">{click.ip || "-"}</td>
                  <td className="py-2">{click.geo || "-"}</td>
                  <td className="py-2 max-w-xs truncate">
                    {click.referrer || "-"}
                  </td>
                  <td className="py-2">{click.clickId || "-"}</td>
                  <td className="py-2">{click.offerCode || "-"}</td>
                  <td className="py-2">
                    {click.convertedToUser ? (
                      <span className="text-green-500">Yes</span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
