import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/prisma";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Affiliate User Management",
  description: "Manage users with affiliate tracking information",
};

export default async function AffiliateUserManagementPage() {
  const session = await auth();

  // Check if user is admin
  if (session?.user?.email !== "chris@trenkas.com") {
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
      offerCode: true,
      _count: {
        select: {
          clickTracks: true,
        }
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100, // Limit to 100 most recent users
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  User
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  ClickID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Coupon Code
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Registration Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Paid Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Clicks
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium">
                          {user.name || "No Name"}
                        </div>
                        <div className="text-sm text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {user.clickId ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-800 text-green-100">
                          {user.clickId}
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-700 text-gray-300">
                          No ClickID
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {user.offerCode ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-800 text-blue-100">
                          {user.offerCode}
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-700 text-gray-300">
                          No Code
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
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
                      {user._count.clickTracks} clicks
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {user.clickId && (
                      <a
                        href={`/api/postback?clickid=${user.clickId}`}
                        target="_blank"
                        className="text-green-400 hover:text-green-300 mr-4"
                      >
                        Send Postback
                      </a>
                    )}
                    <Link
                      href={`/admin/affiliate/users/${user.id}`}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      View Details
                    </Link>
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
