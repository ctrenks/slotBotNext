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

  // Only allow admins to create alerts
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  // Create the alert
  const alert = await prisma.alert.create({
    data: {
      message: input.message,
      geoTargets: input.geoTargets,
      referralCodes: input.referralCodes,
      startTime: new Date(input.startTime),
      endTime: new Date(input.endTime),
    },
  });

  // Find all users that match the criteria
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { geo: { in: input.geoTargets } },
        { refferal: { in: input.referralCodes } },
      ],
    },
  });

  // Create alert recipients
  await prisma.alertRecipient.createMany({
    data: users.map((user) => ({
      alertId: alert.id,
      userId: user.id,
    })),
  });

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

  return user.alerts.map((recipient) => ({
    ...recipient.alert,
    read: recipient.read,
  }));
}
