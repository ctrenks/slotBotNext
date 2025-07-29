import { prisma } from "@/prisma";
import Link from "next/link";

export default async function AdminPage() {
  // Get user statistics
  const totalUsers = await prisma.user.count();
  const paidUsers = await prisma.user.count({ where: { paid: true } });
  const trialUsers = await prisma.user.count({
    where: { trial: { not: null } },
  });

  // Get users from last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentUsers = await prisma.user.count({
    where: { createdAt: { gte: thirtyDaysAgo } },
  });

  // Get click tracking statistics
  const totalClicks = await prisma.clickTrack.count();
  const recentClicks = await prisma.clickTrack.count({
    where: { createdAt: { gte: thirtyDaysAgo } },
  });
  const conversions = await prisma.clickTrack.count({
    where: { convertedToUser: true },
  });

  // Get alert statistics
  const totalAlerts = await prisma.alert.count();
  const activeAlerts = await prisma.alert.count({
    where: {
      startTime: { lte: new Date() },
      endTime: { gte: new Date() },
    },
  });

  // Get slot wins statistics
  const totalSlotWins = await prisma.slotWin.count();
  const pendingWins = await prisma.slotWin.count({
    where: { approved: false },
  });
  const featuredWins = await prisma.slotWin.count({
    where: { featured: true },
  });

  // Get affiliate statistics
  const usersWithAffiliateCode = await prisma.user.count({
    where: {
      OR: [{ clickId: { not: null } }, { offerCode: { not: null } }],
    },
  });

  const conversionRate =
    totalClicks > 0 ? ((conversions / totalClicks) * 100).toFixed(2) : "0";
  const paidUserRate =
    totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(2) : "0";

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* User Statistics */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-blue-400">
          User Management
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium text-gray-300">Total Users</h3>
            <p className="text-3xl font-bold text-white">{totalUsers}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium text-gray-300">Paid Users</h3>
            <p className="text-3xl font-bold text-green-400">{paidUsers}</p>
            <p className="text-sm text-gray-400">{paidUserRate}% conversion</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium text-gray-300">Trial Users</h3>
            <p className="text-3xl font-bold text-yellow-400">{trialUsers}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium text-gray-300">
              New Users (30d)
            </h3>
            <p className="text-3xl font-bold text-purple-400">{recentUsers}</p>
          </div>
        </div>
      </div>

      {/* Click Tracking Statistics */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-purple-400">
          Click Tracking
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium text-gray-300">Total Clicks</h3>
            <p className="text-3xl font-bold text-white">{totalClicks}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium text-gray-300">
              Recent Clicks (30d)
            </h3>
            <p className="text-3xl font-bold text-blue-400">{recentClicks}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium text-gray-300">Conversions</h3>
            <p className="text-3xl font-bold text-green-400">{conversions}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium text-gray-300">
              Conversion Rate
            </h3>
            <p className="text-3xl font-bold text-green-400">
              {conversionRate}%
            </p>
          </div>
        </div>
      </div>

      {/* Alerts & Slot Wins */}
      <div className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Alerts */}
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-green-400">
              Alerts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-medium text-gray-300">
                  Total Alerts
                </h3>
                <p className="text-2xl font-bold text-white">{totalAlerts}</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-medium text-gray-300">Active</h3>
                <p className="text-2xl font-bold text-green-400">
                  {activeAlerts}
                </p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-center">
                <Link
                  href="/admin/alerts"
                  className="text-green-400 hover:text-green-300 font-medium"
                >
                  Manage Alerts →
                </Link>
              </div>
            </div>
          </div>

          {/* Slot Wins */}
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-orange-400">
              Slot Wins
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-medium text-gray-300">
                  Total Wins
                </h3>
                <p className="text-2xl font-bold text-white">{totalSlotWins}</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-medium text-gray-300">Pending</h3>
                <p className="text-2xl font-bold text-yellow-400">
                  {pendingWins}
                </p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-medium text-gray-300">Featured</h3>
                <p className="text-2xl font-bold text-orange-400">
                  {featuredWins}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Affiliate Statistics */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-cyan-400">
          Affiliate Tracking
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium text-gray-300">
              Affiliate Users
            </h3>
            <p className="text-3xl font-bold text-cyan-400">
              {usersWithAffiliateCode}
            </p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium text-gray-300">
              Affiliate Rate
            </h3>
            <p className="text-3xl font-bold text-cyan-400">
              {totalUsers > 0
                ? ((usersWithAffiliateCode / totalUsers) * 100).toFixed(1)
                : "0"}
              %
            </p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-center">
            <Link
              href="/admin/affiliate"
              className="text-cyan-400 hover:text-cyan-300 font-medium"
            >
              View Affiliates →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-red-400">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/clicks"
            className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-purple-500 transition-colors text-center"
          >
            <h3 className="text-lg font-medium text-purple-400">
              Click Tracking
            </h3>
            <p className="text-gray-300">View detailed click data</p>
          </Link>
          <Link
            href="/admin/message"
            className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-red-500 transition-colors text-center"
          >
            <h3 className="text-lg font-medium text-red-400">Send Messages</h3>
            <p className="text-gray-300">Email users</p>
          </Link>
          <Link
            href="/admin/slot-wins"
            className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-orange-500 transition-colors text-center"
          >
            <h3 className="text-lg font-medium text-orange-400">Review Wins</h3>
            <p className="text-gray-300">Approve slot wins</p>
          </Link>
          <Link
            href="/admin/affiliate/stats"
            className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-cyan-500 transition-colors text-center"
          >
            <h3 className="text-lg font-medium text-cyan-400">
              Affiliate Stats
            </h3>
            <p className="text-gray-300">Detailed analytics</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
