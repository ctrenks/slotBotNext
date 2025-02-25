import { NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { getPostbackUrl } from "@/app/utils/affiliates";

/**
 * API endpoint to handle postbacks for affiliates
 * This endpoint can be called when a user completes a desired action
 * Example: /api/postback?clickid=abc123
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clickId = searchParams.get("clickid");
    const payout = searchParams.get("payout") || "10.00"; // Default payout amount

    if (!clickId) {
      return NextResponse.json(
        { error: "Missing clickid parameter" },
        { status: 400 }
      );
    }

    // Find user with this clickId
    const user = await prisma.user.findFirst({
      where: { clickId },
      select: { id: true, email: true, clickId: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No user found with this clickid" },
        { status: 404 }
      );
    }

    // Get the configured postback URL
    const postbackUrl = await getPostbackUrl();

    if (!postbackUrl) {
      return NextResponse.json(
        { error: "No postback URL configured" },
        { status: 500 }
      );
    }

    // Log the postback
    console.log(
      `Processing postback for clickId: ${clickId}, user: ${user.email}, payout: ${payout}`
    );

    // Replace placeholders in the postback URL
    const finalUrl = postbackUrl
      .replace(/\${SUBID}/g, clickId)
      .replace(/\${PAYOUT}/g, payout);

    // Make the actual HTTP request to the affiliate network
    try {
      const response = await fetch(finalUrl);

      if (!response.ok) {
        return NextResponse.json(
          {
            error: "Failed to send postback to affiliate network",
            status: response.status,
            statusText: response.statusText,
          },
          { status: 502 }
        );
      }

      // Clear the clickId from the user record to prevent duplicate conversions
      await prisma.user.update({
        where: { id: user.id },
        data: { clickId: null },
      });

      // Return success
      return NextResponse.json({
        success: true,
        message: "Postback processed successfully",
        url: finalUrl.replace(clickId, "[REDACTED]"), // Don't expose the actual clickId in the response
      });
    } catch (error) {
      console.error("Error sending postback request:", error);
      return NextResponse.json(
        {
          error: "Failed to send postback request",
          message: error instanceof Error ? error.message : String(error),
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Error processing postback:", error);
    return NextResponse.json(
      { error: "Failed to process postback" },
      { status: 500 }
    );
  }
}
