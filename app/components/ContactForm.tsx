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
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-size-3xl text-blue-700 text-center">
        Contact AFC Media llc
      </h1>
      <form id="contactForm" action={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="name"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Name:
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Email:
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="mb-6">
          <label
            htmlFor="message"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Message:
          </label>
          <textarea
            id="message"
            name="message"
            required
            className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500 h-32 resize-none"
          ></textarea>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300"
        >
          Send Message
        </button>
        {message && (
          <p
            className={`mt-4 p-2 rounded-lg ${
              isSuccess
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
