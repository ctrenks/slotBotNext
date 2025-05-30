import { Resend } from "resend";
import { prisma } from "@/prisma";
import { Alert } from "@prisma/client";

const resend = new Resend(process.env.RESEND_API_KEY);

interface AlertWithCasino extends Alert {
  casino?: {
    id: number;
    url: string | null;
    button: string | null;
    clean_name: string | null;
  } | null;
}

interface EmailUser {
  id: string;
  email: string;
  name: string | null;
  emailNotifications: boolean;
}

export async function sendAlertEmails(alert: AlertWithCasino) {
  try {
    console.log("🚀 Starting to send alert emails for alert:", alert.id);
    console.log("Alert details:", {
      id: alert.id,
      message: alert.message.substring(0, 100) + "...",
      referralCodes: alert.referralCodes,
      geoTargets: alert.geoTargets,
    });

    // Get all recipients for this alert
    const recipients = await prisma.alertRecipient.findMany({
      where: {
        alertId: alert.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            emailNotifications: true,
          },
        },
      },
    });

    console.log(
      `📋 Found ${recipients.length} total recipients for alert ${alert.id}`
    );
    console.log(
      "📧 Recipients details:",
      recipients.map((r) => ({
        email: r.user.email,
        emailNotifications: r.user.emailNotifications,
        hasEmailField: r.user.emailNotifications !== undefined,
      }))
    );

    // Filter recipients who have email notifications enabled
    // emailNotifications defaults to true, so we only exclude users who explicitly set it to false
    const emailEnabledRecipients = recipients.filter((recipient) => {
      const emailNotifications = recipient.user.emailNotifications;
      const isEnabled = emailNotifications !== false; // null, undefined, or true = enabled

      console.log(
        `👤 User ${
          recipient.user.email
        }: emailNotifications=${emailNotifications} (type: ${typeof emailNotifications}), isEnabled=${isEnabled}`
      );

      return isEnabled;
    });

    console.log(
      `✅ Found ${emailEnabledRecipients.length} recipients with email notifications enabled out of ${recipients.length} total recipients`
    );

    if (emailEnabledRecipients.length === 0) {
      console.log(
        "❌ No recipients with email notifications enabled - stopping email send"
      );
      return { sentCount: 0, failedCount: 0 };
    }

    // Check environment variables
    console.log("🔧 Environment check:", {
      hasResendKey: !!process.env.RESEND_API_KEY,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nextAuthUrl: process.env.NEXTAUTH_URL,
    });

    let sentCount = 0;
    let failedCount = 0;

    // Send emails with rate limiting to avoid Resend's 10 requests per second limit
    const batchSize = 8; // Send 8 emails per second to stay under the 10/sec limit
    const delayBetweenEmails = 125; // 125ms delay = 8 emails per second

    for (let i = 0; i < emailEnabledRecipients.length; i += batchSize) {
      const batch = emailEnabledRecipients.slice(i, i + batchSize);

      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1}, emails: ${batch
          .map((r) => r.user.email)
          .join(", ")}`
      );

      // Send emails sequentially within each batch to respect rate limits
      for (const recipient of batch) {
        try {
          console.log(
            `📤 Attempting to send email to: ${recipient.user.email}`
          );

          const unsubscribeUrl = `${
            process.env.NEXTAUTH_URL
          }/api/unsubscribe?token=${generateUnsubscribeToken(
            recipient.user.id
          )}`;

          console.log(`🔗 Generated unsubscribe URL: ${unsubscribeUrl}`);

          const emailPayload = {
            from: "SlotBot Alerts <alerts@beatonlineslots.com>",
            to: recipient.user.email,
            subject: `🎰 New SlotBot Alert: ${
              alert.casinoName || "Casino Alert"
            }`,
            html: generateAlertEmailHTML(
              alert,
              {
                ...recipient.user,
                emailNotifications: true,
              },
              unsubscribeUrl
            ),
          };

          console.log(`📨 Email payload:`, {
            from: emailPayload.from,
            to: emailPayload.to,
            subject: emailPayload.subject,
            htmlLength: emailPayload.html.length,
          });

          const emailResult = await resend.emails.send(emailPayload);

          console.log(
            `✅ Successfully sent alert email to ${recipient.user.email}:`,
            {
              resendId: emailResult.data?.id,
              error: emailResult.error,
            }
          );
          sentCount++;

          // Add delay between emails to respect rate limits (except for the last email in batch)
          if (batch.indexOf(recipient) < batch.length - 1) {
            await new Promise((resolve) =>
              setTimeout(resolve, delayBetweenEmails)
            );
          }
        } catch (error) {
          console.error(
            `❌ Failed to send alert email to ${recipient.user.email}:`,
            {
              error: error,
              errorMessage:
                error instanceof Error ? error.message : "Unknown error",
              errorStack: error instanceof Error ? error.stack : undefined,
            }
          );
          failedCount++;
        }
      }

      // Longer delay between batches to be extra safe
      if (i + batchSize < emailEnabledRecipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(
      `Alert email sending complete. Sent: ${sentCount}, Failed: ${failedCount}`
    );
    return { sentCount, failedCount };
  } catch (error) {
    console.error("Error sending alert emails:", error);
    throw error;
  }
}

function generateAlertEmailHTML(
  alert: AlertWithCasino,
  user: EmailUser,
  unsubscribeUrl: string
): string {
  // Use the correct base URL for images - ensure we use the production domain
  const baseUrl = "https://www.beatonlineslots.com";

  const casinoImageUrl = alert.casino?.button
    ? `${baseUrl}/image/casino/${alert.casino.button}`
    : null;

  const slotImageUrl = alert.slotImage
    ? `${baseUrl}/image/sloticonssquare/${alert.slotImage}`
    : null;

  const playUrl = `${baseUrl}/out/${alert.id}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New SlotBot Alert</title>
      <style>
        /* Ensure images display properly in email clients */
        img {
          display: block;
          border: 0;
          outline: none;
          text-decoration: none;
          -ms-interpolation-mode: bicubic;
        }
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .email-container {
            background-color: #1f2937 !important;
          }
          .content-text {
            color: #f9fafb !important;
          }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
      <div class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; text-align: center;">
          <h1 style="color: #ffffff !important; margin: 0; font-size: 24px; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">🎰 New SlotBot Alert!</h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px 20px; background-color: #ffffff;">
          <p class="content-text" style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
            Hello ${user.name || "there"}!
          </p>

          <p class="content-text" style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
            We have a new alert for you:
          </p>

          <!-- Alert Content -->
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
            ${
              casinoImageUrl
                ? `
              <div style="text-align: center; margin-bottom: 15px;">
                <img src="${casinoImageUrl}" alt="${
                    alert.casinoName || "Casino"
                  }" style="max-width: 150px; height: auto; margin: 0 auto;" />
              </div>
            `
                : ""
            }

            ${
              slotImageUrl
                ? `
              <div style="text-align: center; margin-bottom: 15px;">
                <img src="${slotImageUrl}" alt="${
                    alert.slot || "Slot"
                  }" style="max-width: 100px; height: auto; border-radius: 8px; margin: 0 auto;" />
              </div>
            `
                : ""
            }

            <div style="color: #374151; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${
              alert.message
            }</div>

            ${
              alert.maxPotential
                ? `
              <div style="margin-top: 15px; padding: 10px; background-color: #ecfdf5; border-radius: 6px;">
                <strong style="color: #059669;">Max Potential: $${alert.maxPotential}</strong>
              </div>
            `
                : ""
            }

            ${
              alert.recommendedBet
                ? `
              <div style="margin-top: 10px; color: #6b7280; font-size: 14px;">
                Recommended Bet: $${alert.recommendedBet}
              </div>
            `
                : ""
            }
          </div>

          <!-- Play Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${playUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff !important; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 18px; border: none;">
              🎰 Play Now
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
            This alert is active until ${new Date(
              alert.endTime
            ).toLocaleString()}.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0; text-align: center;">
            You're receiving this email because you're subscribed to SlotBot alerts.
          </p>
          <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
            <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">
              Disable Future Alert Emails
            </a> |
            <a href="${baseUrl}" style="color: #6b7280; text-decoration: underline;">
              Beatonlineslots.com
            </a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateUnsubscribeToken(userId: string): string {
  // Create a simple token for unsubscribe functionality
  // In production, you might want to use JWT or a more secure method
  return Buffer.from(`${userId}:${Date.now()}`).toString("base64");
}

export function parseUnsubscribeToken(
  token: string
): { userId: string; timestamp: number } | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [userId, timestamp] = decoded.split(":");
    return { userId, timestamp: parseInt(timestamp) };
  } catch (error) {
    console.error("Error parsing unsubscribe token:", error);
    return null;
  }
}
