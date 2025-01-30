import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";

export async function POST(request: Request) {
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

    // Get user with all active alerts
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        alerts: {
          where: {
            alert: {
              startTime: { lte: now },
              endTime: { gt: now },
            },
          },
          include: {
            alert: true,
          },
        },
      },
    });

    if (!user) {
      console.log("User not found:", session.user.email);
      return new NextResponse("User not found", { status: 404 });
    }

    // Transform alerts data
    const alerts = user.alerts
      .filter((recipient) => recipient.alert !== null)
      .map((recipient) => ({
        ...recipient.alert!,
        read: recipient.read,
      }));

    console.log("Returning alerts:", {
      userEmail: session.user.email,
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
