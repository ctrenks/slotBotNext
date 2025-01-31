import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";

export async function POST() {
  const session = await auth();

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const now = new Date();
    const userId = session.user.id;

    if (!userId) {
      return new NextResponse("User ID not found", { status: 400 });
    }

    console.log("Alert check request:", {
      userEmail: session.user.email,
      userId,
      currentTime: now.toISOString(),
    });

    // First find all active alerts
    const activeAlerts = await prisma.alert.findMany({
      where: {
        AND: [
          // Time filter
          {
            startTime: { lte: now },
            endTime: { gt: now },
          },
          // Geo and referral filter
          {
            OR: [
              { geoTargets: { has: "all" } },
              { geoTargets: { has: session.user.geo || "" } },
            ],
          },
          {
            OR: [
              { referralCodes: { has: "all" } },
              { referralCodes: { has: session.user.refferal || "" } },
            ],
          },
        ],
      },
      include: {
        recipients: {
          where: {
            userId: userId,
          },
          select: {
            read: true,
          },
        },
      },
    });

    console.log("Found active alerts:", {
      count: activeAlerts.length,
      alerts: activeAlerts.map((a) => ({
        id: a.id,
        message: a.message,
        startTime: a.startTime,
        endTime: a.endTime,
        geoTargets: a.geoTargets,
        referralCodes: a.referralCodes,
        hasRecipient: a.recipients.length > 0,
      })),
    });

    // Transform alerts and add read status
    const alertsWithReadStatus = activeAlerts.map((alert) => ({
      ...alert,
      read: alert.recipients[0]?.read ?? false,
    }));

    // Create missing alert recipients
    const alertsNeedingRecipients = activeAlerts.filter(
      (alert) => alert.recipients.length === 0
    );
    if (alertsNeedingRecipients.length > 0) {
      console.log(
        "Creating missing alert recipients for alerts:",
        alertsNeedingRecipients.map((a) => a.id)
      );

      await prisma.alertRecipient.createMany({
        data: alertsNeedingRecipients.map((alert) => ({
          alertId: alert.id,
          userId: userId,
          read: false,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json(alertsWithReadStatus);
  } catch (error) {
    console.error("Error checking for new alerts:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
