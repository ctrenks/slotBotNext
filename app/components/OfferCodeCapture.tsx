"use client";

import { useEffect } from "react";
import { getUrlParams } from "../utils/urlParams";

export default function OfferCodeCapture() {
  useEffect(() => {
    // Store offercode from URL if present
    if (typeof window === "undefined") return;

    const params = getUrlParams();
    if (params.offercode) {
      localStorage.setItem("offercode", params.offercode);
      console.log("Stored offercode:", params.offercode);
    }
  }, []);

  // This component doesn't render anything
  return null;
}
