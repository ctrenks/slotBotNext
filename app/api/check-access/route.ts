import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ hasAccess: false });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { paid: true, trial: true },
    });

    if (!user) {
      return NextResponse.json({ hasAccess: false });
    }

    const now = new Date();
    const hasValidTrial = user.trial ? new Date(user.trial) > now : false;
    const hasPaidAccess = user.paid === true;

    return NextResponse.json({
      hasAccess: hasValidTrial || hasPaidAccess,
    });
  } catch (error) {
    console.error("Error checking access:", error);
    return NextResponse.json({ hasAccess: false });
  }
}
