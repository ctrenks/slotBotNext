"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getStoredClickId, clearStoredClickId } from "@/app/utils/urlParams";

export default function SignInButtons() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [clickId, setClickId] = useState<string | null>(null);

  useEffect(() => {
    // Get stored clickId from localStorage
    const storedClickId = getStoredClickId();
    if (storedClickId) {
      setClickId(storedClickId);
      console.log("Retrieved clickId for sign-in:", storedClickId);
    }
  }, []);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Include clickId in the sign-in call
      const result = await signIn("resend", {
        email,
        redirect: false,
        clickId: clickId || undefined,
      });

      console.log("Sign in result:", result);

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        // Clear the clickId from localStorage after it's been used
        if (clickId) {
          clearStoredClickId();
          console.log("Cleared clickId from localStorage after sign-in");
        }
        router.replace("/auth/verify-request");
      }
    } catch (e) {
      console.error("Sign in exception:", e);
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Include clickId in the sign-in call
    signIn("google", {
      callbackUrl: "/",
      clickId: clickId || undefined,
    });

    // Clear the clickId from localStorage after it's been used
    if (clickId) {
      clearStoredClickId();
      console.log("Cleared clickId from localStorage after Google sign-in");
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-red-500 text-sm text-center mb-4">{error}</div>
      )}

      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full rounded-md border border-primary/20 dark:border-accent-dark/20
            bg-background dark:bg-background-dark px-4 py-2
            text-foreground dark:text-foreground-dark
            focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-primary hover:bg-primary/90
          dark:bg-accent-dark dark:hover:bg-accent-dark/90
          px-4 py-2 text-white focus:outline-none focus:ring-2
          focus:ring-accent dark:focus:ring-accent-dark focus:ring-offset-2
          transition-colors disabled:opacity-50"
        >
          {isLoading ? "Sending..." : "Continue with Email"}
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
        onClick={handleGoogleSignIn}
        className="w-full rounded-md border border-primary/20 dark:border-accent-dark/20
        bg-background dark:bg-background-dark px-4 py-2
        text-foreground dark:text-foreground-dark hover:bg-primary/5
        dark:hover:bg-accent-dark/10 focus:outline-none focus:ring-2
        focus:ring-accent dark:focus:ring-accent-dark focus:ring-offset-2
        transition-colors"
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
