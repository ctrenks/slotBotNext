import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";

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
      data: { emailNotifications } as any,
      select: { id: true, email: true, emailNotifications: true as any },
    });

    console.log(
      `Updated email notifications for user ${updatedUser.email}: ${emailNotifications}`
    );

    return NextResponse.json({
      success: true,
      emailNotifications: (updatedUser as any).emailNotifications,
    });
  } catch (error) {
    console.error("Error updating email notification settings:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
