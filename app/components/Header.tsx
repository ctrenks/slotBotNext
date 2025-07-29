"use client";

import Link from "next/link";
import HeaderUserSection from "./HeaderUserSection";
import MobileMenu from "./MobileMenu";
import SlotBotButton from "./SlotBotButton";
import { useAdminAccess } from "@/app/hooks/useAdminAccess";

export default function Header() {
  const { isAdmin } = useAdminAccess();

  const menuItems = [
    { name: "Trial", href: "/trial" },
    { name: "Pricing", href: "/pricing" },
    { name: "Betting Guide", href: "/betting-guide" },
    { name: "User Guide", href: "/howto" },
    { name: "Slot Wins", href: "/slot-wins" },
  ];
  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 border-b border-gray-200">
      <style jsx>{`
        @supports (padding-top: env(safe-area-inset-top)) {
          header {
            padding-top: env(safe-area-inset-top);
          }
          @media all and (display-mode: standalone) {
            header {
              position: fixed;
              padding-top: env(safe-area-inset-top);
            }
          }
        }
      `}</style>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold text-primary dark:text-accent-dark"
          >
            Beat Online Slots
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-foreground/80 dark:text-foreground-dark/80 hover:text-primary dark:hover:text-accent-dark transition-colors"
              >
                {item.name}
              </Link>
            ))}
            <SlotBotButton />
            {isAdmin && (
              <>
                <Link
                  href="/admin/alerts"
                  className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Alerts
                </Link>
                <Link
                  href="/admin/affiliate"
                  className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Affiliate
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center gap-4">
            <MobileMenu items={menuItems} />
            <HeaderUserSection />
          </div>
        </div>
      </div>
    </header>
  );
}
