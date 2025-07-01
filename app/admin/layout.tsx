import { auth } from "@/auth";

import { redirect } from "next/navigation";

import { ReactNode } from "react";
import Link from "next/link";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await auth();

  if (!session?.user) {
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
