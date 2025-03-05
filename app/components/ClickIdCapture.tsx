"use client";

import { useEffect } from "react";
import {
  storeClickId,
  getUrlParams,
  getStoredReferrer,
} from "../utils/urlParams";

export default function ClickIdCapture() {
  useEffect(() => {
    // Store clickid from URL if present
    storeClickId();

    // Send click tracking data to the API
    const trackClick = async () => {
      try {
        const params = getUrlParams();
        const clickId = params.clickid || null;
        const offerCode = params.offercode || null;
        const referrer = document.referrer || getStoredReferrer() || null;
        const userAgent = navigator.userAgent || null;

        // Skip tracking for internal traffic from our own domain
        if (
          referrer &&
          (referrer.includes("beatonlineslots.com") ||
            referrer.includes("localhost") ||
            referrer.includes("127.0.0.1"))
        ) {
          console.log("Skipping tracking for internal traffic");
          return;
        }

        // Try to get country from localStorage if previously stored
        let geo = localStorage.getItem("user_geo") || null;

        // If geo is not in localStorage, try to get it from the API
        if (!geo) {
          try {
            // Use a free geolocation API to get the country code
            const geoResponse = await fetch("https://ipapi.co/json/");
            if (geoResponse.ok) {
              const geoData = await geoResponse.json();
              geo = geoData.country_code;

              // Store the country code in localStorage for future use
              if (geo) {
                localStorage.setItem("user_geo", geo);
              }
            }
          } catch (geoError) {
            console.error("Error getting geolocation:", geoError);
          }
        }

        // Only track if we have at least one piece of tracking data
        if (clickId || offerCode || referrer) {
          const response = await fetch("/api/track", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              clickId,
              offerCode,
              referrer,
              userAgent,
              geo,
              // We don't include IP here as it will be determined server-side
            }),
          });

          if (!response.ok) {
            console.error("Failed to track click:", await response.text());
          }
        }
      } catch (error) {
        console.error("Error tracking click:", error);
      }
    };

    trackClick();
  }, []);

  // This component doesn't render anything
  return null;
}
