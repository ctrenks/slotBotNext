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
  total: number;
  with_clickid: number;
}

export default async function AffiliateStatsPage() {
  const session = await auth();

  // Check if user is admin
  if (session?.user?.email !== "chris@trenkas.com") {
    redirect("/");
  }

  // Get total users
  const totalUsers = await prisma.user.count();

  // Get users with clickId
  const usersWithClickId = await prisma.user.count({
    where: {
      clickId: {
        not: null,
      },
    },
  });

  // Get paid users with clickId
  const paidUsersWithClickId = await prisma.user.count({
    where: {
      clickId: {
        not: null,
      },
      paid: true,
    },
  });

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

  // Get monthly registration data for the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyData = await prisma.$queryRaw<MonthlyData[]>`
    SELECT
      DATE_TRUNC('month', "createdAt") as month,
      COUNT(*) as total,
      COUNT(CASE WHEN "clickId" IS NOT NULL THEN 1 END) as with_clickid
    FROM "User"
    WHERE "createdAt" >= ${sixMonthsAgo}
    GROUP BY DATE_TRUNC('month', "createdAt")
    ORDER BY month ASC
  `;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Affiliate Statistics</h1>
        <Link
          href="/admin/affiliate"
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white font-medium"
        >
          Back to Affiliate Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Total Users</h3>
          <p className="text-3xl font-bold">{totalUsers}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Users with ClickID</h3>
          <p className="text-3xl font-bold">{usersWithClickId}</p>
          <p className="text-sm text-gray-400 mt-2">
            {totalUsers > 0
              ? `${Math.round(
                  (usersWithClickId / totalUsers) * 100
                )}% of total users`
              : "0%"}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Paid Conversions</h3>
          <p className="text-3xl font-bold">{paidUsersWithClickId}</p>
          <p className="text-sm text-gray-400 mt-2">
            {usersWithClickId > 0
              ? `${Math.round(
                  (paidUsersWithClickId / usersWithClickId) * 100
                )}% conversion rate`
              : "0%"}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Last 30 Days</h3>
          <p className="text-3xl font-bold">
            {recentUsersWithClickId} / {recentUsers}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            {recentUsers > 0
              ? `${Math.round(
                  (recentUsersWithClickId / recentUsers) * 100
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
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {Array.isArray(monthlyData) &&
                  monthlyData.map((month, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(month.month).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {month.total}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {month.with_clickid}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {month.total > 0
                          ? `${Math.round(
                              (month.with_clickid / month.total) * 100
                            )}%`
                          : "0%"}
                      </td>
                    </tr>
                  ))}
                {(!Array.isArray(monthlyData) || monthlyData.length === 0) && (
                  <tr>
                    <td
                      colSpan={4}
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
                    {totalUsers}
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
                    {usersWithClickId} (
                    {totalUsers > 0
                      ? Math.round((usersWithClickId / totalUsers) * 100)
                      : 0}
                    %)
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-700">
                <div
                  style={{
                    width: `${
                      totalUsers > 0 ? (usersWithClickId / totalUsers) * 100 : 0
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
                    Paid Conversions
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-gray-300">
                    {paidUsersWithClickId} (
                    {usersWithClickId > 0
                      ? Math.round(
                          (paidUsersWithClickId / usersWithClickId) * 100
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
                      usersWithClickId > 0
                        ? (paidUsersWithClickId / usersWithClickId) * 100
                        : 0
                    }%`,
                  }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-500"
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
                  {totalUsers > 0
                    ? Math.round((usersWithClickId / totalUsers) * 100)
                    : 0}
                  %
                </p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Conversion Rate</p>
                <p className="text-xl font-bold">
                  {usersWithClickId > 0
                    ? Math.round(
                        (paidUsersWithClickId / usersWithClickId) * 100
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
