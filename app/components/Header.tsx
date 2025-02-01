import Link from "next/link";
import HeaderUserSection from "./HeaderUserSection";
import MobileMenu from "./MobileMenu";
import SlotBotButton from "./SlotBotButton";
import EnableNotifications from "./EnableNotifications";

export default function Header() {
  const menuItems = [
    { name: "Trial", href: "/trial" },
    { name: "Pricing", href: "/pricing" },
    { name: "Betting Guide", href: "/betting-guide" },
  ];
  return (
    <header className="border-b border-primary/10 dark:border-accent-dark/10 bg-background dark:bg-background-dark shadow-sm">
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
            <EnableNotifications />
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
