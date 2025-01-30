import { NextResponse } from "next/server";
import { getSlots } from "@/app/actions/slots";

type RouteContext = {
  params: {
    casinoId: string;
  };
};

export async function GET(_: Request, context: RouteContext) {
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
