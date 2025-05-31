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
  refferal: string | null;
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
            refferal: true,
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
              // Hide casino name for trial/paid users to encourage sign-in
              !recipient.user.refferal || recipient.user.refferal.trim() === ""
                ? alert.casinoName || "Casino Alert" // Show casino name for NOCODE users
                : "Exclusive Gaming Alert" // Generic subject for trial/paid users
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

  // Determine play URL based on user type
  // NOCODE users (no referral code) get direct casino link
  // Trial/Paid users (have referral code) get redirected to sign in page
  const isNocodeUser = !user.refferal || user.refferal.trim() === "";
  const playUrl = isNocodeUser
    ? `${baseUrl}/out/${alert.id}` // Direct casino link for NOCODE users
    : `${baseUrl}/slotbot`; // Sign in page for trial/paid users

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="dark only">
      <meta name="supported-color-schemes" content="dark">
      <title>New SlotBot Alert</title>
      <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; width: 100% !important; }
        img { display: block; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        .text-white { color: #ffffff !important; }
        .text-gray { color: #b3b3b3 !important; }
        .text-green { color: #0066cc !important; }
        .text-center { text-align: center; }
        .mb-20 { margin-bottom: 20px; }
        .mt-15 { margin-top: 15px; }
        .mt-10 { margin-top: 10px; }
        [data-ogsc] body { background-color: #000000 !important; }
        [data-ogsc] .content { background-color: #1a1a1a !important; }
        [data-ogsc] .alert-box { background-color: #2d2d2d !important; }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #000000; width: 100% !important;" bgcolor="#000000" text="#ffffff" link="#0066cc" vlink="#0066cc" alink="#0066cc">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #000000; width: 100% !important;" bgcolor="#000000">
        <tr>
          <td align="center" style="padding: 20px 0; background-color: #000000;" bgcolor="#000000">
            <!--[if mso]>
            <table width="600" cellpadding="0" cellspacing="0" border="0">
            <tr>
            <td>
            <![endif]-->
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #1a1a1a !important; border-radius: 12px; overflow: hidden; max-width: 600px;" bgcolor="#1a1a1a">
              <!-- Header -->
              <tr>
                <td style="background: #10b981; padding: 30px 20px; text-align: center;" bgcolor="#10b981">
                  <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #ffffff !important;" color="#ffffff">
                    🎰 New SlotBot Alert!
                  </h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td class="content" style="padding: 40px 30px; background-color: #1a1a1a !important;" bgcolor="#1a1a1a">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="color: #ffffff !important;" color="#ffffff">
                        <p style="font-size: 18px; line-height: 1.6; margin: 0 0 20px 0; color: #ffffff !important;" color="#ffffff">
                          Hello <strong style="color: #ffffff !important;" color="#ffffff">${
                            user.name || "there"
                          }</strong>!
                        </p>

                        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 25px 0; color: #b3b3b3 !important;" color="#b3b3b3">
                          We have a new hot alert for you:
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Alert Content -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" class="alert-box" style="background-color: #2d2d2d !important; border-radius: 12px; margin: 25px 0; border-left: 5px solid #10b981;" bgcolor="#2d2d2d">
                    <tr>
                      <td style="padding: 25px; background-color: #2d2d2d !important; color: #ffffff !important;" bgcolor="#2d2d2d" color="#ffffff">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="color: #ffffff !important;" color="#ffffff">
                              ${
                                // Only show casino image for NOCODE users
                                casinoImageUrl && isNocodeUser
                                  ? `
                                <div style="text-align: center; margin-bottom: 20px;">
                                  <img src="${casinoImageUrl}" alt="${
                                      alert.casinoName || "Casino"
                                    }" style="max-width: 180px; height: auto; margin: 0 auto; border-radius: 8px;" />
                                </div>
                              `
                                  : ""
                              }

                              ${
                                slotImageUrl
                                  ? `
                                <div style="text-align: center; margin-bottom: 20px;">
                                  <img src="${slotImageUrl}" alt="${
                                      alert.slot || "Slot"
                                    }" style="max-width: 120px; height: auto; border-radius: 12px; margin: 0 auto; box-shadow: 0 4px 15px rgba(0,0,0,0.3);" />
                                </div>
                              `
                                  : ""
                              }

                              <div style="font-size: 16px; line-height: 1.8; white-space: pre-wrap; margin-bottom: 20px; color: #ffffff !important;" color="#ffffff">
                                ${alert.message}
                              </div>
                            </td>
                          </tr>
                        </table>

                        ${
                          alert.maxWin
                            ? `
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 15px;">
                            <tr>
                              <td style="padding: 15px; background-color: #10b981; border-radius: 10px; text-align: center;" bgcolor="#10b981">
                                <strong style="font-size: 20px; color: #ffffff !important;" color="#ffffff">💰 Max Win: $${alert.maxWin.toLocaleString()}</strong>
                              </td>
                            </tr>
                          </table>
                        `
                            : ""
                        }

                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
                          <tr>
                            ${
                              alert.recommendedBet
                                ? `
                              <td width="48%" style="background-color: #333333 !important; padding: 12px; border-radius: 8px; text-align: center; vertical-align: top;" bgcolor="#333333">
                                <div style="font-size: 12px; margin-bottom: 5px; color: #b3b3b3 !important;" color="#b3b3b3">Recommended Bet</div>
                                <div style="font-size: 16px; font-weight: bold; color: #0066cc !important;" color="#0066cc">$${alert.recommendedBet}</div>
                              </td>
                              <td width="4%"></td>
                            `
                                : ""
                            }

                            ${
                              alert.rtp
                                ? `
                              <td width="48%" style="background-color: #333333 !important; padding: 12px; border-radius: 8px; text-align: center; vertical-align: top;" bgcolor="#333333">
                                <div style="font-size: 12px; margin-bottom: 5px; color: #b3b3b3 !important;" color="#b3b3b3">RTP</div>
                                <div style="font-size: 16px; font-weight: bold; color: #0066cc !important;" color="#0066cc">${alert.rtp}%</div>
                              </td>
                            `
                                : ""
                            }
                          </tr>
                          ${
                            alert.targetWin || alert.stopLimit
                              ? `
                            <tr>
                              <td colspan="3" style="height: 15px;"></td>
                            </tr>
                            <tr>
                              ${
                                alert.targetWin
                                  ? `
                                <td width="48%" style="background-color: #333333 !important; padding: 12px; border-radius: 8px; text-align: center; vertical-align: top;" bgcolor="#333333">
                                  <div style="font-size: 12px; margin-bottom: 5px; color: #b3b3b3 !important;" color="#b3b3b3">Target Win</div>
                                  <div style="font-size: 16px; font-weight: bold; color: #0066cc !important;" color="#0066cc">$${alert.targetWin.toLocaleString()}</div>
                                </td>
                                <td width="4%"></td>
                              `
                                  : ""
                              }

                              ${
                                alert.stopLimit
                                  ? `
                                <td width="48%" style="background-color: #333333 !important; padding: 12px; border-radius: 8px; text-align: center; vertical-align: top;" bgcolor="#333333">
                                  <div style="font-size: 12px; margin-bottom: 5px; color: #b3b3b3 !important;" color="#b3b3b3">Stop Limit</div>
                                  <div style="font-size: 16px; font-weight: bold; color: #0066cc !important;" color="#0066cc">$${alert.stopLimit.toLocaleString()}</div>
                                </td>
                              `
                                  : ""
                              }
                            </tr>
                          `
                              : ""
                          }
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Play Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 40px 0;">
                    ${
                      !isNocodeUser
                        ? `
                    <tr>
                      <td style="color: #b3b3b3 !important; text-align: center; padding-bottom: 15px;" color="#b3b3b3">
                        <p style="font-size: 14px; margin: 0; color: #b3b3b3 !important;" color="#b3b3b3">
                          Click below to sign in to your account and access this alert
                        </p>
                      </td>
                    </tr>
                    `
                        : ""
                    }
                    <tr>
                      <td style="text-align: center;">
                        <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                          <tr>
                            <td style="background-color: #10b981; border-radius: 10px; padding: 18px 40px;" bgcolor="#10b981">
                              <a href="${playUrl}" style="color: #ffffff !important; text-decoration: none; font-weight: bold; font-size: 18px; display: block;" color="#ffffff">
                                ${
                                  isNocodeUser
                                    ? "🎰 PLAY NOW"
                                    : "🔐 SIGN IN TO PLAY"
                                }
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="color: #b3b3b3 !important;" color="#b3b3b3">
                        <p style="font-size: 14px; margin: 30px 0 0 0; text-align: center; font-style: italic; color: #b3b3b3 !important;" color="#b3b3b3">
                          ⏰ This alert is active until ${new Date(
                            alert.endTime
                          ).toLocaleString()}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #0f0f0f !important; padding: 25px 20px; border-top: 1px solid #333;" bgcolor="#0f0f0f">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="color: #b3b3b3 !important;" color="#b3b3b3">
                        <p style="font-size: 12px; margin: 0 0 15px 0; text-align: center; color: #b3b3b3 !important;" color="#b3b3b3">
                          You're receiving this email because you're subscribed to SlotBot alerts.
                        </p>
                        <p style="font-size: 12px; margin: 0; text-align: center; color: #b3b3b3 !important;" color="#b3b3b3">
                          <a href="${unsubscribeUrl}" style="color: #0066cc !important; text-decoration: underline;" color="#0066cc">
                            Disable Future Alert Emails
                          </a> |
                          <a href="${baseUrl}" style="color: #0066cc !important; text-decoration: underline;" color="#0066cc">
                            Beatonlineslots.com
                          </a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <!--[if mso]>
            </td>
            </tr>
            </table>
            <![endif]-->
          </td>
        </tr>
      </table>
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
