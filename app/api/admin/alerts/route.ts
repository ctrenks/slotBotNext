import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";

export async function GET() {
  try {
    const session = await auth();

    // Check if user is admin
    const isAdmin =
      session?.user?.email === "chris@trenkas.com" ||
      session?.user?.email === "carringtoncenno180@gmail.com";

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alerts = await prisma.alert.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        recipients: true,
      },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error fetching all alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}
