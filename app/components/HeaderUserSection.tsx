"use client";

import Link from "next/link";
import UserMenu from "./UserMenu";
import UserMenuSkeleton from "./UserMenuSkeleton";
import { useSession } from "next-auth/react";
import { Suspense } from "react";

export default function HeaderUserSection() {
  const { data: session, status } = useSession();

  return (
    <div className="flex items-center space-x-4">
      <Suspense fallback={<UserMenuSkeleton />}>
        {status === "loading" ? (
          <UserMenuSkeleton />
        ) : session?.user ? (
          <UserMenu />
        ) : (
          <Link
            href="/auth/signin"
            className="rounded-md bg-primary hover:bg-primary/90 dark:bg-accent-dark dark:hover:bg-accent-dark/90
            px-4 py-2 text-white transition-colors"
          >
            Sign In
          </Link>
        )}
      </Suspense>
    </div>
  );
}
