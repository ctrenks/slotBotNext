import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/prisma";
import Link from "next/link";
import UserTable from "./UserTable";

export const metadata: Metadata = {
  title: "Affiliate User Management",
  description: "Manage users with affiliate tracking information",
};

export default async function AffiliateUserManagementPage() {
  const session = await auth();

  // Check if user is admin
  // Check if user is admin
  const isAdmin =
    session?.user?.email === "chris@trenkas.com" ||
    session?.user?.email === "carringtoncenno180@gmail.com" ||
    session?.user?.email === "ranrev.info@gmail.com";
  if (!isAdmin) {
    redirect("/");
  }

  // Fetch users with clickId information
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      clickId: true,
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
      paid: true,
      updatedAt: true,
      geo: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Fetch users active in the last 24 hours (based on updatedAt)
  const activeInLast24Hours = await prisma.user.findMany({
    where: {
      updatedAt: {
        gte: twentyFourHoursAgo,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      paid: true,
      geo: true,
      updatedAt: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Count users with clickId
  const usersWithClickId = users.filter((user) => user.clickId).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Affiliate User Management</h1>
        <Link
          href="/admin/affiliate"
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white font-medium"
        >
          Back to Affiliate Dashboard
        </Link>
      </div>

      {/* Recently Authenticated Users Section */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 text-green-400">
          Recently Authenticated Users (Last 15 Minutes)
        </h2>
        <div className="mb-4">
          <span className="text-2xl font-bold text-green-300">
            {recentlyAuthenticated.length}
          </span>
          <span className="text-gray-400 ml-2">
            users authenticated recently
          </span>
        </div>
        {recentlyAuthenticated.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Last Login
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {recentlyAuthenticated.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium">
                          {user.name || "No Name"}
                        </div>
                        <div className="text-sm text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.paid
                            ? "bg-green-800 text-green-100"
                            : "bg-yellow-800 text-yellow-100"
                        }`}
                      >
                        {user.paid ? "Paid" : "Free"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.updatedAt && (
                        <span className="text-green-400">
                          {new Date(user.updatedAt).toLocaleString()}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400">
            No users authenticated in the last 15 minutes.
          </p>
        )}
      </div>

      {/* Active Users in Last 24 Hours Section */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 text-blue-400">
          Active Users (Last 24 Hours)
        </h2>
        <div className="mb-4">
          <span className="text-2xl font-bold text-blue-300">
            {activeInLast24Hours.length}
          </span>
          <span className="text-gray-400 ml-2">
            users active in last 24 hours
          </span>
        </div>
        {activeInLast24Hours.length > 0 ? (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Last Activity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {activeInLast24Hours.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium">
                          {user.name || "No Name"}
                        </div>
                        <div className="text-sm text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.paid
                            ? "bg-green-800 text-green-100"
                            : "bg-yellow-800 text-yellow-100"
                        }`}
                      >
                        {user.paid ? "Paid" : "Free"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-700 text-gray-300">
                        {user.geo || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.updatedAt && (
                        <span className="text-blue-400">
                          {new Date(user.updatedAt).toLocaleString()}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400">No users active in the last 24 hours.</p>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Total Users</h3>
            <p className="text-3xl font-bold">{users.length}</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Users with ClickID</h3>
            <p className="text-3xl font-bold">{usersWithClickId}</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Conversion Rate</h3>
            <p className="text-3xl font-bold">
              {users.length > 0
                ? `${Math.round((usersWithClickId / users.length) * 100)}%`
                : "0%"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <UserTable
          users={users}
          currentUserEmail={session?.user?.email || ""}
        />
      </div>
    </div>
  );
}
