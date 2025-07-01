"use client";

import { useState } from "react";
import SlotWinForm from "@/app/components/SlotWinForm";
import SlotWinDisplay from "@/app/components/SlotWinDisplay";

export default function SlotWinsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFormSuccess = () => {
    // Refresh the display when a new win is submitted
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎰 Community Slot Wins
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Share your amazing slot machine wins with the community! Upload
            screenshots of your big wins and celebrate your success. Your wins
            will be visible immediately for everyone to see and celebrate with
            you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <SlotWinForm onSuccess={handleFormSuccess} />
            </div>
          </div>

          {/* Right Column - Display */}
          <div className="lg:col-span-2">
            <SlotWinDisplay key={refreshKey} />
          </div>
        </div>
      </div>
    </div>
  );
}
