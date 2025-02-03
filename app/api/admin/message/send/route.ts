import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { Resend } from "resend";
import { Prisma } from "@prisma/client";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const session = await auth();

    // Check if user is admin
    if (!session?.user?.email?.endsWith("@trenkas.com")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { subject, message, filter } = body;
    const { referralCode, isPaid, noCode } = filter;

    // Build where clause based on filters
    const where: Prisma.UserWhereInput = {
      email: { not: { equals: "" } }, // Only include users with non-empty email addresses
    };

    // Handle referral code filtering
    if (noCode) {
      where.refferal = { equals: null }; // Look for null referral codes
    } else if (referralCode) {
      where.refferal = referralCode;
    }

    if (isPaid !== undefined) {
      where.paid = isPaid;
    }

    // Get all matching users
    const users = await prisma.user.findMany({
      where,
      select: {
        email: true,
        name: true,
      },
    });

    // Send emails in batches of 50
    const batchSize = 50;
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const emailPromises = batch.map(async (user) => {
        if (!user.email) return; // Skip users without email (shouldn't happen due to where clause)

        try {
          await resend.emails.send({
            from: "SlotBot <alerts@allfreechips.com>",
            to: user.email,
            subject: subject,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10B981;">Hello ${user.name || "there"}!</h2>
                <div style="color: #374151; line-height: 1.6;">
                  ${message.replace(/\n/g, "<br>")}
                </div>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 0.875rem;">
                  <p>You're receiving this email because you're subscribed to SlotBot alerts.</p>
                  <p>AllFreeChips.com - Your trusted source for online casino information.</p>
                </div>
              </div>
            `,
          });
          sentCount++;
        } catch (error) {
          console.error(`Failed to send email to ${user.email}:`, error);
          failedCount++;
        }
      });

      await Promise.all(emailPromises);
    }

    return NextResponse.json({
      sentCount,
      failedCount,
      totalUsers: users.length,
    });
  } catch (error) {
    console.error("Error in send endpoint:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
