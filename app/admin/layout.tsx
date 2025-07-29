import { redirect } from "next/navigation";
import { ReactNode } from "react";
import Link from "next/link";
import { isAdmin } from "@/app/utils/auth";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  console.log("🔍 Admin Layout: Starting authorization check...");

  try {
    console.log("🔍 Admin Layout: About to call isAdmin()");
    const adminAccess = await isAdmin();
    console.log("🔍 Admin Layout: isAdmin() result:", adminAccess);

    if (!adminAccess) {
      console.log(
        "❌ Admin Layout: Access denied, showing debug info instead of redirecting"
      );
      return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
          <h1 className="text-2xl font-bold text-red-400 mb-4">
            Admin Access Denied
          </h1>
          <div className="bg-red-900 p-4 rounded-lg border border-red-700">
            <p className="text-white mb-2">You do not have admin access.</p>
            <p className="text-gray-300 mb-4">Debug Info:</p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• isAdmin() returned: {String(adminAccess)}</li>
              <li>• Check server logs for detailed authorization flow</li>
              <li>
                • Visit{" "}
                <a
                  href="/api/debug-admin"
                  className="text-blue-400 hover:underline"
                >
                  /api/debug-admin
                </a>{" "}
                for detailed session info
              </li>
            </ul>
            <a
              href="/"
              className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Go to Homepage
            </a>
          </div>
        </div>
      );
    }

    console.log("✅ Admin Layout: Access granted, rendering admin content");
  } catch (error) {
    console.error("💥 Admin Layout: Error during auth check:", error);
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-2xl font-bold text-red-400 mb-4">
          Admin Access Error
        </h1>
        <div className="bg-red-900 p-4 rounded-lg border border-red-700">
          <p className="text-white mb-2">Error during authorization check.</p>
          <p className="text-gray-300 mb-4">Error Details:</p>
          <p className="text-sm text-gray-300 mb-4">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <a
            href="/api/debug-admin"
            className="inline-block mr-4 text-blue-400 hover:underline"
          >
            Debug API
          </a>
          <a
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }
  console.log("🔍 Admin Layout: About to render layout JSX");

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-gray-900 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <Link href="/admin" className="hover:text-green-400">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/admin/affiliate" className="hover:text-green-400">
                  Affiliates
                </Link>
              </li>
              <li>
                <Link href="/admin/clicks" className="hover:text-green-400">
                  Click Tracking
                </Link>
              </li>
              <li>
                <Link href="/admin/alerts" className="hover:text-green-400">
                  Alerts
                </Link>
              </li>
              <li>
                <Link href="/admin/slot-wins" className="hover:text-green-400">
                  User Wins
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main className="flex-grow bg-gray-900 text-white">{children}</main>
    </div>
  );
}
