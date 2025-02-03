import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await auth();

    // Check if user is admin
    if (!session?.user?.email?.endsWith("@allfreechips.com")) {
      console.log("Unauthorized access attempt:", session?.user?.email);
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    console.log("Received request body:", body);

    // Extract filter properties from the filter object, matching the send route structure
    const { referralCode, isPaid, noCode } = body.filter || body;
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
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      { status: 500 }
    );
  }
}
