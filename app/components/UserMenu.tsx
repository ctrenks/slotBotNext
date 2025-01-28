"use client";

import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menu = document.getElementById("user-menu");
      if (menu && !menu.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading" || !session?.user) return null;

  const user = session.user;

  return (
    <div className="relative" id="user-menu">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-foreground dark:text-foreground-dark hover:text-primary dark:hover:text-accent-dark transition-colors"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden relative">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name || "User"}
              fill
              className="object-cover"
              priority
              key={user.image} // Force re-render when image changes
            />
          ) : (
            <div className="w-full h-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                {(user.name || user.email || "U")[0].toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-background dark:bg-background-dark border border-primary/10 dark:border-accent-dark/10">
          <div className="py-1">
            <Link
              href="/myprofile"
              className="block px-4 py-2 text-foreground dark:text-foreground-dark hover:bg-primary/5 dark:hover:bg-accent-dark/10"
              onClick={() => setIsOpen(false)}
            >
              My Profile
            </Link>
            <button
              onClick={() => signOut()}
              className="block w-full px-4 py-2 text-left text-foreground dark:text-foreground-dark hover:bg-primary/5 dark:hover:bg-accent-dark/10"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
