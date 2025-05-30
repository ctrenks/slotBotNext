import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        emailNotifications: true as unknown as true,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json({
      emailNotifications:
        (user as { emailNotifications: boolean }).emailNotifications ?? true,
    });
  } catch (error) {
    console.error("Error fetching email notification settings:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { emailNotifications } = await request.json();

    if (typeof emailNotifications !== "boolean") {
      return new NextResponse("Invalid emailNotifications value", {
        status: 400,
      });
    }

    // Update user's email notification preference
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { emailNotifications } as { emailNotifications: boolean },
      select: {
        id: true,
        email: true,
        emailNotifications: true as unknown as true,
      },
    });

    console.log(
      `Updated email notifications for user ${updatedUser.email}: ${emailNotifications}`
    );

    return NextResponse.json({
      success: true,
      emailNotifications: (updatedUser as { emailNotifications: boolean })
        .emailNotifications,
    });
  } catch (error) {
    console.error("Error updating email notification settings:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
