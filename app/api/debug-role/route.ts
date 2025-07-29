import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { isAdmin } from "@/app/utils/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({
        error: "No session",
        session: null,
      });
    }

    // Get user directly from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
      },
    });

    // Check isAdmin function
    const adminCheck = await isAdmin();

    return NextResponse.json({
      session: {
        email: session.user.email,
        name: session.user.name,
      },
      userFromDB: user,
      isAdminResult: adminCheck,
      debug: {
        hasUser: !!user,
        roleValue: user?.role,
        roleType: typeof user?.role,
      },
    });
  } catch (error) {
    console.error("Debug role error:", error);
    return NextResponse.json({
      error: "Debug failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
