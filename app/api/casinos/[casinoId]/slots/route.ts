import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { auth } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { casinoId: string } }
) {
  const session = await auth();

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Get the casino with its software relations
    const casino = await prisma.casino_p_casinos.findUnique({
      where: {
        id: parseInt(params.casinoId),
      },
      select: {
        id: true,
        casino: true,
        softwares: {
          select: {
            softwarelist: {
              select: {
                id: true,
                software_name: true,
              },
            },
          },
        },
      },
    });

    if (!casino) {
      return new NextResponse("Casino not found", { status: 404 });
    }

    // Get software IDs from the casino's software links
    const softwareIds = casino.softwares
      .map((sw) => sw.softwarelist?.id)
      .filter((id): id is number => id !== null && id !== undefined);

    console.log(`Found software IDs for casino:`, softwareIds);

    // Get games for these software IDs
    const games = await prisma.casino_p_games.findMany({
      where: {
        game_software: {
          in: softwareIds,
        },
        status: 1,
      },
      select: {
        game_name: true,
        game_image: true,
        game_clean_name: true,
      },
      orderBy: {
        game_name: "asc",
      },
    });

    console.log(`Found ${games.length} games for casino`);

    // Transform the games to match the expected interface
    const transformedGames = games.map((game) => ({
      name: game.game_name,
      image: game.game_image || undefined,
      cleanName: game.game_clean_name || undefined,
    }));

    return NextResponse.json(transformedGames);
  } catch (error) {
    console.error("Failed to fetch slots:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
