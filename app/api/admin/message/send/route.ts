import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { Resend } from "resend";
import { Prisma } from "@prisma/client";

// Check if API key is available
if (!process.env.RESEND_API_KEY) {
  console.error("RESEND_API_KEY is not set in environment variables");
}
console.log(
  "Initializing Resend with API key:",
  process.env.RESEND_API_KEY ? "Present" : "Missing"
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const session = await auth();

    // Check if user is admin
    if (!session?.user?.email?.endsWith("@trenkas.com")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    console.log("Received request body:", body);

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

    console.log("Using where clause:", where);

    // Get all matching users
    const users = await prisma.user.findMany({
      where,
      select: {
        email: true,
        name: true,
      },
    });

    console.log(`Found ${users.length} users to send email to`);

    if (users.length === 0) {
      return NextResponse.json({
        sentCount: 0,
        failedCount: 0,
        totalUsers: 0,
        message: "No users matched the filter criteria",
      });
    }

    // Verify Resend is properly initialized
    try {
      // Test the API key with a simple operation
      await resend.emails.get("test");
    } catch (error) {
      console.error("Failed to verify Resend API key:", error);
      if (error instanceof Error && error.message.includes("unauthorized")) {
        return new NextResponse(
          "Email service configuration error - Invalid API key",
          { status: 500 }
        );
      }
    }

    // Send emails in batches of 50
    const batchSize = 50;
    let sentCount = 0;
    let failedCount = 0;
    let lastError = null;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(
          users.length / batchSize
        )}`
      );

      const emailPromises = batch.map(async (user) => {
        if (!user.email) {
          console.log("Skipping user with no email");
          return;
        }

        try {
          console.log(`Attempting to send email to ${user.email}`);
          const emailResponse = await resend.emails.send({
            from: "SlotBot <accounts@beatonlineslots.com>",
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
                  <p>Beatonlineslots.com - Your trusted source for online casino information.</p>
                </div>
              </div>
            `,
          });
          console.log(
            `Successfully sent email to ${user.email}`,
            emailResponse
          );
          sentCount++;
        } catch (error) {
          console.error(`Failed to send email to ${user.email}:`, error);
          if (error instanceof Error) {
            console.error("Error details:", error.message, error.stack);
            lastError = error;
          }
          failedCount++;
        }
      });

      try {
        await Promise.all(emailPromises);
        console.log(`Completed batch ${Math.floor(i / batchSize) + 1}`);
      } catch (error) {
        console.error("Error in batch processing:", error);
        if (error instanceof Error) {
          console.error("Batch error details:", error.message, error.stack);
          lastError = error;
        }
      }
    }

    console.log(
      `Email sending complete. Sent: ${sentCount}, Failed: ${failedCount}, Total: ${users.length}`
    );

    // If no emails were sent successfully and we have an error, return it
    if (sentCount === 0 && lastError) {
      return new NextResponse(
        `Failed to send any emails: ${lastError.message}`,
        { status: 500 }
      );
    }

    return NextResponse.json({
      sentCount,
      failedCount,
      totalUsers: users.length,
      lastError: lastError ? lastError.message : null,
    });
  } catch (error) {
    console.error("Error in send endpoint:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
    }
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      { status: 500 }
    );
  }
}
