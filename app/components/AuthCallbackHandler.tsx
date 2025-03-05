"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthCallbackHandler() {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only run this when the user is authenticated
    if (status === "authenticated") {
      // Check if we have a pending offer code from the authentication process
      const pendingOfferCode = sessionStorage.getItem("auth_pending_offercode");

      if (pendingOfferCode) {
        console.log(
          "Found pending offer code after authentication:",
          pendingOfferCode
        );

        // Store it in localStorage for use in the coupon redemption
        localStorage.setItem("offercode", pendingOfferCode);

        // Clear the pending offer code from session storage
        sessionStorage.removeItem("auth_pending_offercode");

        console.log(
          "Transferred offer code to localStorage after authentication"
        );

        // If we're on the homepage, redirect to the pricing page
        if (pathname === "/") {
          console.log("Redirecting to pricing page with offer code");
          router.push("/pricing");
        }
      }
    }
  }, [status, pathname, router]);

  // This component doesn't render anything
  return null;
}
