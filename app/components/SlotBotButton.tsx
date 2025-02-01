"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function SlotBotButton({
  className = "",
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  const { data: session } = useSession();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      if (!session?.user?.email) return;

      try {
        const response = await fetch("/api/check-access");
        const data = await response.json();
        setHasAccess(data.hasAccess);
      } catch (error) {
        console.error("Error checking access:", error);
      }
    }

    checkAccess();
  }, [session]);

  if (!hasAccess) return null;

  return (
    <Link
      href="/slotbot"
      onClick={onClick}
      className={`px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-md
      transition-all duration-200 shadow-[0_0_10px_rgba(249,115,22,0.5)]
      hover:shadow-[0_0_20px_rgba(249,115,22,0.7)]
      animate-pulse hover:animate-none ${className}`}
    >
      Slot Bot
    </Link>
  );
}
