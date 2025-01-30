import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { prisma } from "@/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get country from request headers
    const headersList = await headers();
    const visitorCountry = headersList.get("x-vercel-ip-country") || "US";

    // Update user geo if not already set
    if (!session.user.geo) {
      await prisma.user.update({
        where: { email: session.user.email },
        data: {
          geo: visitorCountry,
        },
      });
    }

    return NextResponse.json({
      success: true,
      country: visitorCountry,
    });
  } catch (error) {
    console.error("Error in geo API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process request",
      },
      { status: 500 }
    );
  }
}
