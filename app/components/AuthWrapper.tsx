"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const publicPaths = ["/auth/login", "/"];

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

    const isPublicPath = publicPaths.includes(pathname);

    if (!session && !isPublicPath) {
      router.push("/auth/login");
    }
  }, [session, status, pathname, router]);

  return <>{children}</>;
}
