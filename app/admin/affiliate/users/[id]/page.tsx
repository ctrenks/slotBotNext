import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "User Details",
  description: "View and manage user details",
};

export default async function Page({
  params,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const session = await auth();

  // Check if user is admin
  if (session?.user?.email !== "chris@trenkas.com") {
    redirect("/");
  }

  // Fetch user details
  const user = await prisma.user.findUnique({
    where: {
      id: id,
    },
    include: {
      accounts: true,
      clickTracks: {
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
    },
  });

  if (!user) {
    notFound();
  }

  // Fetch alerts for this user
  const alerts = await prisma.alertRecipient.findMany({
    where: {
      userId: user.id,
    },
    include: {
      alert: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  // Fetch alert clicks for this user
  const alertClicks = await prisma.alertClick.findMany({
    where: {
      userId: user.id,
    },
    include: {
      alert: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">User Details</h1>
        <div className="flex space-x-4">
          <Link
            href="/admin/affiliate/users"
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white font-medium"
          >
            Back to Users
          </Link>
          <Link
            href="/admin/affiliate"
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white font-medium"
          >
            Affiliate Dashboard
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 col-span-2">
          <h2 className="text-xl font-bold mb-4">User Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Name</p>
              <p className="text-lg">{user.name || "No Name"}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Email</p>
              <p className="text-lg">{user.email}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Registration Date</p>
              <p className="text-lg">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Last Updated</p>
              <p className="text-lg">
                {new Date(user.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Paid Status</p>
              <p className="text-lg">
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.paid
                      ? "bg-green-800 text-green-100"
                      : "bg-yellow-800 text-yellow-100"
                  }`}
                >
                  {user.paid ? "Paid" : "Free"}
                </span>
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Location</p>
              <p className="text-lg">
                {user.location || user.geo || "Unknown"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Affiliate Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm">ClickID</p>
              {user.clickId ? (
                <div className="flex items-center space-x-2">
                  <p className="text-lg font-mono bg-gray-700 px-2 py-1 rounded">
                    {user.clickId}
                  </p>
                  <a
                    href={`/api/postback?clickid=${user.clickId}`}
                    target="_blank"
                    className="text-xs bg-green-700 hover:bg-green-600 px-2 py-1 rounded text-white"
                  >
                    Send Postback
                  </a>
                </div>
              ) : (
                <p className="text-lg text-gray-400">No ClickID</p>
              )}
            </div>
            <div>
              <p className="text-gray-400 text-sm">Coupon Code</p>
              <p className="text-lg">{user.refferal || "None"}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Affiliate Code</p>
              <p className="text-lg">{user.affiliate || "None"}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Authentication</p>
              <div className="space-y-1">
                {user.accounts.map((account) => (
                  <p key={account.provider} className="text-sm">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-800 text-blue-100">
                      {account.provider}
                    </span>
                  </p>
                ))}
                {user.accounts.length === 0 && (
                  <p className="text-sm text-gray-400">Email only</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Recent Alerts</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Alert
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Read
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {alerts.map((recipient) => (
                <tr key={recipient.id}>
                  <td className="px-6 py-4">
                    <p className="text-sm">{recipient.alert.message}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(recipient.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        recipient.read
                          ? "bg-green-800 text-green-100"
                          : "bg-yellow-800 text-yellow-100"
                      }`}
                    >
                      {recipient.read ? "Read" : "Unread"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 mt-8">
        <h2 className="text-xl font-bold mb-4">Alert Clicks</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Alert
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Location
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {alertClicks.map((click) => (
                <tr key={click.id}>
                  <td className="px-6 py-4">
                    <p className="text-sm">
                      {click.alert?.message || "Direct Casino Click"}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(click.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-700 text-gray-300">
                      {click.geo || "Unknown"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 mt-8">
        <h2 className="text-xl font-bold mb-4">Click History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Click ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Location
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Referrer
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {user.clickTracks.map((click) => (
                <tr key={click.id}>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-800 text-blue-100">
                      {click.clickId || "No ID"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(click.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-700 text-gray-300">
                      {click.geo || "Unknown"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {click.referrer || "Direct"}
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
