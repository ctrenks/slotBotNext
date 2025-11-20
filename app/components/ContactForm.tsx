"use client";

import { useState, useEffect } from "react";
import { submitContactForm } from "@/app/actions/contact";

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string }
      ) => Promise<string>;
    };
  }
}

export function ContactForm() {
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      const token = await window.grecaptcha.execute(
        process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!,
        { action: "submit" }
      );
      formData.append("recaptcha_token", token);
      const result = await submitContactForm(formData);
      setMessage(result.message);
      setIsSuccess(result.success);

      if (result.success) {
        (document.getElementById("contactForm") as HTMLFormElement).reset();
      }
    } catch (error) {
      console.error("reCAPTCHA or form submission error:", error);
      setMessage("An error occurred. Please try again later.");
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 p-6 bg-background dark:bg-background-dark rounded-lg shadow-lg border border-gray-200 dark:border-gray-800">
      <h1 className="text-3xl font-bold text-primary dark:text-accent-dark mb-6 text-center">
        Contact {process.env.NEXT_PUBLIC_SITE_NAME}
      </h1>
      <form id="contactForm" action={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="name"
            className="block text-foreground dark:text-foreground-dark text-sm font-medium mb-2"
          >
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full px-4 py-2 bg-white dark:bg-primary-dark text-foreground dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark transition duration-200"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-foreground dark:text-foreground-dark text-sm font-medium mb-2"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full px-4 py-2 bg-white dark:bg-primary-dark text-foreground dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark transition duration-200"
          />
        </div>
        <div className="mb-6">
          <label
            htmlFor="message"
            className="block text-foreground dark:text-foreground-dark text-sm font-medium mb-2"
          >
            Message
          </label>
          <textarea
            id="message"
            name="message"
            required
            className="w-full px-4 py-2 bg-white dark:bg-primary-dark text-foreground dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark transition duration-200 h-32 resize-none"
          ></textarea>
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
          <label htmlFor="website">Website</label>
          <input
            type="text"
            id="website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-accent hover:bg-accent/90 dark:bg-accent-dark dark:hover:bg-accent-dark/90 text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent dark:focus:ring-accent-dark transition duration-200 disabled:opacity-50"
        >
          {isSubmitting ? "Sending..." : "Send Message"}
        </button>
        {message && (
          <div
            className={`mt-4 p-3 rounded-lg ${
              isSuccess
                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
            }`}
          >
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
