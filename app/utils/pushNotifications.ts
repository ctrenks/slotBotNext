import webpush from "web-push";
import { prisma } from "@/prisma";
import { Alert } from "@prisma/client";

// Configure web-push with your VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface WebPushError extends Error {
  statusCode?: number;
}

export async function sendPushNotification(userEmail: string, alert: Alert) {
  try {
    // Get all push subscriptions for this user
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userEmail },
    });

    // Send push notification to each subscription
    const notifications = subscriptions.map(async (subscription) => {
      try {
        const payload = JSON.stringify({
          title: "New SlotBot Alert!",
          body: alert.message,
          data: {
            url: "/slotbot",
            alertId: alert.id,
          },
        });

        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              auth: subscription.auth,
              p256dh: subscription.p256dh,
            },
          },
          payload
        );

        console.log(`Push notification sent to ${subscription.endpoint}`);
      } catch (error) {
        // If subscription is expired/invalid, delete it
        const webPushError = error as WebPushError;
        if (webPushError.statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: {
              userEmail_endpoint: {
                userEmail: subscription.userEmail,
                endpoint: subscription.endpoint,
              },
            },
          });
          console.log(`Deleted expired subscription ${subscription.endpoint}`);
        } else {
          console.error(
            `Error sending push notification to ${subscription.endpoint}:`,
            error
          );
        }
      }
    });

    await Promise.all(notifications);
  } catch (error) {
    console.error("Error sending push notifications:", error);
  }
}
