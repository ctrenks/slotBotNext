import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/app/utils/auth";

export async function GET() {
  try {
    console.log("🔍 Debug Admin API: Starting debug check...");

    const session = await auth();
    console.log("🔍 Debug Admin API: Session:", {
      hasSession: !!session,
      userEmail: session?.user?.email,
      userName: session?.user?.name,
    });

    const adminResult = await isAdmin();
    console.log("🔍 Debug Admin API: isAdmin() result:", adminResult);

    return NextResponse.json({
      success: true,
      session: {
        hasSession: !!session,
        email: session?.user?.email,
        name: session?.user?.name,
      },
      isAdmin: adminResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("💥 Debug Admin API: Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
