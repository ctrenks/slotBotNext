// This script manually creates the Setting table in the database
// Run with: node scripts/create-settings-table.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    // Check if the table already exists by trying to query it
    try {
      await prisma.$queryRaw`SELECT * FROM "Setting" LIMIT 1`;
      console.log("Setting table already exists");
    } catch (error) {
      // Table doesn't exist, create it
      console.log("Creating Setting table...");

      await prisma.$executeRaw`
        CREATE TABLE "Setting" (
          "key" TEXT NOT NULL,
          "value" TEXT NOT NULL,
          CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
        );
      `;

      console.log("Setting table created successfully");
    }

    // Add the default postback URL
    const postbackUrl =
      "http://ad.propellerads.com/conversion.php?aid=3781363&pid=&tid=141360&visitor_id=${SUBID}&payout=${PAYOUT}";

    // Check if the setting already exists
    const existingSetting = await prisma.$queryRaw`
      SELECT * FROM "Setting" WHERE "key" = 'postback_url' LIMIT 1
    `;

    if (existingSetting && existingSetting.length > 0) {
      console.log("Postback URL setting already exists");
    } else {
      // Insert the default postback URL
      await prisma.$executeRaw`
        INSERT INTO "Setting" ("key", "value")
        VALUES ('postback_url', ${postbackUrl})
      `;
      console.log("Default postback URL added");
    }

    console.log("Script completed successfully");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
