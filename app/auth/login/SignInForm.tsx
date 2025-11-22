"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  getStoredClickId,
  clearStoredClickId,
  getStoredOfferCode,
  clearStoredOfferCode,
} from "@/app/utils/urlParams";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [clickId, setClickId] = useState<string | null>(null);
  const [offerCode, setOfferCode] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Get clickId and offerCode from URL params or localStorage on component mount
  useEffect(() => {
    // First check URL parameters (highest priority)
    const urlOfferCode = searchParams.get("offercode");
    if (urlOfferCode) {
      setOfferCode(urlOfferCode);
      console.log("Retrieved offerCode from URL:", urlOfferCode);
      // Store in localStorage for persistence
      localStorage.setItem("offercode", urlOfferCode);
      return;
    }

    // Then check localStorage
    const storedClickId = getStoredClickId();
    if (storedClickId) {
      setClickId(storedClickId);
      console.log("Retrieved clickId for sign-in:", storedClickId);
    }

    const storedOfferCode = getStoredOfferCode();
    if (storedOfferCode) {
      setOfferCode(storedOfferCode);
      console.log("Retrieved offerCode for sign-in:", storedOfferCode);
    }
  }, [searchParams]);

  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Honeypot check - if filled, silently reject
      if (honeypot) {
        console.log("Bot detected via honeypot field");
        setIsLoading(false);
        return;
      }

      // If we have an offer code, store it in sessionStorage for the callback handler
      if (offerCode) {
        sessionStorage.setItem("auth_pending_offercode", offerCode);
        console.log(
          "Stored offerCode in sessionStorage for auth callback:",
          offerCode
        );
      }

      const result = await signIn("resend", {
        email,
        callbackUrl: "/",
        redirect: false,
        clickId: clickId || undefined,
        offerCode: offerCode || undefined,
      });

      console.log("Sign in result:", result);

      if (result?.error) {
        console.error("Sign in error:", result.error);
      } else {
        // Clear the clickId from localStorage after it's been used
        if (clickId) {
          clearStoredClickId();
          console.log("Cleared clickId from localStorage after sign-in");
        }

        // Clear the offerCode from localStorage after it's been used
        if (offerCode) {
          clearStoredOfferCode();
          console.log("Cleared offerCode from localStorage after sign-in");
        }

        window.location.href = "/auth/verify-request";
      }
    } catch (error) {
      console.error("Error during sign in:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // If we have an offer code, store it in sessionStorage for the callback handler
    if (offerCode) {
      sessionStorage.setItem("auth_pending_offercode", offerCode);
      console.log(
        "Stored offerCode in sessionStorage for Google auth callback:",
        offerCode
      );
    }

    signIn("google", {
      callbackUrl: "/",
      clickId: clickId || undefined,
      offerCode: offerCode || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground dark:text-foreground-dark"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-primary/20 bg-background dark:bg-background-dark px-3 py-2 shadow-sm
            focus:border-accent dark:focus:border-accent-dark focus:outline-none focus:ring-1 focus:ring-accent dark:focus:ring-accent-dark
            text-foreground dark:text-foreground-dark"
          />
        </div>
        {/* Honeypot field - hidden from users but visible to bots */}
        <div
          className="absolute"
          style={{
            opacity: 0,
            position: "absolute",
            top: 0,
            left: 0,
            height: 0,
            width: 0,
            zIndex: -1,
          }}
          aria-hidden="true"
        >
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-primary hover:bg-primary/90 dark:bg-accent-dark dark:hover:bg-accent-dark/90
          px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark focus:ring-offset-2
          disabled:opacity-50 transition-colors"
        >
          {isLoading ? "Sending link..." : "Continue with Email"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-primary/20 dark:border-accent-dark/20" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background dark:bg-background-dark px-2 text-foreground/60 dark:text-foreground-dark/60">
            Or continue with
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full rounded-md border border-primary/20 dark:border-accent-dark/20 bg-background dark:bg-background-dark
        px-4 py-2 text-foreground dark:text-foreground-dark hover:bg-primary/5 dark:hover:bg-accent-dark/10
        focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark focus:ring-offset-2 transition-colors"
      >
        <div className="flex items-center justify-center">
          <svg
            className="mr-2 h-4 w-4"
            aria-hidden="true"
            focusable="false"
            data-prefix="fab"
            data-icon="google"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 488 512"
          >
            <path
              fill="currentColor"
              d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
            ></path>
          </svg>
          Continue with Google
        </div>
      </button>
    </div>
  );
}
