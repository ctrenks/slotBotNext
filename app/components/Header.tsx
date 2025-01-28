import Link from "next/link";
import HeaderUserSection from "./HeaderUserSection";

export default function Header() {
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

          <nav className="hidden md:flex space-x-8">
            <Link
              href="/casinos"
              className="text-foreground/80 dark:text-foreground-dark/80 hover:text-primary dark:hover:text-accent-dark transition-colors"
            >
              Casinos
            </Link>
            <Link
              href="/slots"
              className="text-foreground/80 dark:text-foreground-dark/80 hover:text-primary dark:hover:text-accent-dark transition-colors"
            >
              Slots
            </Link>
            <Link
              href="/software"
              className="text-foreground/80 dark:text-foreground-dark/80 hover:text-primary dark:hover:text-accent-dark transition-colors"
            >
              Software
            </Link>
          </nav>

          <HeaderUserSection />
        </div>
      </div>
    </header>
  );
}
