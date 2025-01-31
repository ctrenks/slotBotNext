import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";

export async function POST() {
  try {
    const session = await auth();

    console.log("Session data:", {
      exists: !!session,
      hasUser: !!session?.user,
      email: session?.user?.email,
      id: session?.user?.id,
      geo: session?.user?.geo,
      refferal: session?.user?.refferal,
    });

    if (!session) {
      return new NextResponse("No session found", { status: 401 });
    }

    if (!session.user) {
      return new NextResponse("No user in session", { status: 401 });
    }

    if (!session.user.email) {
      return new NextResponse("No email in session", { status: 401 });
    }

    // Get the user from the database to ensure we have the latest data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse("User not found in database", { status: 404 });
    }

    if (!user.id) {
      return new NextResponse("User ID not found", { status: 400 });
    }

    const now = new Date();
    console.log("Alert check request:", {
      userEmail: user.email,
      userId: user.id,
      currentTime: now.toISOString(),
      geo: user.geo,
      refferal: user.refferal,
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
          // Geo filter - match if alert targets 'all' or user's geo
          {
            OR: [
              { geoTargets: { hasSome: ["all"] } },
              ...(user.geo ? [{ geoTargets: { hasSome: [user.geo] } }] : []),
            ],
          },
          // Referral filter - match if alert targets 'all' or user's referral
          {
            OR: [
              { referralCodes: { hasSome: ["all"] } },
              ...(user.refferal
                ? [{ referralCodes: { hasSome: [user.refferal] } }]
                : []),
            ],
          },
        ],
      },
      include: {
        recipients: {
          where: {
            userId: user.id,
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
          userId: user.id,
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
