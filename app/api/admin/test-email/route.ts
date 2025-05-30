import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface AlertData {
  message?: string;
  casinoId?: number;
  casinoName?: string;
  casinoCleanName?: string;
  casinoImage?: string;
  slot?: string;
  slotImage?: string;
  customUrl?: string;
  maxPotential?: number;
  recommendedBet?: number;
  stopLimit?: number;
  targetWin?: number;
  maxWin?: number;
  rtp?: number;
  duration?: number;
  geoTargets?: string[];
  referralCodes?: string[];
}

// Helper function to generate unsubscribe token (copied from alertEmailService)
function generateUnsubscribeToken(userId: string): string {
  return Buffer.from(`${userId}:${Date.now()}`).toString("base64");
}

// Helper function to generate alert email HTML (simplified version)
function generateTestAlertEmailHTML(
  alertData: AlertData,
  user: { email: string; name: string },
  unsubscribeUrl: string
): string {
  const baseUrl = "https://www.beatonlineslots.com";

  const casinoImageUrl = alertData.casinoImage
    ? `${baseUrl}/image/casino/${alertData.casinoImage}`
    : null;

  const slotImageUrl = alertData.slotImage
    ? `${baseUrl}/image/sloticonssquare/${alertData.slotImage}`
    : null;

  const playUrl = alertData.customUrl || `${baseUrl}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test SlotBot Alert</title>
      <style>
        img {
          display: block;
          border: 0;
          outline: none;
          text-decoration: none;
          -ms-interpolation-mode: bicubic;
        }
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
          <h1 style="color: #ffffff !important; margin: 0; font-size: 24px; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">🎰 TEST SlotBot Alert!</h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px 20px; background-color: #ffffff;">
          <p class="content-text" style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
            Hello ${user.name || "there"}!
          </p>

          <p class="content-text" style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
            This is a <strong>TEST EMAIL</strong> for the following alert:
          </p>

          <!-- Alert Content -->
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
            ${
              casinoImageUrl
                ? `
              <div style="text-align: center; margin-bottom: 15px;">
                <img src="${casinoImageUrl}" alt="${
                    alertData.casinoName || "Casino"
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
                    alertData.slot || "Slot"
                  }" style="max-width: 100px; height: auto; border-radius: 8px; margin: 0 auto;" />
              </div>
            `
                : ""
            }

            <div style="color: #374151; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${
              alertData.message || "No message provided"
            }</div>

            ${
              alertData.maxWin
                ? `
              <div style="margin-top: 15px; padding: 10px; background-color: #ecfdf5; border-radius: 6px;">
                <strong style="color: #059669;">Max Win: $${alertData.maxWin}</strong>
              </div>
            `
                : ""
            }

            ${
              alertData.recommendedBet
                ? `
              <div style="margin-top: 10px; color: #6b7280; font-size: 14px;">
                Recommended Bet: $${alertData.recommendedBet}
              </div>
            `
                : ""
            }

            ${
              alertData.rtp
                ? `
              <div style="margin-top: 10px; color: #6b7280; font-size: 14px;">
                RTP: ${alertData.rtp}%
              </div>
            `
                : ""
            }

            ${
              alertData.targetWin
                ? `
              <div style="margin-top: 10px; color: #6b7280; font-size: 14px;">
                Target Win: $${alertData.targetWin}
              </div>
            `
                : ""
            }

            ${
              alertData.stopLimit
                ? `
              <div style="margin-top: 10px; color: #6b7280; font-size: 14px;">
                Stop Limit: $${alertData.stopLimit}
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

          <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: bold;">
              ⚠️ This is a test email. No actual alert has been created.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0; text-align: center;">
            This is a test email for SlotBot alert functionality.
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

export async function POST(request: Request) {
  try {
    console.log("🚀 Test email API called");

    const session = await auth();
    console.log("👤 Session:", {
      email: session?.user?.email,
      hasSession: !!session,
    });

    // Check if user is admin
    const isAdmin =
      session?.user?.email === "chris@trenkas.com" ||
      session?.user?.email === "carringtoncenno180@gmail.com";

    console.log("🔐 Admin check:", {
      isAdmin,
      userEmail: session?.user?.email,
    });

    if (!isAdmin) {
      console.log("❌ Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("📦 Request body:", {
      hasEmail: !!body.email,
      email: body.email,
      hasAlertData: !!body.alertData,
      alertDataKeys: body.alertData ? Object.keys(body.alertData) : [],
    });

    const { email, alertData } = body;

    if (!email) {
      console.log("❌ No email provided");
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    if (!alertData) {
      console.log("❌ No alert data provided");
      return NextResponse.json(
        { error: "Alert data is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("❌ Invalid email format:", email);
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    console.log("✅ Validation passed, preparing email");

    // Create a mock user object
    const mockUser = {
      email: email,
      name: "Test User",
    };

    // Generate unsubscribe URL
    const unsubscribeUrl = `${
      process.env.NEXTAUTH_URL
    }/api/unsubscribe?token=${generateUnsubscribeToken("test-user")}`;

    console.log("🔗 Unsubscribe URL:", unsubscribeUrl);

    // Send the test email
    const emailPayload = {
      from: "SlotBot Alerts <alerts@beatonlineslots.com>",
      to: email,
      subject: `🎰 TEST SlotBot Alert: ${
        alertData.casinoName || "Test Casino"
      }`,
      html: generateTestAlertEmailHTML(alertData, mockUser, unsubscribeUrl),
    };

    console.log("📧 Email payload:", {
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
      htmlLength: emailPayload.html.length,
      hasResendKey: !!process.env.RESEND_API_KEY,
    });

    const emailResult = await resend.emails.send(emailPayload);
    console.log("📨 Resend result:", emailResult);

    if (emailResult.error) {
      console.error("❌ Resend error:", emailResult.error);
      throw new Error(`Resend error: ${emailResult.error.message}`);
    }

    console.log(
      `✅ Test email sent successfully to: ${email} by admin: ${session.user.email}`
    );

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${email}`,
      resendId: emailResult.data?.id,
    });
  } catch (error) {
    console.error("💥 Error sending test email:", error);
    return NextResponse.json(
      {
        error: "Failed to send test email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
