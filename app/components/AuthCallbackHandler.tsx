"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthCallbackHandler() {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log("🔍 AuthCallbackHandler: Running on pathname:", pathname);
    console.log("🔍 AuthCallbackHandler: Session status:", status);

    // Only run this when the user is authenticated
    if (status === "authenticated") {
      console.log(
        "🔍 AuthCallbackHandler: User is authenticated, checking for pending offer code"
      );

      // Check if we have a pending offer code from the authentication process
      const pendingOfferCode = sessionStorage.getItem("auth_pending_offercode");

      if (pendingOfferCode) {
        console.log(
          "🔍 AuthCallbackHandler: Found pending offer code after authentication:",
          pendingOfferCode
        );

        // Store it in localStorage for use in the coupon redemption
        localStorage.setItem("offercode", pendingOfferCode);

        // Clear the pending offer code from session storage
        sessionStorage.removeItem("auth_pending_offercode");

        console.log(
          "🔍 AuthCallbackHandler: Transferred offer code to localStorage after authentication"
        );

        // If we're on the homepage, redirect to the pricing page
        if (pathname === "/") {
          console.log(
            "🔍 AuthCallbackHandler: On homepage, redirecting to pricing page with offer code"
          );
          router.push("/pricing");
        } else {
          console.log(
            "🔍 AuthCallbackHandler: Not on homepage, pathname is:",
            pathname,
            "- no redirect"
          );
        }
      } else {
        console.log("🔍 AuthCallbackHandler: No pending offer code found");
      }
    } else {
      console.log(
        "🔍 AuthCallbackHandler: User not authenticated, status:",
        status
      );
    }
  }, [status, pathname, router]);

  // This component doesn't render anything
  return null;
}
