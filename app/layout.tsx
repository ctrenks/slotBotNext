import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthContext from "./components/SessionProvider";
import AuthWrapper from "./components/AuthWrapper";
import Header from "./components/Header";
import Footer from "./components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Beat Online Slots",
  description: "Your trusted guide to online slots and casinos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark min-h-screen flex flex-col`}
      >
        <AuthContext>
          <AuthWrapper>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="container mx-auto max-w-[1280px] px-4 flex-grow">
                {children}
              </main>
              <Footer />
            </div>
          </AuthWrapper>
        </AuthContext>
      </body>
    </html>
  );
}
