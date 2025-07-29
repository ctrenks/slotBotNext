"use client";

import { useState } from "react";
import { useAdminAccess } from "@/app/hooks/useAdminAccess";

interface UserFilter {
  referralCode?: string;
  isPaid?: boolean;
  noCode?: boolean;
}

export default function AdminMessagePage() {
  const { isAdmin, loading } = useAdminAccess();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<UserFilter>({});
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  // Preview how many users will receive the message
  const handlePreview = async () => {
    try {
      const response = await fetch("/api/admin/message/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filter }),
      });

      if (!response.ok) {
        throw new Error("Failed to get preview count");
      }

      const data = await response.json();
      setPreviewCount(data.count);
    } catch (error) {
      setResult(
        error instanceof Error ? error.message : "Failed to get preview"
      );
    }
  };

  // Send the message to filtered users
  const handleSend = async () => {
    if (!subject || !message) {
      setResult("Subject and message are required");
      return;
    }

    try {
      setSending(true);
      setResult(null);

      const response = await fetch("/api/admin/message/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          message,
          filter,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send messages");
      }

      const data = await response.json();
      setResult(`Successfully sent to ${data.sentCount} users`);
      setSubject("");
      setMessage("");
      setPreviewCount(null);
    } catch (error) {
      setResult(
        error instanceof Error ? error.message : "Failed to send messages"
      );
    } finally {
      setSending(false);
    }
  };

  // Show loading while checking admin access
  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  // Only allow admin access
  if (!isAdmin) {
    return (
      <div className="p-4 text-red-500">
        You do not have permission to access this page.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Send Messages to Users</h1>

      {/* Filters */}
      <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium mb-1">
              Referral Code
            </label>
            <input
              type="text"
              value={filter.referralCode || ""}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  referralCode: e.target.value,
                  noCode: false, // Reset noCode when entering a referral code
                })
              }
              className="w-full p-2 border rounded"
              placeholder="Enter referral code"
              disabled={filter.noCode}
            />
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="noCode"
                checked={filter.noCode || false}
                onChange={(e) =>
                  setFilter({
                    ...filter,
                    noCode: e.target.checked,
                    referralCode: e.target.checked ? "" : filter.referralCode, // Clear referral code when checking noCode
                  })
                }
                className="rounded"
              />
              <label htmlFor="noCode" className="text-sm text-gray-600">
                Users with no referral code
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Subscription Status
            </label>
            <select
              value={
                filter.isPaid === undefined ? "" : filter.isPaid.toString()
              }
              onChange={(e) =>
                setFilter({
                  ...filter,
                  isPaid:
                    e.target.value === ""
                      ? undefined
                      : e.target.value === "true",
                })
              }
              className="w-full p-2 border rounded"
            >
              <option value="">All Users</option>
              <option value="true">Paid Users</option>
              <option value="false">Free Users</option>
            </select>
          </div>
        </div>
        <button
          onClick={handlePreview}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Preview Count
        </button>
        {previewCount !== null && (
          <p className="text-sm text-gray-600">
            This message will be sent to {previewCount} users
          </p>
        )}
      </div>

      {/* Message Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter email subject"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-2 border rounded h-40"
            placeholder="Enter email message"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleSend}
          disabled={sending || !subject || !message}
          className="px-6 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {sending ? "Sending..." : "Send Message"}
        </button>
      </div>

      {/* Result Message */}
      {result && (
        <div
          className={`p-4 rounded ${
            result.includes("Success")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {result}
        </div>
      )}
    </div>
  );
}
