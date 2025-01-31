"use server";

import { prisma } from "@/prisma";
import { auth } from "@/auth";
import type { Slot } from "@/app/types/slot";

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
      clean_name: true,
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

  // Get games for these software IDs
  const games = await prisma.casino_p_games.findMany({
    where: {
      game_software: {
        in: softwareIds,
      },
      vercel_image_url: {
        not: null,
      },
    },
    select: {
      game_name: true,
      game_image: true,
      game_clean_name: true,
      vercel_image_url: true,
    },
    orderBy: {
      game_name: "asc",
    },
  });

  // Transform the games to match the Slot interface
  return games.map((game) => ({
    name: game.game_name,
    image: game.vercel_image_url || game.game_image || undefined,
    cleanName: game.game_clean_name || undefined,
  }));
}

export async function getSlotsForCasino(casinoId: string) {
  try {
    const parsedId = Number.parseInt(casinoId);
    if (isNaN(parsedId)) {
      throw new Error("Invalid casino ID");
    }

    return await getSlots(parsedId);
  } catch (error) {
    console.error("Failed to fetch slots:", error);
    throw error;
  }
}
