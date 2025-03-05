"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { ClickTrack } from "@prisma/client";

export default function ClicksTable() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [clicks, setClicks] = useState<ClickTrack[]>([]);
  const [activeFilters, setActiveFilters] = useState<{
    geo?: string;
    code?: string;
  }>({});

  // Get filter values from URL
  useEffect(() => {
    const geo = searchParams.get("geo");
    const code = searchParams.get("code");

    setActiveFilters({
      geo: geo || undefined,
      code: code || undefined,
    });

    fetchClickData(geo, code);
  }, [searchParams]);

  // Fetch click data with filters
  const fetchClickData = async (geo?: string | null, code?: string | null) => {
    setLoading(true);
    try {
      // Build query string for API request
      const params = new URLSearchParams();
      if (geo) params.set("geo", geo);
      if (code) params.set("code", code);

      const response = await fetch(`/api/clicks?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch click data");
      }

      const data = await response.json();
      setClicks(data.data || []);
    } catch (error) {
      console.error("Error fetching click data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-md">
      <h2 className="text-xl font-bold mb-4">
        {Object.keys(activeFilters).some(
          (key) => activeFilters[key as keyof typeof activeFilters]
        )
          ? "Filtered Clicks"
          : "Recent Clicks"}
      </h2>

      {/* Active Filters Display */}
      {(activeFilters.geo || activeFilters.code) && (
        <div className="mb-4 p-3 bg-gray-700 rounded-lg">
          <h3 className="text-sm font-bold mb-2">Active Filters:</h3>
          <div className="flex flex-wrap gap-2">
            {activeFilters.geo && (
              <div className="bg-blue-600 px-3 py-1 rounded-full text-sm">
                Country: {activeFilters.geo}
              </div>
            )}
            {activeFilters.code && (
              <div className="bg-purple-600 px-3 py-1 rounded-full text-sm">
                Offer Code: {activeFilters.code}
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">IP</th>
                <th className="text-left py-2">Country</th>
                <th className="text-left py-2">Referrer</th>
                <th className="text-left py-2">ClickID</th>
                <th className="text-left py-2">Offer Code</th>
                <th className="text-left py-2">Converted</th>
              </tr>
            </thead>
            <tbody>
              {clicks.length > 0 ? (
                clicks.map((click) => (
                  <tr key={click.id} className="border-b border-gray-700">
                    <td className="py-2">
                      {new Date(click.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2">{click.ip || "-"}</td>
                    <td className="py-2">{click.geo || "-"}</td>
                    <td className="py-2 max-w-xs truncate">
                      {click.referrer || "-"}
                    </td>
                    <td className="py-2">{click.clickId || "-"}</td>
                    <td className="py-2">{click.offerCode || "-"}</td>
                    <td className="py-2">
                      {click.convertedToUser ? (
                        <span className="text-green-500">Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-gray-400">
                    No clicks found with the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
