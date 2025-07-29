import { NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";
import { isAdmin } from "@/app/utils/auth";

/**
 * API endpoint to export click tracking data to CSV
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
    const geo = searchParams.get("geo");
    const code = searchParams.get("code");

    // Build the where clause for filtering
    const where: Prisma.ClickTrackWhereInput = {};
    if (geo) where.geo = geo;
    if (code) where.offerCode = code;

    // Get all click tracking data with filters
    const clickTracks = await prisma.clickTrack.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            email: true,
            paid: true,
            createdAt: true,
          },
        },
      },
    });

    // Generate CSV content
    const headers = [
      "ID",
      "IP",
      "Referrer",
      "Click ID",
      "Offer Code",
      "User Agent",
      "Country",
      "Created At",
      "Converted",
      "User Email",
      "User Paid",
      "User Created At",
    ];

    let csvContent = headers.join(",") + "\n";

    clickTracks.forEach((click) => {
      const row = [
        click.id,
        click.ip || "",
        `"${(click.referrer || "").replace(/"/g, '""')}"`, // Escape quotes in CSV
        click.clickId || "",
        click.offerCode || "",
        `"${(click.userAgent || "").replace(/"/g, '""')}"`, // Escape quotes in CSV
        click.geo || "",
        click.createdAt.toISOString(),
        click.convertedToUser ? "Yes" : "No",
        click.user?.email || "",
        click.user?.paid ? "Yes" : "No",
        click.user?.createdAt ? click.user.createdAt.toISOString() : "",
      ];

      csvContent += row.join(",") + "\n";
    });

    // Return CSV as a downloadable file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="affiliate-clicks-export-${
          new Date().toISOString().split("T")[0]
        }.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting click tracking data:", error);
    return NextResponse.json(
      { error: "Failed to export click tracking data" },
      { status: 500 }
    );
  }
}
