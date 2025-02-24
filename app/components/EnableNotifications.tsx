"use client";

import { useEffect, useState } from "react";
import { useNotifications } from "../hooks/useNotifications";
import { Button } from "./ui/button";
import { isMobile } from "react-device-detect";

interface EnableNotificationsProps {
  context?: "header" | "mobile-menu" | "banner";
}

export default function EnableNotifications({
  context,
}: EnableNotificationsProps) {
  const [mounted, setMounted] = useState(false);
  const { permission, isSupported, requestPermission } = useNotifications();
  const [isIOS, setIsIOS] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if device is iOS
    const isIOSDevice =
      typeof window !== "undefined" &&
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as { MSStream?: boolean }).MSStream;
    setIsIOS(isIOSDevice);

    // Check if running as PWA
    const isStandalone =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as { standalone?: boolean }).standalone === true ||
        document.referrer.includes("ios-app://"));
    setIsPWA(isStandalone);
  }, []);

  if (!mounted || !isSupported || permission === "granted") {
    return null;
  }

  // For iOS devices not in PWA mode, show instructions
  if (isIOS && !isPWA) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
        <p className="font-bold">Enable Notifications on iOS</p>
        <p>
          To receive notifications, please add this website to your home screen
          and open it from there.
        </p>
      </div>
    );
  }

  // Show banner variant at the top of the page
  if (context === "banner") {
    return (
      <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">
        <p className="font-bold">Enable Notifications</p>
        <p className="mb-2">
          Get instant alerts when new slots become available.
        </p>
        <Button
          onClick={requestPermission}
          variant="outline"
          className="bg-blue-500 text-white hover:bg-blue-600"
        >
          Enable Notifications
        </Button>
      </div>
    );
  }

  // Show button variant in header/mobile menu based on device type
  if (
    (context === "header" && !isMobile) ||
    (context === "mobile-menu" && isMobile)
  ) {
    return (
      <Button onClick={requestPermission} variant="outline">
        Enable Notifications
      </Button>
    );
  }

  return null;
}
