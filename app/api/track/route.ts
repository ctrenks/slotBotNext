import { NextResponse } from "next/server";
import { prisma } from "@/prisma";

/**
 * API endpoint to record click tracking data
 * This endpoint is called when a user visits the site
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { referrer, clickId, offerCode, userAgent, geo } = data;

    // Skip tracking for internal traffic from our own domain
    if (
      referrer &&
      (referrer.includes("beatonlineslots.com") ||
        referrer.includes("localhost") ||
        referrer.includes("127.0.0.1"))
    ) {
      return NextResponse.json({
        success: true,
        message: "Skipped tracking for internal traffic",
      });
    }

    // Get IP address from request headers
    let ip = null;
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
      ip = forwardedFor.split(",")[0].trim();
    }

    // Create a new click tracking record
    const clickTrack = await prisma.clickTrack.create({
      data: {
        ip,
        referrer,
        clickId,
        offerCode,
        userAgent,
        geo,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Click tracking data recorded successfully",
      id: clickTrack.id,
    });
  } catch (error) {
    console.error("Error recording click tracking data:", error);
    return NextResponse.json(
      { error: "Failed to record click tracking data" },
      { status: 500 }
    );
  }
}

/**
 * API endpoint to get click tracking data
 * This is used by the admin dashboard
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");
    const clickId = searchParams.get("clickId");
    const offerCode = searchParams.get("offerCode");
    const geo = searchParams.get("geo");

    // Build the query
    const where: Record<string, string | undefined | { not: null }> = {};
    if (clickId) where.clickId = clickId;
    if (offerCode) where.offerCode = offerCode;
    if (geo) where.geo = geo;

    // Get the click tracking data
    const clickTracks = await prisma.clickTrack.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
    });

    // Get the total count
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
