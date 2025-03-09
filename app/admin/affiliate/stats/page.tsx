import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/prisma";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Affiliate Statistics",
  description: "View affiliate conversion statistics and metrics",
};

// Define interface for monthly data
interface MonthlyData {
  month: string | Date; // Allow for string or Date type
  total: bigint;
  with_clickid: bigint;
  with_offercode: bigint;
}

// Client component for export button
const ExportButton = ({ geo, code }: { geo?: string; code?: string }) => {
  "use client";

  const handleExport = () => {
    // Build the query parameters
    const params = new URLSearchParams();
    if (geo) params.append("geo", geo);
    if (code) params.append("code", code);

    // Create the export URL
    const exportUrl = `/api/clicks/export?${params.toString()}`;

    // Open the export URL in a new tab
    window.open(exportUrl, "_blank");
  };

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-medium ml-2"
    >
      Export to CSV
    </button>
  );
};

export default async function AffiliateStatsPage({
  searchParams,
}: {
  searchParams: { geo?: string; code?: string };
}) {
  const session = await auth();

  // Check if user is admin
  if (session?.user?.email !== "chris@trenkas.com") {
    redirect("/");
  }

  // Get filter parameters
  const { geo, code } = searchParams;
  const hasFilters = !!geo || !!code;

  // Get total users
  const totalUsers = await prisma.user.count();
  const totalUsersNum = Number(totalUsers);

  // Get users with clickId
  const usersWithClickId = await prisma.user.count({
    where: {
      clickId: {
        not: null,
      },
    },
  });
  const usersWithClickIdNum = Number(usersWithClickId);

  // Get users with offerCode
  const usersWithOfferCode = await prisma.user.count({
    where: {
      offerCode: {
        not: null,
      },
    },
  });
  const usersWithOfferCodeNum = Number(usersWithOfferCode);

  // Get paid users with clickId
  const paidUsersWithClickId = await prisma.user.count({
    where: {
      clickId: {
        not: null,
      },
      paid: true,
    },
  });
  const paidUsersWithClickIdNum = Number(paidUsersWithClickId);

  // Get paid users with offerCode
  const paidUsersWithOfferCode = await prisma.user.count({
    where: {
      offerCode: {
        not: null,
      },
      paid: true,
    },
  });
  const paidUsersWithOfferCodeNum = Number(paidUsersWithOfferCode);

  // Get users registered in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentUsers = await prisma.user.count({
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
  });
  const recentUsersNum = Number(recentUsers);

  const recentUsersWithClickId = await prisma.user.count({
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
      clickId: {
        not: null,
      },
    },
  });
  const recentUsersWithClickIdNum = Number(recentUsersWithClickId);

  // Get monthly registration data for the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyData = await prisma.$queryRaw<MonthlyData[]>`
    SELECT
      DATE_TRUNC('month', "createdAt") as month,
      COUNT(*) as total,
      COUNT(CASE WHEN "clickId" IS NOT NULL THEN 1 END) as with_clickid,
      COUNT(CASE WHEN "offerCode" IS NOT NULL THEN 1 END) as with_offercode
    FROM "User"
    WHERE "createdAt" >= ${sixMonthsAgo}
    GROUP BY DATE_TRUNC('month', "createdAt")
    ORDER BY month ASC
  `;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Affiliate Statistics</h1>
        <div className="flex items-center">
          {hasFilters && <ExportButton geo={geo} code={code} />}
          <Link
            href="/admin/affiliate"
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white font-medium ml-2"
          >
            Back to Affiliate Dashboard
          </Link>
        </div>
      </div>

      {/* Filter information */}
      {hasFilters && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">Active Filters</h2>
          <div className="flex flex-wrap gap-2">
            {geo && (
              <div className="bg-gray-700 px-3 py-1 rounded-full text-sm">
                Country: {geo}
              </div>
            )}
            {code && (
              <div className="bg-gray-700 px-3 py-1 rounded-full text-sm">
                Offer Code: {code}
              </div>
            )}
            <Link
              href="/admin/affiliate/stats"
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-full text-sm"
            >
              Clear Filters
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Total Users</h3>
          <p className="text-3xl font-bold">{totalUsersNum}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Users with ClickID</h3>
          <p className="text-3xl font-bold">{usersWithClickIdNum}</p>
          <p className="text-sm text-gray-400 mt-2">
            {totalUsersNum > 0
              ? `${Math.round(
                  (usersWithClickIdNum / totalUsersNum) * 100
                )}% of total users`
              : "0%"}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Users with OfferCode</h3>
          <p className="text-3xl font-bold">{usersWithOfferCodeNum}</p>
          <p className="text-sm text-gray-400 mt-2">
            {totalUsersNum > 0
              ? `${Math.round(
                  (usersWithOfferCodeNum / totalUsersNum) * 100
                )}% of total users`
              : "0%"}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Paid Conversions</h3>
          <p className="text-3xl font-bold">{paidUsersWithClickIdNum}</p>
          <p className="text-sm text-gray-400 mt-2">
            {usersWithClickIdNum > 0
              ? `${Math.round(
                  (paidUsersWithClickIdNum / usersWithClickIdNum) * 100
                )}% conversion rate`
              : "0%"}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">
            Paid Conversions with OfferCode
          </h3>
          <p className="text-3xl font-bold">{paidUsersWithOfferCodeNum}</p>
          <p className="text-sm text-gray-400 mt-2">
            {paidUsersWithClickIdNum > 0
              ? `${Math.round(
                  (paidUsersWithOfferCodeNum / paidUsersWithClickIdNum) * 100
                )}% conversion rate`
              : "0%"}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Last 30 Days</h3>
          <p className="text-3xl font-bold">
            {recentUsersWithClickIdNum} / {recentUsersNum}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            {recentUsersNum > 0
              ? `${Math.round(
                  (recentUsersWithClickIdNum / recentUsersNum) * 100
                )}% from affiliates`
              : "0%"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Monthly Registrations</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                  >
                    Month
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                  >
                    Total Users
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                  >
                    With ClickID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                  >
                    With OfferCode
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                  >
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {Array.isArray(monthlyData) &&
                  monthlyData.map((month, index) => {
                    const totalNum = Number(month.total);
                    const withClickIdNum = Number(month.with_clickid);
                    const withOfferCodeNum = Number(month.with_offercode);

                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(month.month).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {totalNum}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {withClickIdNum}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {withOfferCodeNum}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {totalNum > 0
                            ? `${Math.round(
                                (withClickIdNum / totalNum) * 100
                              )}%`
                            : "0%"}
                        </td>
                      </tr>
                    );
                  })}
                {(!Array.isArray(monthlyData) || monthlyData.length === 0) && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-sm text-gray-400"
                    >
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Conversion Funnel</h2>
          <div className="space-y-4">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-gray-700 text-gray-300">
                    Total Users
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-gray-300">
                    {totalUsersNum}
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-700">
                <div
                  style={{ width: "100%" }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                ></div>
              </div>
            </div>

            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-gray-700 text-gray-300">
                    Users with ClickID
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-gray-300">
                    {usersWithClickIdNum} (
                    {totalUsersNum > 0
                      ? Math.round((usersWithClickIdNum / totalUsersNum) * 100)
                      : 0}
                    %)
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-700">
                <div
                  style={{
                    width: `${
                      totalUsersNum > 0
                        ? (usersWithClickIdNum / totalUsersNum) * 100
                        : 0
                    }%`,
                  }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                ></div>
              </div>
            </div>

            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-gray-700 text-gray-300">
                    Users with OfferCode
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-gray-300">
                    {usersWithOfferCodeNum} (
                    {totalUsersNum > 0
                      ? Math.round(
                          (usersWithOfferCodeNum / totalUsersNum) * 100
                        )
                      : 0}
                    %)
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-700">
                <div
                  style={{
                    width: `${
                      totalUsersNum > 0
                        ? (usersWithOfferCodeNum / totalUsersNum) * 100
                        : 0
                    }%`,
                  }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"
                ></div>
              </div>
            </div>

            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-gray-700 text-gray-300">
                    Paid Conversions
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-gray-300">
                    {paidUsersWithClickIdNum} (
                    {usersWithClickIdNum > 0
                      ? Math.round(
                          (paidUsersWithClickIdNum / usersWithClickIdNum) * 100
                        )
                      : 0}
                    %)
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-700">
                <div
                  style={{
                    width: `${
                      usersWithClickIdNum > 0
                        ? (paidUsersWithClickIdNum / usersWithClickIdNum) * 100
                        : 0
                    }%`,
                  }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-500"
                ></div>
              </div>
            </div>

            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-gray-700 text-gray-300">
                    Paid Conversions with OfferCode
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-gray-300">
                    {paidUsersWithOfferCodeNum} (
                    {paidUsersWithClickIdNum > 0
                      ? Math.round(
                          (paidUsersWithOfferCodeNum /
                            paidUsersWithClickIdNum) *
                            100
                        )
                      : 0}
                    %)
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-700">
                <div
                  style={{
                    width: `${
                      paidUsersWithClickIdNum > 0
                        ? (paidUsersWithOfferCodeNum /
                            paidUsersWithClickIdNum) *
                          100
                        : 0
                    }%`,
                  }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-pink-500"
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Affiliate Acquisition</p>
                <p className="text-xl font-bold">
                  {totalUsersNum > 0
                    ? Math.round((usersWithClickIdNum / totalUsersNum) * 100)
                    : 0}
                  %
                </p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Conversion Rate</p>
                <p className="text-xl font-bold">
                  {usersWithClickIdNum > 0
                    ? Math.round(
                        (paidUsersWithClickIdNum / usersWithClickIdNum) * 100
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
