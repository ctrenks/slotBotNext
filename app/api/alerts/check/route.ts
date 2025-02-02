import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { sendPushNotification } from "@/app/utils/pushNotifications";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        alerts: {
          include: {
            alert: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get active alerts for user's geo and referral code
    const now = new Date();
    const activeAlerts = await prisma.alert.findMany({
      where: {
        AND: [
          {
            startTime: { lte: now },
            endTime: { gte: now },
          },
          {
            OR: [
              { geoTargets: { has: user.geo || "US" } },
              { geoTargets: { isEmpty: true } },
            ],
          },
          {
            OR: [
              { referralCodes: { has: user.refferal || "" } },
              { referralCodes: { isEmpty: true } },
            ],
          },
        ],
      },
    });

    // Check for new alerts that the user hasn't seen yet
    const existingAlertIds = new Set(user.alerts.map((ua) => ua.alertId));
    const newAlerts = activeAlerts.filter(
      (alert) => !existingAlertIds.has(alert.id)
    );

    // Create UserAlert entries for new alerts
    if (newAlerts.length > 0) {
      await prisma.userAlert.createMany({
        data: newAlerts.map((alert) => ({
          userId: Number(user.id),
          alertId: alert.id,
          read: false,
          createdAt: new Date(),
          geo: user.geo || "US",
        })),
      });

      // Send push notifications for new alerts
      for (const alert of newAlerts) {
        await sendPushNotification(user.email, alert);
      }
    }

    // Return all active alerts with read status
    const alertsWithRead = activeAlerts.map((alert) => ({
      ...alert,
      read: existingAlertIds.has(alert.id),
    }));

    return NextResponse.json(alertsWithRead);
  } catch (error) {
    console.error("Error checking alerts:", error);
    return NextResponse.json(
      { error: "Failed to check alerts" },
      { status: 500 }
    );
  }
}
