"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function GeoLocationUpdater() {
  const { data: session, update } = useSession();

  useEffect(() => {
    const updateGeoLocation = async () => {
      // Only proceed if user is logged in and geo is empty
      if (session?.user && !session.user.geo) {
        try {
          // Try to get country from localStorage first
          let geo = localStorage.getItem("user_geo") || null;

          // If geo is not in localStorage, fetch it from the API
          if (!geo) {
            try {
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
              return;
            }
          }

          // If we have a geo location, update the user profile
          if (geo) {
            console.log(`Updating geo location for user to: ${geo}`);

            // Call API to update user's geo location
            const response = await fetch("/api/user/update-geo", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ geo }),
            });

            if (response.ok) {
              // Update the session to reflect the new geo location
              await update({ geo });
              console.log("Geo location updated successfully");
            } else {
              console.error(
                "Failed to update geo location:",
                await response.text()
              );
            }
          }
        } catch (error) {
          console.error("Error updating geo location:", error);
        }
      }
    };

    updateGeoLocation();
  }, [session, update]);

  // This component doesn't render anything
  return null;
}
