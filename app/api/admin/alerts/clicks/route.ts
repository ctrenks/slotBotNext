import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();

    // Check if user is admin
    const isAdmin =
      session?.user?.email === "chris@trenkas.com" ||
      session?.user?.email === "carringtoncenno180@gmail.com" ||
      session?.user?.email === "ranrev.info@gmail.com";

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get("alertId");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");
    const format = searchParams.get("format"); // csv, json

    // Base query conditions
    const whereConditions: { alertId?: string } = {};
    if (alertId) {
      whereConditions.alertId = alertId;
    }

    // Fetch click data
    const clicks = await prisma.alertClick.findMany({
      where: whereConditions,
      include: {
        alert: {
          select: {
            id: true,
            message: true,
            casinoName: true,
            slot: true,
            startTime: true,
            endTime: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            geo: true,
            paid: true,
            refferal: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await prisma.alertClick.count({
      where: whereConditions,
    });

    // Format response based on request
    if (format === "csv") {
      // Generate CSV data
      const csvHeaders = [
        "Click ID",
        "Alert ID",
        "Alert Message",
        "Casino",
        "Slot",
        "User ID",
        "User Name",
        "User Email",
        "User Status",
        "User Geo",
        "User Referral",
        "Click Geo",
        "Click Time",
        "Alert Start Time",
        "Alert End Time",
      ];

      const csvRows = clicks.map((click) => [
        click.id,
        click.alertId,
        `"${click.alert?.message?.replace(/"/g, '""') || "N/A"}"`,
        click.alert?.casinoName || "N/A",
        click.alert?.slot || "N/A",
        click.user?.id || "N/A",
        click.user?.name || "N/A",
        click.user?.email || click.userEmail || "N/A",
        click.user?.paid ? "Paid" : "Free",
        click.user?.geo || "N/A",
        click.user?.refferal || "N/A",
        click.geo || "N/A",
        new Date(click.createdAt).toISOString(),
        click.alert?.startTime
          ? new Date(click.alert.startTime).toISOString()
          : "N/A",
        click.alert?.endTime
          ? new Date(click.alert.endTime).toISOString()
          : "N/A",
      ]);

      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map((row) => row.join(",")),
      ].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="alert-clicks-${
            new Date().toISOString().split("T")[0]
          }.csv"`,
        },
      });
    }

    // Default JSON response
    const response = {
      clicks,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      summary: {
        totalClicks: totalCount,
        uniqueUsers: new Set(
          clicks.filter((c) => c.userId).map((c) => c.userId)
        ).size,
        paidUsers: clicks.filter((c) => c.user?.paid).length,
        freeUsers: clicks.filter((c) => c.user && !c.user.paid).length,
        geoBreakdown: clicks.reduce((acc: Record<string, number>, click) => {
          const geo = click.geo || click.user?.geo || "Unknown";
          acc[geo] = (acc[geo] || 0) + 1;
          return acc;
        }, {}),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching alert clicks:", error);
    return NextResponse.json(
      { error: "Failed to fetch alert clicks" },
      { status: 500 }
    );
  }
}
