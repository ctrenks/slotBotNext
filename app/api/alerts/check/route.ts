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
    const twentyFourHoursFromNow = new Date(
      now.getTime() + 24 * 60 * 60 * 1000
    );

    console.log("Alert check request:", {
      userEmail: user.email,
      userId: user.id,
      currentTime: now.toISOString(),
      checkingUntil: twentyFourHoursFromNow.toISOString(),
    });

    // Find alerts where this user is a recipient and that haven't ended yet
    const userAlerts = await prisma.alert.findMany({
      where: {
        AND: [
          // Must be a recipient
          {
            recipients: {
              some: {
                userId: user.id,
              },
            },
          },
          // Not ended yet
          {
            endTime: {
              gt: now,
            },
          },
          // Starts within next 24 hours
          {
            startTime: {
              lte: twentyFourHoursFromNow,
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

    console.log("Found alerts for user:", {
      userId: user.id,
      totalAlerts: userAlerts.length,
      alerts: userAlerts.map((a) => ({
        id: a.id,
        message: a.message,
        startTime: a.startTime.toISOString(),
        endTime: a.endTime.toISOString(),
        hasRecipient: a.recipients.length > 0,
        recipientReadStatus: a.recipients[0]?.read,
        timeInfo: {
          startTime: a.startTime.toISOString(),
          endTime: a.endTime.toISOString(),
          now: now.toISOString(),
          startDiff: (a.startTime.getTime() - now.getTime()) / (1000 * 60), // minutes until start
          endDiff: (a.endTime.getTime() - now.getTime()) / (1000 * 60), // minutes until end
          isActive: a.startTime <= now && a.endTime > now,
          isUpcoming:
            a.startTime > now && a.startTime <= twentyFourHoursFromNow,
        },
      })),
    });

    // Transform alerts and add read status
    const alertsWithReadStatus = userAlerts.map((alert) => ({
      ...alert,
      read: alert.recipients[0]?.read ?? false,
    }));

    return NextResponse.json(alertsWithReadStatus);
  } catch (error) {
    console.error("Error checking for new alerts:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
