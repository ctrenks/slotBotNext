import { type NextRequest, NextResponse } from "next/server";
import { getSlots } from "@/app/actions/slots";
import type { Slot, SlotError } from "@/app/types/slot";

export async function GET(
  request: NextRequest,
  { params }: { params: { casinoId: string } }
): Promise<NextResponse<Slot[] | SlotError>> {
  try {
    const casinoId = Number.parseInt(params.casinoId);
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
