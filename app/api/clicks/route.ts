import { NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";
import { isAdmin } from "@/app/utils/auth";

/**
 * API endpoint to get click tracking data with filters
 * This is used by the admin dashboard
 */
export async function GET(request: Request) {
  try {
    // Check if user is authenticated and is admin
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");
    const geo = searchParams.get("geo");
    const code = searchParams.get("code");

    // Build the where clause for filtering
    const where: Prisma.ClickTrackWhereInput = {};
    if (geo) where.geo = geo;
    if (code) where.offerCode = code;

    // Get the click tracking data with filters
    const clickTracks = await prisma.clickTrack.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
    });

    // Get the total count with filters
    const total = await prisma.clickTrack.count({ where });

    return NextResponse.json({
      success: true,
      data: clickTracks,
      total,
    });
  } catch (error) {
    console.error("Error getting click tracking data:", error);
    return NextResponse.json(
      { error: "Failed to get click tracking data" },
      { status: 500 }
    );
  }
}
