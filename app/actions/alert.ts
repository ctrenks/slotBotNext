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
  const users = await prisma.user.findMany({
    where: {
      OR: [
        // If targeting all, include everyone
        ...(geoTargets.includes("all") ? [{}] : []),
        // Otherwise, match specific geo targets
        ...(geoTargets.includes("all") ? [] : [{ geo: { in: geoTargets } }]),
      ],
    },
  });

  console.log("Found matching users:", users.length);
  console.log("Alert criteria:", {
    geoTargets,
    referralCodes,
    matchedUsers: users.map((u) => ({
      email: u.email,
      geo: u.geo,
      refferal: u.refferal,
    })),
  });

  if (users.length > 0) {
    // Create alert recipients
    await prisma.alertRecipient.createMany({
      data: users.map((user) => ({
        alertId: alert.id,
        userId: user.id,
      })),
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

  // Filter alerts to only show relevant ones
  const now = new Date();
  const alerts = user.alerts
    .filter((recipient) => {
      const alert = recipient.alert;
      if (!alert) return false;

      // Check if alert is still valid
      if (new Date(alert.endTime) < now) return false;

      // Check if alert targets this user's geo
      const geoMatch =
        alert.geoTargets.includes("all") ||
        alert.geoTargets.includes(user.geo || "");

      // Check if alert targets this user's referral code
      const referralMatch =
        alert.referralCodes.includes("all") ||
        alert.referralCodes.includes(user.refferal || "");

      return geoMatch || referralMatch;
    })
    .map((recipient) => ({
      ...recipient.alert!,
      read: recipient.read,
    }));

  console.log("Retrieved alerts for user:", {
    email: session.user.email,
    geo: user.geo,
    refferal: user.refferal,
    alertCount: alerts.length,
    alerts: alerts.map((a) => ({
      id: a.id,
      message: a.message,
      geoTargets: a.geoTargets,
      referralCodes: a.referralCodes,
    })),
  });

  return alerts;
}
