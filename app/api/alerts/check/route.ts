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
      userId: user.id,
      paid: user.paid,
      trial: user.trial,
      timestamp: new Date().toISOString(),
    });

    // Only get alerts that are currently active (between start and end time)
    const activeAlerts = await prisma.alert.findMany({
      where: {
        AND: [
          // Only get alerts that have started and not ended yet
          {
            startTime: { lte: now },
            endTime: { gte: now },
          },
          // Must be assigned to this user
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
        message: a.message.substring(0, 50) + "...",
        read: a.recipients[0]?.read || false,
      })),
    });

    // Find unread alerts and send push notifications
    const unreadAlerts = activeAlerts.filter(
      (alert) => !alert.recipients[0]?.read
    );

    if (unreadAlerts.length > 0) {
      console.log("Checking for alerts that need push notifications:", {
        count: unreadAlerts.length,
        alerts: unreadAlerts.map((a) => ({
          id: a.id,
          message: a.message,
        })),
      });

      // Send push notifications only for alerts that haven't been notified yet
      for (const alert of unreadAlerts) {
        try {
          // Check if we've already sent a notification for this alert
          const existingNotification =
            await prisma.alertNotification.findUnique({
              where: {
                alertId_userEmail: {
                  alertId: alert.id,
                  userEmail: user.email,
                },
              },
            });

          if (!existingNotification) {
            await sendPushNotification(user.email, alert);

            // Record that we've sent a notification for this alert
            await prisma.alertNotification.create({
              data: {
                alertId: alert.id,
                userEmail: user.email,
                sentAt: new Date(),
              },
            });

            console.log("Sent push notification for alert:", {
              alertId: alert.id,
              userEmail: user.email,
            });
          } else {
            console.log("Skipping duplicate notification for alert:", {
              alertId: alert.id,
              userEmail: user.email,
              originalNotificationSentAt: existingNotification.sentAt,
            });
          }
        } catch (error) {
          console.error("Failed to handle push notification:", {
            alertId: alert.id,
            error,
          });
        }
      }
    }

    // Return active alerts with read status
    const alertsWithRead = activeAlerts.map((alert) => ({
      ...alert,
      read: alert.recipients[0]?.read || false,
      casinoImage: alert.casino?.button,
    }));

    console.log("Final response data:", {
      totalAlerts: alertsWithRead.length,
      alerts: alertsWithRead.map((a) => ({
        id: a.id,
        message: a.message,
        read: a.read,
      })),
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
