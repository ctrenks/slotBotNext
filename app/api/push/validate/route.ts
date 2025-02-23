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
    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    }

    // Find the subscription in the database
    const subscription = await prisma.pushSubscription.findFirst({
      where: {
        endpoint: endpoint,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { valid: false, reason: "Subscription not found" },
        { status: 200 }
      );
    }

    // Try to send a test notification
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        JSON.stringify({ type: "validation" })
      );

      return NextResponse.json({ valid: true });
    } catch (error: unknown) {
      // If we get a 404 or 410, the subscription is invalid
      if (error && typeof error === "object" && "statusCode" in error) {
        const webPushError = error as { statusCode?: number };
        if (
          webPushError.statusCode === 404 ||
          webPushError.statusCode === 410
        ) {
          // Delete the invalid subscription
          await prisma.pushSubscription.delete({
            where: {
              userEmail_endpoint: {
                userEmail: subscription.userEmail,
                endpoint: subscription.endpoint,
              },
            },
          });
          return NextResponse.json(
            { valid: false, reason: "Subscription expired" },
            { status: 200 }
          );
        }
      }

      // For other errors, consider the subscription valid but log the error
      console.error("Error validating subscription:", error);
      return NextResponse.json({ valid: true });
    }
  } catch (error) {
    console.error("Error in subscription validation:", error);
    return NextResponse.json(
      { error: "Failed to validate subscription" },
      { status: 500 }
    );
  }
}
