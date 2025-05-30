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

  const playUrl =
    alertData.customUrl ||
    (alertData.casinoCleanName
      ? `${baseUrl}/play/${alertData.casinoCleanName}`
      : `${baseUrl}`);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test SlotBot Alert</title>
      <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        img { display: block; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        .container { width: 100%; background-color: #000000; padding: 20px 0; }
        .email-wrapper { max-width: 600px; width: 100%; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center; }
        .content { padding: 40px 30px; background-color: #1a1a1a; }
        .alert-box { background-color: #2d2d2d; border-radius: 12px; padding: 25px; margin: 25px 0; border-left: 5px solid #10b981; }
        .play-button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; text-decoration: none; padding: 18px 40px; border-radius: 10px; font-weight: bold; font-size: 18px; text-align: center; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); transition: all 0.3s ease; }
        .footer { background-color: #0f0f0f; padding: 25px 20px; border-top: 1px solid #333; }
        .warning-box { background-color: #fbbf24; border-radius: 10px; padding: 20px; margin: 25px 0; border-left: 5px solid #f59e0b; }
        .text-white { color: #ffffff !important; }
        .text-gray { color: #b3b3b3 !important; }
        .text-green { color: #10b981 !important; }
        .text-orange { color: #f59e0b !important; }
        .text-center { text-align: center; }
        .mb-20 { margin-bottom: 20px; }
        .mt-15 { margin-top: 15px; }
        .mt-10 { margin-top: 10px; }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #000000;">
      <div class="container">
        <div class="email-wrapper">
          <!-- Header -->
          <div class="header">
            <h1 class="text-white" style="margin: 0; font-size: 28px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
              🎰 TEST SlotBot Alert!
            </h1>
          </div>

          <!-- Content -->
          <div class="content">
            <p class="text-white mb-20" style="font-size: 18px; line-height: 1.6; margin: 0 0 20px 0;">
              Hello <strong>${user.name || "there"}</strong>!
            </p>

            <p class="text-gray mb-20" style="font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
              This is a <strong class="text-white">TEST EMAIL</strong> for the following alert:
            </p>

            <!-- Alert Content -->
            <div class="alert-box">
              ${
                casinoImageUrl
                  ? `
                <div class="text-center mb-20">
                  <img src="${casinoImageUrl}" alt="${
                      alertData.casinoName || "Casino"
                    }" style="max-width: 180px; height: auto; margin: 0 auto; border-radius: 8px;" />
                </div>
              `
                  : ""
              }

              ${
                slotImageUrl
                  ? `
                <div class="text-center mb-20">
                  <img src="${slotImageUrl}" alt="${
                      alertData.slot || "Slot"
                    }" style="max-width: 120px; height: auto; border-radius: 12px; margin: 0 auto; box-shadow: 0 4px 15px rgba(0,0,0,0.3);" />
                </div>
              `
                  : ""
              }

              <div class="text-white" style="font-size: 16px; line-height: 1.8; white-space: pre-wrap; margin-bottom: 20px;">
                ${alertData.message || "No message provided"}
              </div>

              ${
                alertData.maxWin
                  ? `
                <div class="mt-15" style="padding: 15px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 10px; text-align: center;">
                  <strong class="text-white" style="font-size: 20px;">💰 Max Win: $${alertData.maxWin.toLocaleString()}</strong>
                </div>
              `
                  : ""
              }

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
                ${
                  alertData.recommendedBet
                    ? `
                  <div style="background-color: #333; padding: 12px; border-radius: 8px; text-align: center;">
                    <div class="text-gray" style="font-size: 12px; margin-bottom: 5px;">Recommended Bet</div>
                    <div class="text-green" style="font-size: 16px; font-weight: bold;">$${alertData.recommendedBet}</div>
                  </div>
                `
                    : ""
                }

                ${
                  alertData.rtp
                    ? `
                  <div style="background-color: #333; padding: 12px; border-radius: 8px; text-align: center;">
                    <div class="text-gray" style="font-size: 12px; margin-bottom: 5px;">RTP</div>
                    <div class="text-green" style="font-size: 16px; font-weight: bold;">${alertData.rtp}%</div>
                  </div>
                `
                    : ""
                }

                ${
                  alertData.targetWin
                    ? `
                  <div style="background-color: #333; padding: 12px; border-radius: 8px; text-align: center;">
                    <div class="text-gray" style="font-size: 12px; margin-bottom: 5px;">Target Win</div>
                    <div class="text-green" style="font-size: 16px; font-weight: bold;">$${alertData.targetWin.toLocaleString()}</div>
                  </div>
                `
                    : ""
                }

                ${
                  alertData.stopLimit
                    ? `
                  <div style="background-color: #333; padding: 12px; border-radius: 8px; text-align: center;">
                    <div class="text-gray" style="font-size: 12px; margin-bottom: 5px;">Stop Limit</div>
                    <div class="text-green" style="font-size: 16px; font-weight: bold;">$${alertData.stopLimit.toLocaleString()}</div>
                  </div>
                `
                    : ""
                }
              </div>
            </div>

            <!-- Play Button -->
            <div class="text-center" style="margin: 40px 0;">
              <a href="${playUrl}" class="play-button">
                🎰 PLAY NOW
              </a>
            </div>

            <!-- Test Warning -->
            <div class="warning-box">
              <p class="text-orange" style="font-size: 16px; margin: 0; font-weight: bold; text-align: center;">
                ⚠️ This is a test email. No actual alert has been created.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p class="text-gray" style="font-size: 12px; margin: 0 0 15px 0; text-align: center;">
              This is a test email for SlotBot alert functionality.
            </p>
            <p class="text-gray" style="font-size: 12px; margin: 0; text-align: center;">
              <a href="${unsubscribeUrl}" style="color: #10b981; text-decoration: underline;">
                Disable Future Alert Emails
              </a> |
              <a href="${baseUrl}" style="color: #10b981; text-decoration: underline;">
                Beatonlineslots.com
              </a>
            </p>
          </div>
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
