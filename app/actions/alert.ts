"use server";

import { prisma } from "@/prisma";
import { auth } from "@/auth";
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
  try {
    const session = await auth();
    if (!session) {
      throw new Error("No session found");
    }

    if (!session.user?.email) {
      throw new Error("No user email found in session");
    }

    // Normalize empty arrays to ['all']
    const geoTargets = data.geoTargets.length === 0 ? ["all"] : data.geoTargets;
    const referralCodes =
      data.referralCodes.length === 0 ? ["all"] : data.referralCodes;

    console.log("Creating alert with data:", {
      message: data.message,
      geoTargets,
      referralCodes,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      casinoId: data.casinoId,
      slot: data.slot,
    });

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
        stopLimit: data.stopLimit
          ? parseFloat(data.stopLimit.toString())
          : null,
        targetWin: data.targetWin
          ? parseFloat(data.targetWin.toString())
          : null,
        maxWin: data.maxWin ? parseFloat(data.maxWin.toString()) : null,
        rtp: data.rtp ? parseFloat(data.rtp.toString()) : null,
      },
    });

    console.log("Alert created:", {
      id: alert.id,
      message: alert.message,
      geoTargets: alert.geoTargets,
      referralCodes: alert.referralCodes,
      startTime: alert.startTime,
      endTime: alert.endTime,
    });

    // First get all users to see what's available
    const allUsers = await prisma.user.findMany();
    console.log("All users in system:", {
      count: allUsers.length,
      users: allUsers.map((u) => ({
        id: u.id,
        email: u.email,
        geo: u.geo,
        refferal: u.refferal,
      })),
    });

    // Find all users that should receive this alert
    const users = await prisma.user.findMany({
      where: {
        OR: [
          // Match if geo targets include 'all' AND user has a geo
          {
            AND: [{ geo: { not: null } }, { geo: { not: "" } }],
          },
          // Match if user's geo is in geoTargets AND user has a geo
          {
            AND: [
              { geo: { not: null } },
              { geo: { not: "" } },
              { geo: { in: geoTargets } },
            ],
          },
        ],
        AND: [
          {
            OR: [
              // Match if referral targets include 'all' AND user has a referral
              {
                AND: [{ refferal: { not: null } }, { refferal: { not: "" } }],
              },
              // Match if user's referral is in referralCodes AND user has a referral
              {
                AND: [
                  { refferal: { not: null } },
                  { refferal: { not: "" } },
                  { refferal: { in: referralCodes } },
                ],
              },
            ],
          },
        ],
      },
    });

    console.log("Found users for alert:", {
      alertId: alert.id,
      totalUsers: users.length,
      geoTargets,
      referralCodes,
      userDetails: users.map((u) => ({
        id: u.id,
        email: u.email,
        geo: u.geo,
        refferal: u.refferal,
        matchedByGeo:
          u.geo && (geoTargets.includes("all") || geoTargets.includes(u.geo)),
        matchedByReferral:
          u.refferal &&
          (referralCodes.includes("all") || referralCodes.includes(u.refferal)),
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

      console.log("Created alert recipients:", {
        alertId: alert.id,
        recipientCount: recipients.count,
        userIds: users.map((u) => u.id),
      });
    } else {
      console.log("No users found matching the alert criteria");
    }

    // Verify recipients were created
    const createdRecipients = await prisma.alertRecipient.findMany({
      where: { alertId: alert.id },
      include: { user: true },
    });

    console.log("Verified created recipients:", {
      alertId: alert.id,
      count: createdRecipients.length,
      recipients: createdRecipients.map((r) => ({
        userId: r.userId,
        email: r.user.email,
        geo: r.user.geo,
        refferal: r.user.refferal,
      })),
    });

    revalidatePath("/");
    return alert;
  } catch (error) {
    console.error("Error in createAlert:", error);
    throw error;
  }
}

export async function markAlertAsRead(alertId: string) {
  try {
    const session = await auth();
    if (!session) {
      throw new Error("No session found");
    }

    if (!session.user?.email) {
      throw new Error("No user email found in session");
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
  } catch (error) {
    console.error("Error in markAlertAsRead:", error);
    throw error;
  }
}

export async function getAlertsForUser() {
  try {
    const session = await auth();
    if (!session) {
      console.log("No session found in getAlertsForUser");
      return [];
    }

    if (!session.user?.email) {
      console.log("No user email found in session for getAlertsForUser");
      return [];
    }

    const now = new Date();
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        alerts: {
          include: {
            alert: {
              include: {
                casino: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      console.log("User not found in getAlertsForUser");
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
          (alert.geoTargets.includes("all") && user.geo && user.geo !== "") ||
          (user.geo && user.geo !== "" && alert.geoTargets.includes(user.geo));

        // Check if alert targets this user's referral code
        const referralMatch =
          (alert.referralCodes.includes("all") &&
            user.refferal &&
            user.refferal !== "") ||
          (user.refferal &&
            user.refferal !== "" &&
            alert.referralCodes.includes(user.refferal));

        // Both conditions must match for the alert to be shown
        const isMatch = geoMatch && referralMatch;

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
  } catch (error) {
    console.error("Error in getAlertsForUser:", error);
    return [];
  }
}
