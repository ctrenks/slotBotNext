"use client";

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SafeAreaStyles from "./components/SafeAreaStyles";
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Beat Online Slots",
  description: "Beat Online Slots",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <SafeAreaStyles />
        <ServiceWorkerRegistration />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
