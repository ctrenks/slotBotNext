import Link from "next/link";
import { auth } from "@/auth";
import UserMenu from "./UserMenu";
import type { User } from "next-auth";

export default async function Header() {
  const session = await auth();

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

          <div className="flex items-center space-x-4">
            {session?.user ? (
              <UserMenu
                user={
                  session.user as User & {
                    email?: string | null;
                    name?: string | null;
                    image?: string | null;
                  }
                }
              />
            ) : (
              <Link
                href="/auth/signin"
                className="rounded-md bg-primary hover:bg-primary/90 dark:bg-accent-dark dark:hover:bg-accent-dark/90
                px-4 py-2 text-white transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
