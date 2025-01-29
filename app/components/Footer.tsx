import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-primary/10 dark:border-accent-dark/10 bg-background dark:bg-background-dark">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-primary dark:text-accent-dark mb-4">
              About Us
            </h3>
            <p className="text-foreground/70 dark:text-foreground-dark/70">
              Beat Online Slots is an AI bot to give you information, there is
              NO Gambling here, informational only data.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-primary dark:text-accent-dark mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/trial"
                  className="text-foreground/70 dark:text-foreground-dark/70 hover:text-primary dark:hover:text-accent-dark transition-colors"
                >
                  Trial
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-foreground/70 dark:text-foreground-dark/70 hover:text-primary dark:hover:text-accent-dark transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/betting-guide"
                  className="text-foreground/70 dark:text-foreground-dark/70 hover:text-primary dark:hover:text-accent-dark transition-colors"
                >
                  Betting Guide
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-primary dark:text-accent-dark mb-4">
              Legal
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-foreground/70 dark:text-foreground-dark/70 hover:text-primary dark:hover:text-accent-dark transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-foreground/70 dark:text-foreground-dark/70 hover:text-primary dark:hover:text-accent-dark transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-primary dark:text-accent-dark mb-4">
              Contact
            </h3>
            <p className="text-foreground/70 dark:text-foreground-dark/70">
              Have questions? Get in touch with us.
            </p>
            <Link
              href="/contact"
              className="inline-block mt-2 text-primary dark:text-accent-dark hover:underline"
            >
              Contact Us
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-primary/10 dark:border-accent-dark/10 text-center text-foreground/60 dark:text-foreground-dark/60">
          <p>
            © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_SITE_NAME}.
            All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
