"use client";

import { useState, useEffect } from "react";
import { savePostbackUrl, getPostbackUrl } from "@/app/utils/affiliates";

export default function AffiliateSettingsManager() {
  const [postbackUrl, setPostbackUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const url = await getPostbackUrl();
        setPostbackUrl(url || "");
      } catch (error) {
        console.error("Error fetching postback URL:", error);
        setMessage({
          type: "error",
          text: "Failed to load current settings",
        });
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await savePostbackUrl(postbackUrl);
      setMessage({
        type: "success",
        text: "Postback URL saved successfully",
      });
    } catch (error) {
      console.error("Error saving postback URL:", error);
      setMessage({
        type: "error",
        text: "Failed to save postback URL",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Affiliate Postback Settings</h2>

      {message.text && (
        <div
          className={`mb-4 p-3 rounded ${
            message.type === "success"
              ? "bg-green-800 text-green-100"
              : "bg-red-800 text-red-100"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="postbackUrl"
            className="block text-sm font-medium mb-1"
          >
            Postback URL
          </label>
          <input
            id="postbackUrl"
            type="text"
            value={postbackUrl}
            onChange={(e) => setPostbackUrl(e.target.value)}
            placeholder="http://ad.propellerads.com/conversion.php?aid=3781363&pid=&tid=141360&visitor_id=${SUBID}&payout=${PAYOUT}"
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
          />
          <p className="mt-1 text-sm text-gray-400">
            Use {"${SUBID}"} as a placeholder for the clickid and {"${PAYOUT}"}{" "}
            for the conversion amount
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-medium disabled:opacity-50"
        >
          {isLoading ? "Saving..." : "Save Settings"}
        </button>
      </form>

      <div className="mt-8">
        <h3 className="text-xl font-bold mb-2">How to Use</h3>
        <div className="bg-gray-700 p-4 rounded-md">
          <p className="mb-2">
            1. Set your postback URL above with the correct placeholders
          </p>
          <p className="mb-2">
            2. Create affiliate links with the clickid parameter:
          </p>
          <code className="block bg-gray-900 p-2 rounded mb-4">
            https://yourdomain.com/?clickid=AFFILIATE_ID_123
          </code>
          <p className="mb-2">
            3. When a conversion happens, the system will send a postback to:
          </p>
          <code className="block bg-gray-900 p-2 rounded">
            {postbackUrl &&
              postbackUrl
                .replace(/\${SUBID}/g, "AFFILIATE_ID_123")
                .replace(/\${PAYOUT}/g, "10.00")}
          </code>
        </div>
      </div>
    </div>
  );
}
