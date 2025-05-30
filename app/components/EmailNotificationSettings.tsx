"use client";

import { useState } from "react";

interface EmailNotificationSettingsProps {
  userId: string;
  currentSetting: boolean;
}

export default function EmailNotificationSettings({
  userId,
  currentSetting,
}: EmailNotificationSettingsProps) {
  const [emailNotifications, setEmailNotifications] = useState(currentSetting);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleToggle = async () => {
    setIsUpdating(true);
    setMessage(null);

    try {
      const response = await fetch("/api/user/email-notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailNotifications: !emailNotifications,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update email notification settings");
      }

      setEmailNotifications(!emailNotifications);
      setMessage({
        type: "success",
        text: `Email notifications ${
          !emailNotifications ? "enabled" : "disabled"
        } successfully!`,
      });
    } catch (error) {
      console.error("Error updating email notifications:", error);
      setMessage({
        type: "error",
        text: "Failed to update email notification settings. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            SlotBot Alert Emails
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Receive email notifications when new SlotBot alerts are published
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={isUpdating}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
            emailNotifications ? "bg-green-600" : "bg-gray-200"
          } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <span className="sr-only">Toggle email notifications</span>
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              emailNotifications ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
              : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="text-sm text-gray-600 dark:text-gray-400">
        <p>
          <strong>Note:</strong> You will continue to receive alerts in the app
          and push notifications even if email notifications are disabled. This
          setting only affects email delivery.
        </p>
        <p className="mt-2">
          You can also unsubscribe from emails using the link in any alert
          email.
        </p>
      </div>
    </div>
  );
}
