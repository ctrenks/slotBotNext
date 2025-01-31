import { type NextRequest, NextResponse } from "next/server";
import { getSlots } from "@/app/actions/slots";

export async function GET(
  request: NextRequest,
  context: { params: { casinoId: string } }
): Promise<NextResponse> {
  try {
    const casinoId = Number.parseInt(context.params.casinoId);
    if (isNaN(casinoId)) {
      return NextResponse.json({ error: "Invalid casino ID" }, { status: 400 });
    }

    const games = await getSlots(casinoId);
    return NextResponse.json(games);
  } catch (error) {
    console.error("Failed to fetch slots:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
