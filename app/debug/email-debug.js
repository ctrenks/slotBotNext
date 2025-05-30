// Debug script to check email notification system
// Run this in the browser console on your site

async function debugEmailSystem() {
  console.log("=== Email Notification System Debug ===");

  // Check timezone information
  console.log("0. Timezone Information:");
  const now = new Date();
  console.log("Current local time:", now.toLocaleString());
  console.log("Current UTC time:", now.toISOString());
  console.log("Timezone offset (minutes):", now.getTimezoneOffset());
  console.log("Timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Check if user is logged in
  console.log("\n1. User Session Check:");
  try {
    const sessionResponse = await fetch("/api/auth/session");
    const session = await sessionResponse.json();
    console.log("User logged in:", !!session?.user);
    console.log("User email:", session?.user?.email || "Not found");
  } catch (error) {
    console.error("Error checking session:", error);
  }

  // Check user's email notification setting
  console.log("\n2. User Email Notification Setting:");
  try {
    const userResponse = await fetch("/api/user/email-notifications", {
      method: "GET",
    });
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log("Email notifications enabled:", userData.emailNotifications);
    } else {
      console.log(
        "Could not fetch user email settings - Status:",
        userResponse.status
      );
      const errorText = await userResponse.text();
      console.log("Error response:", errorText);
    }
  } catch (error) {
    console.error("Error checking email settings:", error);
  }

  // Check recent alerts
  console.log("\n3. Recent Alerts Check:");
  try {
    const alertsResponse = await fetch("/api/alerts/check", {
      method: "POST",
    });
    if (alertsResponse.ok) {
      const alertsData = await alertsResponse.json();
      console.log("Active alerts count:", alertsData.length || 0);
      if (alertsData.length > 0) {
        console.log("Most recent alert:", {
          id: alertsData[0].id,
          message: alertsData[0].message.substring(0, 50) + "...",
          startTime: new Date(alertsData[0].startTime).toLocaleString(),
          endTime: new Date(alertsData[0].endTime).toLocaleString(),
          read: alertsData[0].read,
        });
      }
    } else {
      console.log("Could not fetch alerts - Status:", alertsResponse.status);
      const errorText = await alertsResponse.text();
      console.log("Error response:", errorText);
    }
  } catch (error) {
    console.error("Error checking alerts:", error);
  }

  // Check all alerts in database (admin only)
  console.log("\n4. All Alerts Check (if admin):");
  try {
    const allAlertsResponse = await fetch("/api/admin/alerts", {
      method: "GET",
    });
    if (allAlertsResponse.ok) {
      const allAlerts = await allAlertsResponse.json();
      console.log("Total alerts in database:", allAlerts.length || 0);
      if (allAlerts.length > 0) {
        const recentAlert = allAlerts[0];
        console.log("Most recent alert in DB:", {
          id: recentAlert.id,
          message: recentAlert.message.substring(0, 50) + "...",
          startTime: new Date(recentAlert.startTime).toLocaleString(),
          endTime: new Date(recentAlert.endTime).toLocaleString(),
          startTimeUTC: new Date(recentAlert.startTime).toISOString(),
          endTimeUTC: new Date(recentAlert.endTime).toISOString(),
          isCurrentlyActive:
            now >= new Date(recentAlert.startTime) &&
            now <= new Date(recentAlert.endTime),
          recipients: recentAlert.recipients?.length || 0,
        });
      }
    } else {
      console.log(
        "Could not fetch all alerts (not admin or endpoint doesn't exist)"
      );
    }
  } catch (error) {
    console.log("Could not fetch all alerts:", error.message);
  }

  // Check current page URL
  console.log("\n5. Current Page Info:");
  console.log("Current URL:", window.location.href);
  console.log("Is on profile page:", window.location.pathname === "/myprofile");

  console.log("\n=== Debug Complete ===");
  console.log("If you created an alert and no email was sent, check:");
  console.log("1. Server logs for email sending attempts");
  console.log("2. User's email notification setting (should be true)");
  console.log("3. Alert targeting criteria (geo/referral codes)");
  console.log(
    "4. Alert timing - check if alert is currently active based on timezone"
  );
  console.log("5. Make sure you match the alert targeting criteria");
  console.log("\nNext steps:");
  console.log("- Go to /myprofile to check email notification setting");
  console.log(
    "- Create a test alert with 'all' for both geo and referral targeting"
  );
  console.log("- Check server logs during alert creation");
  console.log("- Verify alert start/end times are correct for your timezone");
}

// Auto-run the debug
debugEmailSystem();
