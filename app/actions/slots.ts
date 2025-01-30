"use server";

import { prisma } from "@/prisma";
import { auth } from "@/auth";

export async function getSlots(casinoId: number) {
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
          software: true,
        },
      },
    },
  });

  if (!casino) {
    throw new Error("Casino not found");
  }

  console.log("Raw casino data:", JSON.stringify(casino, null, 2));

  // Extract software IDs from the relations
  const softwareIds = casino.softwares
    .map((sw) => sw.software)
    .filter((id): id is number => id !== null && id !== undefined);

  console.log("Software IDs:", softwareIds);

  // First, let's count total games for these software IDs
  const totalGamesCount = await prisma.casino_p_games.count({
    where: {
      game_software: {
        in: softwareIds,
      },
    },
  });

  console.log(
    `Total games found for software IDs ${softwareIds.join(
      ", "
    )}: ${totalGamesCount}`
  );

  // Now let's see games by status
  const gamesByStatus = await prisma.casino_p_games.groupBy({
    by: ["status"],
    where: {
      game_software: {
        in: softwareIds,
      },
    },
    _count: true,
  });

  console.log("Games by status:", gamesByStatus);

  // Get all games for these software IDs
  const games = await prisma.casino_p_games.findMany({
    where: {
      game_software: {
        in: softwareIds,
      },
    },
    select: {
      game_name: true,
      game_image: true,
      game_clean_name: true,
      status: true,
    },
    orderBy: {
      game_name: "asc",
    },
  });

  console.log(
    `Found ${
      games.length
    } total games for casino with software IDs ${softwareIds.join(", ")}`
  );
  console.log(
    "Sample of first few games with their status:",
    games.slice(0, 5)
  );

  // Return only active games (we can adjust the status filter based on what we find)
  const activeGames = games.map((game) => ({
    name: game.game_name,
    image: game.game_image || undefined,
    cleanName: game.game_clean_name || undefined,
  }));

  return activeGames;
}
