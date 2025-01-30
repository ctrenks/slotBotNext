import { NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { auth } from "@/auth";

export async function GET(
  request: Request,
  context: { params: { casinoId: string } }
) {
  const session = await auth();
  const { casinoId } = context.params;

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Get the casino with its software relations
    const casino = await prisma.casino_p_casinos.findUnique({
      where: {
        id: parseInt(casinoId),
      },
      include: {
        softwares: true,
      },
    });

    if (!casino) {
      return new NextResponse("Casino not found", { status: 404 });
    }
    console.log(casino.softwares);
    // Extract software numbers from the relations
    const softwareNumbers = casino.softwares
      .map((sw) => sw.software)
      .filter(
        (software): software is number =>
          software !== null && software !== undefined
      );

    console.log(`Found software numbers for casino:`, softwareNumbers);

    // Get all games for these software numbers
    const games = await prisma.casino_p_games.findMany({
      where: {
        game_software: {
          in: softwareNumbers,
        },
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
