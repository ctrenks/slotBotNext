import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { parseUnsubscribeToken } from "@/app/utils/alertEmailService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return new NextResponse("Missing unsubscribe token", { status: 400 });
    }

    const parsed = parseUnsubscribeToken(token);
    if (!parsed) {
      return new NextResponse("Invalid unsubscribe token", { status: 400 });
    }

    const { userId } = parsed;

    // Update user to disable email notifications
    await prisma.user.update({
      where: { id: userId },
      data: { emailNotifications: false } as { emailNotifications: boolean },
      select: { email: true, name: true },
    });

    // Return a simple HTML page confirming the unsubscribe
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed from SlotBot Alerts</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f3f4f6;
          }
          .container {
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            text-align: center;
          }
          .success {
            color: #059669;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .message {
            color: #374151;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background-color: #10b981;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: bold;
          }
          .button:hover {
            background-color: #059669;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success">✅ Successfully Unsubscribed</div>
          <div class="message">
            You have been unsubscribed from SlotBot alert emails.<br>
            You will no longer receive email notifications for new alerts.
            <br><br>
            You can still access alerts by logging into your account at Beatonlineslots.com.
            <br><br>
            To re-enable email notifications, please visit your account settings.
          </div>
          <a href="${process.env.NEXTAUTH_URL}" class="button">
            Return to Beatonlineslots.com
          </a>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error processing unsubscribe:", error);
    return new NextResponse("Error processing unsubscribe request", {
      status: 500,
    });
  }
}
