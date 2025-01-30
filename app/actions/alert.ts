"use server";

import { prisma } from "@/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

interface CreateAlertInput {
  message: string;
  geoTargets: string[];
  referralCodes: string[];
  startTime: string;
  endTime: string;
}

export async function createAlert(input: CreateAlertInput) {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  // Normalize empty arrays to ['all']
  const geoTargets = input.geoTargets.length === 0 ? ["all"] : input.geoTargets;
  const referralCodes =
    input.referralCodes.length === 0 ? ["all"] : input.referralCodes;

  console.log("Creating alert with:", {
    geoTargets,
    referralCodes,
    message: input.message,
    startTime: input.startTime,
    endTime: input.endTime,
  });

  // Create the alert
  const alert = await prisma.alert.create({
    data: {
      message: input.message,
      geoTargets,
      referralCodes,
      startTime: new Date(input.startTime),
      endTime: new Date(input.endTime),
    },
  });

  // Find all users that match the criteria
  const whereClause =
    geoTargets.includes("all") && referralCodes.includes("all")
      ? // If both are 'all', don't filter by geo or referral
        {}
      : {
          OR: [
            // Match by geo if specified
            ...(!geoTargets.includes("all")
              ? [{ geo: { in: geoTargets } }]
              : []),
            // Match by referral if specified
            ...(!referralCodes.includes("all")
              ? [{ refferal: { in: referralCodes } }]
              : []),
          ],
        };

  const users = await prisma.user.findMany({
    where: whereClause,
  });

  console.log("Alert creation details:", {
    alertId: alert.id,
    geoTargets,
    referralCodes,
    whereClause,
    matchedUserCount: users.length,
    matchedUsers: users.map((u) => ({
      id: u.id,
      email: u.email,
      geo: u.geo,
      refferal: u.refferal,
    })),
  });

  if (users.length > 0) {
    // Create alert recipients
    const recipients = await prisma.alertRecipient.createMany({
      data: users.map((user) => ({
        alertId: alert.id,
        userId: user.id,
      })),
    });

    console.log("Created recipients:", {
      count: recipients.count,
      alertId: alert.id,
    });
  }

  revalidatePath("/");
  return alert;
}

export async function markAlertAsRead(alertId: string) {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  await prisma.alertRecipient.update({
    where: {
      alertId_userId: {
        alertId,
        userId: user.id,
      },
    },
    data: {
      read: true,
    },
  });

  revalidatePath("/");
}

export async function getAlertsForUser() {
  const session = await auth();

  if (!session?.user?.email) {
    return [];
  }

  const now = new Date();
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

  if (!user) {
    return [];
  }

  console.log("User data for alerts:", {
    id: user.id,
    email: user.email,
    geo: user.geo,
    refferal: user.refferal,
    totalAlerts: user.alerts.length,
    alerts: user.alerts.map((ar) => ({
      id: ar.alertId,
      read: ar.read,
      alert: ar.alert
        ? {
            id: ar.alert.id,
            message: ar.alert.message,
            geoTargets: ar.alert.geoTargets,
            referralCodes: ar.alert.referralCodes,
            endTime: ar.alert.endTime,
          }
        : null,
    })),
  });

  // Filter alerts to only show relevant ones
  const alerts = user.alerts
    .filter((recipient) => {
      const alert = recipient.alert;
      if (!alert) return false;

      // Check if alert is expired
      if (new Date(alert.endTime) < now) return false;

      // Check if alert targets this user's geo
      const geoMatch =
        alert.geoTargets.includes("all") ||
        (user.geo && alert.geoTargets.includes(user.geo));

      // Check if alert targets this user's referral code
      const referralMatch =
        alert.referralCodes.includes("all") ||
        (user.refferal && alert.referralCodes.includes(user.refferal));

      const isMatch = geoMatch || referralMatch;

      console.log("Alert match check:", {
        alertId: alert.id,
        message: alert.message,
        geoMatch,
        referralMatch,
        isMatch,
        userGeo: user.geo,
        userReferral: user.refferal,
        alertGeoTargets: alert.geoTargets,
        alertReferralCodes: alert.referralCodes,
      });

      return isMatch;
    })
    .map((recipient) => ({
      ...recipient.alert!,
      read: recipient.read,
    }));

  console.log("Final filtered alerts:", {
    count: alerts.length,
    alerts: alerts.map((a) => ({
      id: a.id,
      message: a.message,
      geoTargets: a.geoTargets,
      referralCodes: a.referralCodes,
      read: a.read,
      endTime: a.endTime,
    })),
  });

  return alerts;
}
