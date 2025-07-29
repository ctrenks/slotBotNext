import { redirect } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/prisma";
import Link from "next/link";
import UserTable from "./UserTable";
import { isAdmin } from "@/app/utils/auth";

export const metadata: Metadata = {
  title: "Affiliate User Management",
  description: "Manage users with affiliate tracking information",
};

export default async function AffiliateUserManagementPage() {
  // Check if user is admin
  if (!(await isAdmin())) {
    redirect("/");
  }

  try {
    // Fetch users with clickId information
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        clickId: true,
        offerCode: true,
        createdAt: true,
        paid: true,
        refferal: true,
        _count: {
          select: {
            alertClicks: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Limit to 100 most recent users
    });

    // Calculate time thresholds
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Fetch recently authenticated users (last 15 minutes) - using updatedAt as activity indicator
    const recentlyAuthenticated = await prisma.user.findMany({
      where: {
        updatedAt: {
          gte: fifteenMinutesAgo,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        refferal: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 20,
    });

    // Fetch users active in the last 24 hours
    const recentlyActive = await prisma.user.findMany({
      where: {
        updatedAt: {
          gte: twentyFourHoursAgo,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        refferal: true,
        clickId: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 50,
    });

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Affiliate User Management
          </h1>
          <p className="text-gray-400">
            Manage users with affiliate tracking information and monitor recent
            activity
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              Total Users
            </h3>
            <p className="text-3xl font-bold text-white">{users.length}</p>
            <p className="text-sm text-gray-400">users with tracking data</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              Recently Active (24h)
            </h3>
            <p className="text-3xl font-bold text-blue-400">
              {recentlyActive.length}
            </p>
            <p className="text-sm text-gray-400">
              users active in last 24 hours
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              Recent Activity (15m)
            </h3>
            <p className="text-3xl font-bold text-green-400">
              {recentlyAuthenticated.length}
            </p>
            <p className="text-sm text-gray-400">
              users authenticated recently
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex space-x-4 mb-6">
          <Link
            href="/admin/affiliate"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            ← Back to Affiliate Management
          </Link>
          <Link
            href="/admin/affiliate/stats"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            View Statistics
          </Link>
        </div>

        {/* Recently Active Users (24h) - Now at the top */}
        {recentlyActive.length > 0 && (
          <div className="mb-8 bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">
                Recently Active Users (Last 24 Hours)
              </h2>
              <p className="text-gray-400 mt-1">
                {recentlyActive.length} users active in the last 24 hours
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentlyActive.map((user) => (
                  <div
                    key={user.id}
                    className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="text-white font-medium">
                          {user.name || "No Name"}
                        </h4>
                        <p className="text-gray-400 text-sm truncate">
                          {user.email}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(user.updatedAt).toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Coupon Code and Click ID Display */}
                    <div className="space-y-1 mb-3">
                      {user.refferal && (
                        <div className="flex items-center">
                          <span className="text-xs text-gray-400 mr-2">
                            Coupon:
                          </span>
                          <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded">
                            {user.refferal}
                          </span>
                        </div>
                      )}
                      {user.clickId && (
                        <div className="flex items-center">
                          <span className="text-xs text-gray-400 mr-2">
                            Click ID:
                          </span>
                          <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded">
                            {user.clickId}
                          </span>
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/admin/affiliate/users/${user.id}`}
                      className="inline-block text-blue-400 hover:text-blue-300 text-sm"
                    >
                      View Details →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Table - Full list below recently active */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">
              All Users with Tracking Information
            </h2>
            <p className="text-gray-400 mt-1">
              Showing {users.length} users with affiliate tracking data
            </p>
          </div>
          <div className="p-6">
            <UserTable users={users} currentUserEmail="" />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in affiliate users page:", error);
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-red-400 mb-4">
          Error Loading Users
        </h1>
        <div className="bg-red-900 p-4 rounded-lg border border-red-700">
          <p className="text-white">
            Unable to load affiliate users. Please try again later.
          </p>
          <p className="text-gray-300 mt-2">
            Error: {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <Link
            href="/admin/affiliate"
            className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            ← Back to Affiliate Management
          </Link>
        </div>
      </div>
    );
  }
}
