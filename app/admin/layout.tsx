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
    const adminAccess = await isAdmin();
    console.log("🔍 Admin Layout: isAdmin() result:", adminAccess);

    if (!adminAccess) {
      console.log("❌ Admin Layout: Access denied, redirecting to homepage");
      redirect("/");
    }

    console.log("✅ Admin Layout: Access granted, rendering admin content");
  } catch (error) {
    console.error("💥 Admin Layout: Error during auth check:", error);
    redirect("/");
  }

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
