import { redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/app/utils/auth";

export const metadata: Metadata = {
  title: "Affiliate Management",
  description: "Manage affiliate settings, alerts, and users",
};

export default async function AffiliateManagementPage() {
  // Check if user is admin
  if (!(await isAdmin())) {
    redirect("/");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Affiliate Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Alerts Management Card */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold mb-3">Alert Management</h2>
          <p className="text-gray-300 mb-4">
            Create and manage alerts for affiliate promotions and offers.
          </p>
          <Link
            href="/admin/alerts"
            className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-medium"
          >
            Manage Alerts
          </Link>
        </div>

        {/* Postback Settings Card */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold mb-3">Postback Settings</h2>
          <p className="text-gray-300 mb-4">
            Configure postback URLs and settings for affiliate networks.
          </p>
          <Link
            href="/admin/affiliates"
            className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-medium"
          >
            Configure Postbacks
          </Link>
        </div>

        {/* Click Tracking Card */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold mb-3">Click Tracking</h2>
          <p className="text-gray-300 mb-4">
            View and analyze inbound traffic data including IP, referrer,
            clickID, and offer codes.
          </p>
          <Link
            href="/admin/clicks"
            className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-medium"
          >
            View Click Data
          </Link>
        </div>

        {/* User Management Card */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold mb-3">User Management</h2>
          <p className="text-gray-300 mb-4">
            View and manage users with affiliate tracking information.
          </p>
          <Link
            href="/admin/affiliate/users"
            className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-medium"
          >
            Manage Users
          </Link>
        </div>

        {/* Statistics Card */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold mb-3">Affiliate Statistics</h2>
          <p className="text-gray-300 mb-4">
            View conversion statistics and performance metrics.
          </p>
          <Link
            href="/admin/affiliate/stats"
            className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-medium"
          >
            View Statistics
          </Link>
        </div>

        {/* Documentation Card */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold mb-3">Affiliate Tracking</h2>
          <p className="text-gray-300 mb-4">
            View documentation on how to use the affiliate tracking system.
          </p>
          <a
            href="/docs/affiliate-tracking.html"
            target="_blank"
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium"
          >
            View Documentation
          </a>
        </div>

        {/* Offer Code Documentation Card */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold mb-3">Offer Code Tracking</h2>
          <p className="text-gray-300 mb-4">
            View documentation on how to use the offer code tracking system.
          </p>
          <a
            href="/docs/offer-code-tracking.html"
            target="_blank"
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium"
          >
            View Documentation
          </a>
        </div>

        {/* Click Tracking Documentation Card */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold mb-3">Click Tracking System</h2>
          <p className="text-gray-300 mb-4">
            View documentation on how the click tracking system works.
          </p>
          <a
            href="/docs/click-tracking.html"
            target="_blank"
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium"
          >
            View Documentation
          </a>
        </div>
      </div>
    </div>
  );
}
