import { NextResponse } from "next/server";
import { prisma } from "@/prisma";
import webpush from "web-push";

interface NotificationResult {
  success: boolean;
  endpoint: string;
  error?: string;
}

// Configure web-push with your VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: Request) {
  try {
    console.log("Starting notification send process");
    const { userEmail, message } = await request.json();
    console.log("Message to notify:", { userEmail, message });

    if (!userEmail || !message) {
      console.log("Missing required fields:", { userEmail, message });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get all push subscriptions for the user
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userEmail: userEmail,
      },
    });
    console.log(
      `Found ${subscriptions.length} push subscriptions for user ${userEmail}`
    );

    if (!subscriptions.length) {
      console.log("No push subscriptions found for user:", userEmail);
      return NextResponse.json(
        { error: "No push subscriptions found for user" },
        { status: 404 }
      );
    }

    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          console.log(
            "Attempting to send push notification to endpoint:",
            subscription.endpoint
          );

          // Prepare notification payload
          const payload = {
            title: "New SlotBot Message", // Clear title for notification
            body: message.message || message, // Support both object and string formats
            data: {
              id: message.id, // If message is an object with ID
              url: "/slotbot",
              timestamp: new Date().toISOString(),
              messageData: message, // Store full message data for reference
            },
          };

          console.log("Push notification payload:", payload);

          const pushResult = await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            JSON.stringify(payload)
          );
          console.log("Push notification sent successfully:", pushResult);
          return { success: true, endpoint: subscription.endpoint };
        } catch (error: unknown) {
          console.error("Error sending push notification:", error);
          // If subscription is expired or invalid, delete it
          if (error && typeof error === "object" && "statusCode" in error) {
            const webPushError = error as { statusCode?: number };
            console.log(
              "Push subscription error status code:",
              webPushError.statusCode
            );
            if (
              webPushError.statusCode === 404 ||
              webPushError.statusCode === 410
            ) {
              console.log(
                "Deleting invalid push subscription:",
                subscription.endpoint
              );
              await prisma.pushSubscription.delete({
                where: {
                  userEmail_endpoint: {
                    userEmail: subscription.userEmail,
                    endpoint: subscription.endpoint,
                  },
                },
              });
            }
          }
          return {
            success: false,
            endpoint: subscription.endpoint,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    const successCount = results.filter(
      (r) => r.status === "fulfilled" && (r.value as NotificationResult).success
    ).length;
    console.log(
      `Successfully sent ${successCount} out of ${results.length} push notifications`
    );

    return NextResponse.json({
      results,
      successCount,
    });
  } catch (error) {
    console.error("Error in push notification process:", error);
    return NextResponse.json(
      { error: "Failed to send push notification" },
      { status: 500 }
    );
  }
}
