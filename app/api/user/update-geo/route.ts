import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";

/**
 * API endpoint to update a user's geo location
 * This endpoint is called when a logged-in user has an empty geo location
 */
export async function POST(request: Request) {
  try {
    // Get the current session
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the geo data from the request
    const data = await request.json();
    const { geo } = data;

    // Validate geo data
    if (!geo || typeof geo !== "string" || geo.length !== 2) {
      return NextResponse.json(
        {
          error: "Invalid geo location format. Expected 2-letter country code.",
        },
        { status: 400 }
      );
    }

    // Update the user's geo location
    await prisma.user.update({
      where: { email: session.user.email },
      data: { geo: geo.toUpperCase() },
    });

    return NextResponse.json({
      success: true,
      message: "Geo location updated successfully",
    });
  } catch (error) {
    console.error("Error updating geo location:", error);
    return NextResponse.json(
      { error: "Failed to update geo location" },
      { status: 500 }
    );
  }
}
