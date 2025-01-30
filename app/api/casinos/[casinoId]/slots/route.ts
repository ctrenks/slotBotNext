import { NextResponse } from "next/server";
import { getSlots } from "@/app/actions/slots";

export async function GET(
  _request: Request,
  context: { params: { casinoId: string } }
) {
  try {
    const games = await getSlots(parseInt(context.params.casinoId));
    return NextResponse.json(games);
  } catch (error) {
    console.error("Failed to fetch slots:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
