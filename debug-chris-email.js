require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function debugChrisEmail() {
  try {
    console.log("=== Debugging Chris's Email Issue ===\n");

    // 1. Check Chris's user record
    console.log("1. Chris's User Record:");
    const chris = await prisma.user.findUnique({
      where: { email: "chris@trenkas.com" },
      select: {
        id: true,
        email: true,
        name: true,
        emailNotifications: true,
        paid: true,
        trial: true,
        geo: true,
        refferal: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!chris) {
      console.log("❌ Chris's user record not found!");
      return;
    }

    console.log("✅ User found:", chris);
    console.log(
      "Email notifications enabled:",
      chris.emailNotifications !== false
    );

    // 2. Check recent alerts
    console.log("\n2. Recent Alerts (last 5):");
    const recentAlerts = await prisma.alert.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        recipients: {
          where: { userId: chris.id },
          select: {
            id: true,
            read: true,
            createdAt: true,
          },
        },
      },
    });

    console.log(`Found ${recentAlerts.length} recent alerts`);

    for (const alert of recentAlerts) {
      const isRecipient = alert.recipients.length > 0;
      const now = new Date();
      const isActive = now >= alert.startTime && now <= alert.endTime;

      console.log(`\nAlert ${alert.id}:`);
      console.log(`  Message: ${alert.message.substring(0, 50)}...`);
      console.log(`  Created: ${alert.createdAt.toLocaleString()}`);
      console.log(`  Start: ${alert.startTime.toLocaleString()}`);
      console.log(`  End: ${alert.endTime.toLocaleString()}`);
      console.log(`  Currently Active: ${isActive}`);
      console.log(`  Chris is recipient: ${isRecipient}`);
      console.log(`  Geo targets: ${alert.geoTargets.join(", ")}`);
      console.log(`  Referral codes: ${alert.referralCodes.join(", ")}`);

      if (isRecipient) {
        console.log(`  Read status: ${alert.recipients[0].read}`);
      }
    }

    // 3. Check all alert recipients for Chris
    console.log("\n3. All Alert Recipients for Chris:");
    const allRecipients = await prisma.alertRecipient.findMany({
      where: { userId: chris.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        alert: {
          select: {
            id: true,
            message: true,
            createdAt: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    console.log(
      `Chris has received ${allRecipients.length} alerts total (showing last 10)`
    );

    // 4. Check targeting criteria match
    console.log("\n4. Targeting Analysis:");
    console.log(`Chris's geo: ${chris.geo || "null"}`);
    console.log(`Chris's referral: ${chris.refferal || "null"}`);
    console.log(`Chris's paid status: ${chris.paid}`);
    console.log(
      `Chris's trial: ${chris.trial ? chris.trial.toLocaleString() : "null"}`
    );

    const now = new Date();
    const hasValidTrial = chris.trial && chris.trial > now;
    const hasPaidAccess = chris.paid;

    console.log(`Has valid trial: ${hasValidTrial}`);
    console.log(`Has paid access: ${hasPaidAccess}`);
    console.log(`Should receive alerts: ${hasValidTrial || hasPaidAccess}`);

    // 5. Check most recent alert creation logs
    console.log("\n5. Most Recent Alert Details:");
    if (recentAlerts.length > 0) {
      const latestAlert = recentAlerts[0];

      // Get all recipients for the latest alert
      const allRecipientsForLatest = await prisma.alertRecipient.findMany({
        where: { alertId: latestAlert.id },
        include: {
          user: {
            select: {
              email: true,
              emailNotifications: true,
              geo: true,
              refferal: true,
            },
          },
        },
      });

      console.log(
        `Latest alert ${latestAlert.id} has ${allRecipientsForLatest.length} total recipients:`
      );

      for (const recipient of allRecipientsForLatest) {
        const emailEnabled = recipient.user.emailNotifications !== false;
        console.log(
          `  ${recipient.user.email}: emailNotifications=${recipient.user.emailNotifications}, enabled=${emailEnabled}`
        );
      }
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugChrisEmail();
