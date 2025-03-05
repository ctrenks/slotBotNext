"use client";

import { useRef, useState, useEffect } from "react";
import { redeemCoupon } from "@/app/actions/coupon";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  getStoredOfferCode,
  clearStoredOfferCode,
} from "@/app/utils/urlParams";

export default function CouponRedemption() {
  const { data: session } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [couponCode, setCouponCode] = useState("");
  const [checkedForOfferCode, setCheckedForOfferCode] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      if (!session?.user?.email) return;

      try {
        const response = await fetch("/api/check-access");
        const data = await response.json();
        setHasAccess(data.hasAccess);
      } catch (error) {
        console.error("Error checking access:", error);
      }
    }

    checkAccess();
  }, [session]);

  // Check for stored offer code and autofill the coupon field
  useEffect(() => {
    if (checkedForOfferCode) return;

    const storedOfferCode = getStoredOfferCode();
    if (storedOfferCode) {
      console.log("Autofilling coupon code with offer code:", storedOfferCode);
      setCouponCode(storedOfferCode.toUpperCase());
    }

    setCheckedForOfferCode(true);
  }, [checkedForOfferCode]);

  // Return null if user has access (paid or trial)
  if (hasAccess) {
    return null;
  }

  async function onSubmit(formData: FormData) {
    // Convert code to uppercase before submission
    formData.set("code", couponCode.toUpperCase());
    const result = await redeemCoupon(formData);

    if (result.error) {
      setMessage({ text: result.error, isError: true });
    } else if (result.success) {
      // Clear the stored offer code after successful redemption
      clearStoredOfferCode();

      setMessage({ text: result.message!, isError: false });
      setCouponCode("");
      formRef.current?.reset();

      // Add a small delay before redirecting to allow the user to see the success message
      if (result.redirect) {
        setTimeout(() => {
          // Force a router refresh to update the navigation
          router.refresh();
          // Then redirect to the slotbot page
          router.push(result.redirect);
        }, 1500);
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCouponCode(e.target.value.toUpperCase());
  };

  return (
    <div className="max-w-md mx-auto bg-black rounded-lg p-6 border border-[#00ff00]">
      <h2 className="text-2xl font-bold mb-4">Redeem Coupon</h2>
      <form ref={formRef} action={onSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="code"
            className="block text-sm font-medium text-[#00ff00]"
          >
            Coupon Code
          </label>
          <input
            type="text"
            id="code"
            name="code"
            value={couponCode}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded bg-black border-[#00ff00] text-[#00ff00] shadow-sm
                     focus:border-[#00ff00] focus:ring-[#00ff00] placeholder-[#00ff00]/50"
            placeholder="Enter your coupon code"
            required
          />
        </div>

        {message && (
          <div
            className={`p-3 rounded ${
              message.isError
                ? "bg-black text-red-500 border border-red-500"
                : "bg-black text-[#00ff00] border border-[#00ff00]"
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-[#00ff00] rounded text-sm font-medium
            bg-black text-[#00ff00] hover:bg-[#00ff00] hover:text-black
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00ff00] focus:ring-offset-black
            transition-colors duration-200"
        >
          Redeem Coupon
        </button>
      </form>
    </div>
  );
}
