"use server";

import { prisma } from "@/prisma";
import { auth } from "@/auth";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

interface CreateAlertData {
  message: string;
  geoTargets: string[];
  referralCodes: string[];
  startTime: string;
  endTime: string;
  casinoId?: number;
  casinoName?: string;
  casinoCleanName?: string;
  slot?: string;
  slotImage?: string;
  customUrl?: string;
  maxPotential?: number;
  recommendedBet?: number;
  stopLimit?: number;
  targetWin?: number;
  maxWin?: number;
  rtp?: number;
}

export async function createAlert(data: CreateAlertData) {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  // Normalize empty arrays to ['all']
  const geoTargets = data.geoTargets.length === 0 ? ["all"] : data.geoTargets;
  const referralCodes =
    data.referralCodes.length === 0 ? ["all"] : data.referralCodes;

  const alert = await prisma.alert.create({
    data: {
      message: data.message,
      geoTargets,
      referralCodes,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      ...(data.casinoId && {
        casino: {
          connect: { id: data.casinoId },
        },
      }),
      casinoName: data.casinoName,
      casinoCleanName: data.casinoCleanName,
      slot: data.slot,
      slotImage: data.slotImage,
      customUrl: data.customUrl,
      maxPotential: data.maxPotential
        ? parseFloat(data.maxPotential.toString())
        : null,
      recommendedBet: data.recommendedBet
        ? parseFloat(data.recommendedBet.toString())
        : null,
      stopLimit: data.stopLimit ? parseFloat(data.stopLimit.toString()) : null,
      targetWin: data.targetWin ? parseFloat(data.targetWin.toString()) : null,
      maxWin: data.maxWin ? parseFloat(data.maxWin.toString()) : null,
      rtp: data.rtp ? parseFloat(data.rtp.toString()) : null,
    },
  });

  // Find all users that should receive this alert
  const users = await prisma.user.findMany({
    where: {
      // If both targets are 'all', match all users
      ...(geoTargets.includes("all") && referralCodes.includes("all")
        ? {} // Empty where clause matches all users
        : {
            OR: [
              // If only geo is 'all', match by referral
              ...(geoTargets.includes("all")
                ? [{}]
                : [{ geo: { in: geoTargets } }]),
              // If only referral is 'all', match by geo
              ...(referralCodes.includes("all")
                ? [{}]
                : [{ refferal: { in: referralCodes } }]),
            ],
          }),
    },
  });

  console.log("Found users for alert:", {
    alertId: alert.id,
    totalUsers: users.length,
    geoTargets,
    referralCodes,
    userDetails: users.map((u) => ({
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
