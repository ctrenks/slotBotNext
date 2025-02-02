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
    const { subscription, userEmail } = await request.json();

    if (!subscription || !userEmail) {
      return NextResponse.json(
        { error: "Missing subscription or user email" },
        { status: 400 }
      );
    }

    // Store or update the push subscription in the database
    await prisma.pushSubscription.upsert({
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error registering push subscription:", error);
    return NextResponse.json(
      { error: "Failed to register push subscription" },
      { status: 500 }
    );
  }
}
