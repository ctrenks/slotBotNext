import { NextResponse } from "next/server";
import { prisma } from "@/prisma";
import webpush from "web-push";

// Configure web-push with your VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: Request) {
  try {
    console.log("Starting push subscription registration");
    const { subscription, userEmail } = await request.json();
    console.log("Registration data:", {
      userEmail,
      endpoint: subscription?.endpoint,
      hasKeys: !!subscription?.keys,
    });

    if (!subscription || !userEmail) {
      console.log("Missing required data:", {
        hasSubscription: !!subscription,
        hasEmail: !!userEmail,
      });
      return NextResponse.json(
        { error: "Missing subscription or user email" },
        { status: 400 }
      );
    }

    // Validate subscription object
    if (
      !subscription.endpoint ||
      !subscription.keys?.auth ||
      !subscription.keys?.p256dh
    ) {
      console.log("Invalid subscription object:", subscription);
      return NextResponse.json(
        { error: "Invalid subscription format" },
        { status: 400 }
      );
    }

    console.log("Storing subscription in database");
    // Store or update the push subscription in the database
    const result = await prisma.pushSubscription.upsert({
      where: {
        userEmail_endpoint: {
          userEmail,
          endpoint: subscription.endpoint,
        },
      },
      update: {
        auth: subscription.keys.auth,
        p256dh: subscription.keys.p256dh,
        lastUpdated: new Date(),
      },
      create: {
        userEmail,
        endpoint: subscription.endpoint,
        auth: subscription.keys.auth,
        p256dh: subscription.keys.p256dh,
        lastUpdated: new Date(),
      },
    });
    console.log("Subscription stored successfully:", {
      userEmail: result.userEmail,
      endpoint: result.endpoint,
      lastUpdated: result.lastUpdated,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error registering push subscription:", error);
    return NextResponse.json(
      { error: "Failed to register push subscription" },
      { status: 500 }
    );
  }
}
