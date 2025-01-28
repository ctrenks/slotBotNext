"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import type { User } from "next-auth";

interface UserMenuProps {
  user: User & {
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-foreground dark:text-foreground-dark hover:text-primary dark:hover:text-accent-dark transition-colors"
      >
        <span>{user.email}</span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-background dark:bg-background-dark border border-primary/10 dark:border-accent-dark/10">
          <div className="py-1">
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
