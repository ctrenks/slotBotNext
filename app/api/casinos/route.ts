import { NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { auth } from "@/auth";

interface Game {
  game_name: string;
  game_image: string | null;
  game_clean_name: string | null;
}

interface Software {
  games: Game[];
}

interface SoftwareLink {
  softwarelist: Software | null;
}

interface Casino {
  id: number;
  casino: string | null;
  software: string | null;
  softwares: SoftwareLink[];
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // First get all approved casinos
    const casinos = await prisma.casino_p_casinos.findMany({
      where: {
        approved: 1,
        rogue: 0,
      },
      select: {
        id: true,
        casino: true,
        software: true,
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
      orderBy: {
        casino: "asc",
      },
    });

    // For each casino, get its games through the software IDs
    const casinosWithGames = await Promise.all(
      casinos.map(async (casino) => {
        // Get software IDs from the casino's software links
        const softwareIds = casino.softwares
          .map((sw) => sw.softwarelist?.id)
          .filter((id): id is number => id !== null && id !== undefined);

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
        });

        console.log(
          `Casino ${casino.casino} has ${games.length} games from ${softwareIds.length} software providers`
        );

        return {
          id: casino.id,
          name: casino.casino || "",
          software: casino.software || "",
          validGames: games.map((game) => ({
            name: game.game_name,
            image: game.game_image || undefined,
            cleanName: game.game_clean_name || undefined,
          })),
        };
      })
    );

    return NextResponse.json(casinosWithGames);
  } catch (error) {
    console.error("Failed to fetch casinos:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
