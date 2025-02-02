import { NextResponse } from "next/server";

export async function GET() {
  try {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    console.log("Requested VAPID public key:", publicKey);

    if (!publicKey) {
      console.error("VAPID public key not found in environment variables");
      return NextResponse.json(
        { error: "VAPID public key not configured" },
        { status: 500 }
      );
    }

    // Return the public key as plain text
    return new NextResponse(publicKey, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("Error retrieving VAPID public key:", error);
    return NextResponse.json(
      { error: "Failed to retrieve VAPID public key" },
      { status: 500 }
    );
  }
}
