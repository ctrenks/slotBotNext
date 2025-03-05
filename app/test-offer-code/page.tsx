"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStoredOfferCode } from "@/app/utils/urlParams";
import OfferCodeCapture from "@/app/components/OfferCodeCapture";

export default function TestOfferCodePage() {
  const [offerCode, setOfferCode] = useState<string | null>(null);

  useEffect(() => {
    // Get the stored offer code
    const storedOfferCode = getStoredOfferCode();
    setOfferCode(storedOfferCode);
  }, []);

  // Refresh the displayed offer code when the component is clicked
  const refreshOfferCode = () => {
    const storedOfferCode = getStoredOfferCode();
    setOfferCode(storedOfferCode);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Capture offer code from URL */}
      <OfferCodeCapture />

      <h1 className="text-3xl font-bold mb-6">Offer Code Test Page</h1>

      <div className="bg-black p-6 rounded-lg border border-[#00ff00] mb-8">
        <h2 className="text-xl font-bold mb-4">Current Stored Offer Code</h2>
        {offerCode ? (
          <p className="text-[#00ff00]">
            Offer Code: <strong>{offerCode}</strong>
          </p>
        ) : (
          <p className="text-yellow-500">No offer code is currently stored.</p>
        )}
        <button
          onClick={refreshOfferCode}
          className="mt-4 bg-black text-[#00ff00] border border-[#00ff00] px-4 py-1 rounded hover:bg-[#00ff00] hover:text-black transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="bg-black p-6 rounded-lg border border-[#00ff00] mb-8">
        <h2 className="text-xl font-bold mb-4">Test Links</h2>
        <ul className="space-y-4">
          <li>
            <Link
              href="/test-offer-code?offercode=TEST123"
              className="text-[#00ff00] underline hover:text-white"
            >
              Test with offer code TEST123
            </Link>
          </li>
          <li>
            <Link
              href="/test-offer-code?offercode=BIGYEAR"
              className="text-[#00ff00] underline hover:text-white"
            >
              Test with offer code BIGYEAR
            </Link>
          </li>
          <li>
            <Link
              href="/pricing?offercode=TEST123"
              className="text-[#00ff00] underline hover:text-white"
            >
              Go to pricing page with offer code TEST123
            </Link>
          </li>
        </ul>
      </div>

      <div className="mt-8">
        <Link
          href="/pricing"
          className="bg-black text-[#00ff00] border border-[#00ff00] px-6 py-2 rounded-lg hover:bg-[#00ff00] hover:text-black transition-colors"
        >
          Go to Pricing Page
        </Link>
      </div>
    </div>
  );
}
