import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { sendPushNotification } from "@/app/utils/pushNotifications";

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

    // Log all alerts in the system for debugging
    const allAlerts = await prisma.alert.findMany({
      where: {
        endTime: { gte: now },
      },
    });

    console.log("All future alerts in system:", {
      count: allAlerts.length,
      alerts: allAlerts.map((a) => ({
        id: a.id,
        message: a.message,
        startTime: a.startTime,
        endTime: a.endTime,
        geoTargets: a.geoTargets,
        referralCodes: a.referralCodes,
      })),
      timestamp: new Date().toISOString(),
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
      })),
      userGeo: user.geo || "US",
      userReferral: user.refferal || "",
      timestamp: new Date().toISOString(),
    });

    // Check for new alerts that the user hasn't seen yet
    const existingAlertIds = new Set(user.alerts.map((ua) => ua.alertId));
    const newAlerts = activeAlerts.filter(
      (alert) => !existingAlertIds.has(alert.id)
    );

    console.log("New alerts check:", {
      existingAlertIds: Array.from(existingAlertIds),
      newAlertsCount: newAlerts.length,
      newAlerts: newAlerts.map((a) => ({
        id: a.id,
        message: a.message,
      })),
      timestamp: new Date().toISOString(),
    });

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
