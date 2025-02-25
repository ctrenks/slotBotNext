"use client";

import { useEffect } from "react";
import { storeClickId } from "../utils/urlParams";

export default function ClickIdCapture() {
  useEffect(() => {
    // Store clickid from URL if present
    storeClickId();
  }, []);

  // This component doesn't render anything
  return null;
}
