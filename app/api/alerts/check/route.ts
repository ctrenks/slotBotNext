import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { lastAlertTime } = await request.json();
    const lastCheckTime = new Date(lastAlertTime);
    const now = new Date();

    console.log("Alert check request:", {
      userEmail: session.user.email,
      lastCheckTime: lastCheckTime.toISOString(),
      currentTime: now.toISOString(),
    });

    // Get user data with alerts that:
    // 1. Were created after the last check time OR
    // 2. Have a start time that falls between last check and now
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        alerts: {
          where: {
            alert: {
              OR: [
                // New alerts created after last check
                { createdAt: { gt: lastCheckTime } },
                // Existing alerts that became active since last check
                {
                  AND: [
                    { startTime: { gt: lastCheckTime } },
                    { startTime: { lte: now } },
                    { endTime: { gt: now } },
                  ],
                },
              ],
            },
          },
          include: {
            alert: true,
          },
        },
      },
    });

    if (!user) {
      console.log("User not found:", session.user.email);
      return new NextResponse("User not found", { status: 404 });
    }

    // Transform alerts data
    const alerts = user.alerts
      .filter((recipient) => {
        if (!recipient.alert) return false;

        // Double-check time validity
        const startTime = new Date(recipient.alert.startTime);
        const endTime = new Date(recipient.alert.endTime);
        const isTimeValid = startTime <= now && endTime >= now;

        console.log("Alert time check:", {
          alertId: recipient.alert.id,
          message: recipient.alert.message,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          currentTime: now.toISOString(),
          isTimeValid,
        });

        return isTimeValid;
      })
      .map((recipient) => ({
        ...recipient.alert!,
        read: recipient.read,
      }));

    console.log("Returning alerts:", {
      userEmail: session.user.email,
      alertCount: alerts.length,
      alerts: alerts.map((a) => ({
        id: a.id,
        message: a.message,
        startTime: a.startTime,
        endTime: a.endTime,
        createdAt: a.createdAt,
      })),
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error checking for new alerts:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
