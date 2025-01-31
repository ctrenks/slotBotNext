import type { NextRequest } from "next/server";
import { getSlots } from "@/app/actions/slots";

export async function GET(
  request: NextRequest,
  { params }: { params: { casinoId: string } } & any
) {
  try {
    const casinoId = Number.parseInt(params.casinoId);
    if (isNaN(casinoId)) {
      return Response.json({ error: "Invalid casino ID" }, { status: 400 });
    }

    const games = await getSlots(casinoId);
    return Response.json(games);
  } catch (error) {
    console.error("Failed to fetch slots:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return Response.json({ error: message }, { status: 500 });
  }
}
