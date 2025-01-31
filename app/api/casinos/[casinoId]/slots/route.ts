import type { NextRequest } from "next/server";
import { getSlots } from "@/app/actions/slots";

type RouteSegmentProps = {
  params: { casinoId: string };
};

export async function GET(request: NextRequest, props: RouteSegmentProps) {
  try {
    const casinoId = Number.parseInt(props.params.casinoId);
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
