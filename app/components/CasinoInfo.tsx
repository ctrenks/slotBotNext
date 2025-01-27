"use client";

import { useState } from "react";

interface CasinoBonusProps {
  information: string;
}

export default function CasinoInfo({ information }: CasinoBonusProps) {
  const [showInfo, setShowInfo] = useState(false);

  if (!information) return null;

  return (
    <>
      <div className="col-start-1 col-span-1 sm:col-span-1 w-full sm:w-24">
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="w-full sm:w-24 h-10 px-4 bg-gradient-to-r from-[#f9d90a] to-[#dc7d11] text-white rounded-md border border-[#dc7d11] hover:from-[#dc7d11] hover:to-[#f9d90a] transition-colors flex items-center justify-center gap-2 hover:translate-y-[-1px] active:translate-y-[1px] transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <svg
            className={`w-5 h-5 transition-transform ${
              showInfo ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
          Info
        </button>
      </div>

      {showInfo && (
        <div className="col-span-3 row-start-2 mt-4">
          <div className="w-full p-4 bg-gray-50 rounded-md border border-gray-200 text-sm text-gray-700 animate-slideDown shadow-lg">
            <div className="prose prose-sm max-w-none">{information}</div>
          </div>
        </div>
      )}
    </>
  );
}
