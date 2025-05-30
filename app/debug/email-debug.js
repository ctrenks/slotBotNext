// Debug script to check email notification system
// Run this in the browser console on your site

async function debugEmailSystem() {
  console.log("=== Email Notification System Debug ===");

  // Check environment variables (client-side accessible ones)
  console.log("1. Environment Check:");
  console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL || "Not set");

  // Check if user is logged in
  console.log("\n2. User Session Check:");
  try {
    const sessionResponse = await fetch("/api/auth/session");
    const session = await sessionResponse.json();
    console.log("User logged in:", !!session?.user);
    console.log("User email:", session?.user?.email || "Not found");
  } catch (error) {
    console.error("Error checking session:", error);
  }

  // Check user's email notification setting
  console.log("\n3. User Email Notification Setting:");
  try {
    const userResponse = await fetch("/api/user/email-notifications", {
      method: "GET",
    });
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log("Email notifications enabled:", userData.emailNotifications);
    } else {
      console.log("Could not fetch user email settings");
    }
  } catch (error) {
    console.error("Error checking email settings:", error);
  }

  // Check recent alerts
  console.log("\n4. Recent Alerts Check:");
  try {
    const alertsResponse = await fetch("/api/alerts/check", {
      method: "POST",
    });
    if (alertsResponse.ok) {
      const alertsData = await alertsResponse.json();
      console.log("Active alerts count:", alertsData.alerts?.length || 0);
      if (alertsData.alerts?.length > 0) {
        console.log("Most recent alert:", {
          id: alertsData.alerts[0].id,
          message: alertsData.alerts[0].message.substring(0, 50) + "...",
          casinoName: alertsData.alerts[0].casinoName,
          read: alertsData.alerts[0].read,
        });
      }
    } else {
      console.log("Could not fetch alerts");
    }
  } catch (error) {
    console.error("Error checking alerts:", error);
  }

  console.log("\n=== Debug Complete ===");
  console.log("If you created an alert and no email was sent, check:");
  console.log("1. Server logs for email sending attempts");
  console.log("2. RESEND_API_KEY environment variable on server");
  console.log("3. User's email notification setting");
  console.log("4. Alert targeting criteria (geo/referral codes)");
}

// Auto-run the debug
debugEmailSystem();
