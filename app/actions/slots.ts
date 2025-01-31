"use server";

import { prisma } from "@/prisma";
import { auth } from "@/auth";
import { Slot } from "@/app/types/slot";

export async function getSlots(casinoId: number): Promise<Slot[]> {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  // Get the casino with its software relations
  const casino = await prisma.casino_p_casinos.findUnique({
    where: {
      id: casinoId,
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
    throw new Error("Casino not found");
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

  // Transform the games to match the Slot interface
  return games.map((game) => ({
    name: game.game_name,
    image: game.game_image || undefined,
    cleanName: game.game_clean_name || undefined,
  }));
}
