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
    });

    // First check all active alerts to see what's available
    const allActiveAlerts = await prisma.alert.findMany({
      where: {
        startTime: { lte: now },
        endTime: { gt: now },
      },
      include: {
        recipients: true,
      },
    });

    console.log("All active alerts:", {
      count: allActiveAlerts.length,
      alerts: allActiveAlerts.map((a) => ({
        id: a.id,
        message: a.message,
        startTime: a.startTime,
        endTime: a.endTime,
        recipientCount: a.recipients.length,
        recipientIds: a.recipients.map((r) => r.userId),
        geoTargets: a.geoTargets,
        referralCodes: a.referralCodes,
      })),
    });

    // Find active alerts where this user is a recipient
    const activeAlerts = await prisma.alert.findMany({
      where: {
        AND: [
          // Time filter
          {
            startTime: { lte: now },
            endTime: { gt: now },
          },
          // Must be a recipient
          {
            recipients: {
              some: {
                userId: user.id,
              },
            },
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

    console.log("Found active alerts for user:", {
      userId: user.id,
      count: activeAlerts.length,
      alerts: activeAlerts.map((a) => ({
        id: a.id,
        message: a.message,
        startTime: a.startTime,
        endTime: a.endTime,
        hasRecipient: a.recipients.length > 0,
        recipientReadStatus: a.recipients[0]?.read,
      })),
    });

    // Transform alerts and add read status
    const alertsWithReadStatus = activeAlerts.map((alert) => ({
      ...alert,
      read: alert.recipients[0]?.read ?? false,
    }));

    return NextResponse.json(alertsWithReadStatus);
  } catch (error) {
    console.error("Error checking for new alerts:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
