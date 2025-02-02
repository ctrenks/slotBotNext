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
    const { userEmail, title, body, data } = await request.json();

    if (!userEmail || !title || !body) {
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

    if (!subscriptions.length) {
      return NextResponse.json(
        { error: "No push subscriptions found for user" },
        { status: 404 }
      );
    }

    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            JSON.stringify({
              title,
              body,
              data,
            })
          );
          return { success: true, endpoint: subscription.endpoint };
        } catch (error: unknown) {
          // If subscription is expired or invalid, delete it
          if (error && typeof error === "object" && "statusCode" in error) {
            const webPushError = error as { statusCode?: number };
            if (
              webPushError.statusCode === 404 ||
              webPushError.statusCode === 410
            ) {
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

    return NextResponse.json({
      results,
      successCount: results.filter(
        (r) =>
          r.status === "fulfilled" && (r.value as NotificationResult).success
      ).length,
    });
  } catch (error) {
    console.error("Error sending push notification:", error);
    return NextResponse.json(
      { error: "Failed to send push notification" },
      { status: 500 }
    );
  }
}
