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
      paid: user?.paid,
      trial: user?.trial,
      hasValidTrial: user?.trial ? new Date(user.trial) > new Date() : false,
      existingAlerts: user?.alerts?.length || 0,
      timestamp: new Date().toISOString(),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has access
    const now = new Date();
    const hasValidTrial = user.trial ? new Date(user.trial) > now : false;
    const hasPaidAccess = user.paid === true;

    console.log("User access check:", {
      email: user.email,
      hasValidTrial,
      hasPaidAccess,
      trial: user.trial,
      paid: user.paid,
      timestamp: new Date().toISOString(),
    });

    if (!hasValidTrial && !hasPaidAccess) {
      console.log("User does not have access:", {
        email: user.email,
        hasValidTrial,
        hasPaidAccess,
        trial: user.trial,
        paid: user.paid,
      });
      return NextResponse.json(
        { error: "No active subscription" },
        { status: 403 }
      );
    }

    // Get active alerts for user's geo and referral code
    console.log("Querying alerts with conditions:", {
      currentTime: now.toISOString(),
      userGeo: user.geo || "US",
      userReferral: user.refferal || "",
      timestamp: new Date().toISOString(),
    });

    // First, get all active alerts regardless of recipients
    const allActiveAlerts = await prisma.alert.findMany({
      where: {
        startTime: { lte: now },
        endTime: { gte: now },
      },
      include: {
        recipients: true,
        casino: {
          select: {
            id: true,
            url: true,
            button: true,
          },
        },
      },
    });

    console.log("All active alerts before recipient filtering:", {
      count: allActiveAlerts.length,
      alerts: allActiveAlerts.map((a) => ({
        id: a.id,
        message: a.message,
        startTime: a.startTime.toISOString(),
        endTime: a.endTime.toISOString(),
        geoTargets: a.geoTargets,
        referralCodes: a.referralCodes,
        recipientCount: a.recipients.length,
        recipientIds: a.recipients.map((r) => r.userId),
        currentUserId: user.id,
        isUserRecipient: a.recipients.some((r) => r.userId === user.id),
      })),
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
      orderBy: {
        startTime: "desc",
      },
      include: {
        recipients: {
          where: {
            userId: user.id,
          },
        },
        casino: {
          select: {
            id: true,
            url: true,
            button: true,
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
        startTime: a.startTime.toISOString(),
        endTime: a.endTime.toISOString(),
        now: now.toISOString(),
        isActive: a.startTime <= now && a.endTime >= now,
        timeDiff: {
          startToNow:
            Math.floor((now.getTime() - a.startTime.getTime()) / 1000 / 60) +
            " minutes",
          nowToEnd:
            Math.floor((a.endTime.getTime() - now.getTime()) / 1000 / 60) +
            " minutes",
        },
        recipientCount: a.recipients.length,
        read: a.recipients[0]?.read || false,
        casinoImage: a.casino?.button,
      })),
      timestamp: new Date().toISOString(),
    });

    // Find unread alerts and send push notifications
    const unreadAlerts = activeAlerts.filter(
      (alert) => !alert.recipients[0]?.read
    );

    if (unreadAlerts.length > 0) {
      console.log("Sending push notifications for unread alerts:", {
        count: unreadAlerts.length,
        alerts: unreadAlerts.map((a) => ({
          id: a.id,
          message: a.message,
          casinoImage: a.casino?.button,
        })),
      });

      // Send push notifications for unread alerts
      for (const alert of unreadAlerts) {
        try {
          await sendPushNotification(user.email, alert);
        } catch (error) {
          console.error("Failed to send push notification:", {
            alertId: alert.id,
            error,
          });
        }
      }
    }

    // Return all active alerts with read status
    const alertsWithRead = activeAlerts.map((alert) => ({
      ...alert,
      read: alert.recipients[0]?.read || false,
      casinoImage: alert.casino?.button,
    }));

    console.log("Final response:", {
      totalAlerts: alertsWithRead.length,
      alerts: alertsWithRead.map((a) => ({
        id: a.id,
        message: a.message,
        read: a.read,
        casinoImage: a.casino?.button,
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
