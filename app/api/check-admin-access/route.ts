import { NextResponse } from "next/server";
import { isAdmin } from "@/app/utils/auth";

export async function GET() {
  try {
    const adminAccess = await isAdmin();

    return NextResponse.json({
      isAdmin: adminAccess,
    });
  } catch (error) {
    console.error("Error checking admin access:", error);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}
