"use client";

import { updateName } from "../actions/user";
import { useState } from "react";

export function UsernameForm() {
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (formData: FormData) => {
    try {
      await updateName(formData);
      setMessage({ type: "success", text: "Username updated successfully!" });
    } catch (error) {
      console.error("Failed to update username:", error);
      setMessage({
        type: "error",
        text: "Failed to update username. Please try again.",
      });
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-background dark:bg-background-dark rounded-lg shadow-lg border border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-bold text-primary dark:text-accent-dark mb-6">
        Update Profile
      </h2>
      <form action={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="username"
            className="block text-foreground dark:text-foreground-dark text-sm font-medium mb-2"
          >
            New Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            placeholder="Enter new username"
            required
            className="w-full px-4 py-2 bg-white dark:bg-primary-dark text-foreground dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark transition duration-200"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-accent hover:bg-accent/90 dark:bg-accent-dark dark:hover:bg-accent-dark/90 text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent dark:focus:ring-accent-dark transition duration-200"
        >
          Update Username
        </button>
      </form>
      {message && (
        <div
          className={`mt-4 p-3 rounded-lg ${
            message.type === "success"
              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
              : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
