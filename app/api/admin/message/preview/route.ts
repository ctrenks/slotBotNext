import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await auth();

    // Check if user is admin
    if (!session?.user?.email?.endsWith("@allfreechips.com")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { referralCode, isPaid } = body;

    // Build where clause based on filters
    const where: Prisma.UserWhereInput = {};
    if (referralCode) {
      where.refferal = referralCode;
    }
    if (isPaid !== undefined) {
      where.paid = isPaid;
    }

    // Count matching users
    const count = await prisma.user.count({
      where,
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error in preview endpoint:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
