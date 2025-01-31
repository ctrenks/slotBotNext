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
    console.log("Alert check request:", {
      userEmail: session.user.email,
      currentTime: now.toISOString(),
    });

    // Get user's alerts
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        geo: true,
        refferal: true,
        alerts: {
          where: {
            alert: {
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
          },
          include: {
            alert: true,
          },
        },
      },
    });

    if (!user) {
      console.log("User not found in alert check");
      return new NextResponse("User not found", { status: 404 });
    }

    console.log("User data for alert check:", {
      id: user.id,
      geo: user.geo,
      refferal: user.refferal,
      alertCount: user.alerts.length,
    });

    // Transform alerts data
    const alerts = user.alerts
      .filter((recipient) => recipient.alert !== null)
      .map((recipient) => ({
        ...recipient.alert!,
        read: recipient.read,
      }));

    console.log("Returning alerts:", {
      alertCount: alerts.length,
      alerts: alerts.map((a) => ({
        id: a.id,
        message: a.message,
        startTime: a.startTime,
        endTime: a.endTime,
      })),
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error checking for new alerts:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
