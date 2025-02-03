import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.email) {
      console.log("No session or user:", session);
      return new NextResponse("Unauthorized - No session", { status: 401 });
    }

    // Check if user is admin
    if (!session.user.email.endsWith("@trenkas.com")) {
      console.log("Unauthorized access attempt:", session.user.email);
      return new NextResponse("Unauthorized - Not admin", { status: 401 });
    }

    const body = await req.json();
    console.log("Received request body:", body);

    if (!body || typeof body !== "object") {
      console.log("Invalid request body:", body);
      return new NextResponse("Invalid request body", { status: 400 });
    }

    // Extract filter properties from the filter object
    const filter = body.filter || {};
    const { referralCode, isPaid, noCode } = filter;
    console.log("Extracted filters:", { referralCode, isPaid, noCode });

    // Build where clause based on filters
    const where: Prisma.UserWhereInput = {
      email: { not: { equals: "" } }, // Only include users with non-empty email addresses
    };

    // Handle referral code filtering
    if (noCode) {
      where.refferal = { equals: "" };
    } else if (referralCode) {
      where.refferal = referralCode;
    }

    if (isPaid !== undefined) {
      where.paid = isPaid;
    }

    console.log("Final where clause:", where);

    // Count matching users
    const count = await prisma.user.count({
      where,
    });

    console.log("Found users count:", count);
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error in preview endpoint:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
    }
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      { status: 500 }
    );
  }
}
