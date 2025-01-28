"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

// Only these routes require authentication
const restrictedRoutes = ["/myprofile", "/dashboard"];

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    const isRestrictedRoute = restrictedRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (!session && isRestrictedRoute) {
      router.push("/auth/login");
    }
  }, [session, status, pathname, router]);

  return <>{children}</>;
}
