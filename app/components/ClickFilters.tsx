"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface ClickFiltersProps {
  availableGeos: string[];
  availableOfferCodes: string[];
}

export default function ClickFilters({
  availableGeos,
  availableOfferCodes,
}: ClickFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial filter values from URL
  const initialGeo = searchParams.get("geo") || "";
  const initialCode = searchParams.get("code") || "";

  const [geoFilter, setGeoFilter] = useState(initialGeo);
  const [codeFilter, setCodeFilter] = useState(initialCode);

  // Apply filters when form is submitted
  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();

    // Build the query string
    const params = new URLSearchParams();
    if (geoFilter) params.set("geo", geoFilter);
    if (codeFilter) params.set("code", codeFilter);

    // Navigate to the filtered URL
    router.push(
      `/admin/clicks${params.toString() ? `?${params.toString()}` : ""}`
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setGeoFilter("");
    setCodeFilter("");
    router.push("/admin/clicks");
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-md mb-8">
      <h2 className="text-xl font-bold mb-4">Filter Results</h2>

      <form onSubmit={applyFilters} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Geo Filter */}
          <div>
            <label htmlFor="geoFilter" className="block mb-2">
              Country (GEO)
            </label>
            <select
              id="geoFilter"
              value={geoFilter}
              onChange={(e) => setGeoFilter(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
            >
              <option value="">All Countries</option>
              {availableGeos.map((geo) => (
                <option key={geo} value={geo}>
                  {geo}
                </option>
              ))}
            </select>
          </div>

          {/* Offer Code Filter */}
          <div>
            <label htmlFor="codeFilter" className="block mb-2">
              Offer Code
            </label>
            <select
              id="codeFilter"
              value={codeFilter}
              onChange={(e) => setCodeFilter(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
            >
              <option value="">All Offer Codes</option>
              {availableOfferCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition-colors"
          >
            Clear Filters
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 rounded hover:bg-green-500 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </form>
    </div>
  );
}
