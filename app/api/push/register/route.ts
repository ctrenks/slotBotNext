import { NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { PushSubscriptionData } from "@/app/types/push";

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as PushSubscriptionData;
    const { subscription, userEmail } = data;

    if (!subscription || !userEmail) {
      return NextResponse.json(
        { error: "Missing subscription or userEmail" },
        { status: 400 }
      );
    }

    console.log("Registering push subscription:", {
      userEmail,
      endpoint: subscription.endpoint,
    });

    // Upsert the subscription
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
      },
      create: {
        userEmail,
        endpoint: subscription.endpoint,
        auth: subscription.keys.auth,
        p256dh: subscription.keys.p256dh,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("Subscription stored successfully:", {
      userEmail: result.userEmail,
      endpoint: result.endpoint,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to store subscription:", error);
    return NextResponse.json(
      { error: "Failed to store subscription" },
      { status: 500 }
    );
  }
}
