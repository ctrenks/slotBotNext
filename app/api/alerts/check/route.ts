import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { lastAlertTime } = await request.json();
    const lastCheckTime = new Date(lastAlertTime);

    // Get user data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        alerts: {
          where: {
            alert: {
              createdAt: {
                gt: lastCheckTime,
              },
              endTime: {
                gt: new Date(),
              },
            },
          },
          include: {
            alert: true,
          },
        },
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Transform alerts data
    const alerts = user.alerts
      .filter((recipient) => recipient.alert !== null)
      .map((recipient) => ({
        ...recipient.alert!,
        read: recipient.read,
      }));

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error checking for new alerts:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
