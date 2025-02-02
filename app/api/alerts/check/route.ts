import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";

export async function POST() {
  try {
    const session = await auth();
    console.log("Session check:", {
      hasSession: !!session,
      userEmail: session?.user?.email,
      timestamp: new Date().toISOString(),
    });

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

    console.log("User data:", {
      found: !!user,
      email: user?.email,
      geo: user?.geo,
      referral: user?.refferal,
      existingAlerts: user?.alerts?.length || 0,
      timestamp: new Date().toISOString(),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get active alerts for user's geo and referral code
    const now = new Date();
    console.log("Querying alerts with conditions:", {
      currentTime: now.toISOString(),
      userGeo: user.geo || "US",
      userReferral: user.refferal || "",
      timestamp: new Date().toISOString(),
    });

    // Get all active alerts assigned to this user
    const activeAlerts = await prisma.alert.findMany({
      where: {
        AND: [
          {
            startTime: { lte: now },
            endTime: { gte: now },
          },
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
        },
      },
    });

    console.log("Active alerts query result:", {
      count: activeAlerts.length,
      alerts: activeAlerts.map((a) => ({
        id: a.id,
        message: a.message,
        geoTargets: a.geoTargets,
        referralCodes: a.referralCodes,
        startTime: a.startTime,
        endTime: a.endTime,
        recipientCount: a.recipients.length,
      })),
      timestamp: new Date().toISOString(),
    });

    // Return all active alerts with read status
    const alertsWithRead = activeAlerts.map((alert) => ({
      ...alert,
      read: alert.recipients[0]?.read || false,
    }));

    console.log("Final response:", {
      totalAlerts: alertsWithRead.length,
      alerts: alertsWithRead.map((a) => ({
        id: a.id,
        message: a.message,
        read: a.read,
      })),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(alertsWithRead);
  } catch (error) {
    console.error("Error checking alerts:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "Failed to check alerts" },
      { status: 500 }
    );
  }
}
