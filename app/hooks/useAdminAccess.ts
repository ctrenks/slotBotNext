"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function useAdminAccess() {
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdminAccess() {
      if (!session?.user?.email) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/check-admin-access");
        const data = await response.json();
        setIsAdmin(data.isAdmin);
      } catch (error) {
        console.error("Error checking admin access:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdminAccess();
  }, [session]);

  return { isAdmin, loading };
}
