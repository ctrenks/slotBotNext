import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    console.log("Testing email send to chris@trenkas.com");

    const result = await resend.emails.send({
      from: "SlotBot Test <alerts@beatonlineslots.com>",
      to: "chris@trenkas.com",
      subject: "🧪 Test Email - SlotBot",
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify delivery to chris@trenkas.com</p>
        <p>Sent at: ${new Date().toLocaleString()}</p>
      `,
    });

    console.log("Email send result:", result);

    return NextResponse.json({
      success: true,
      result: result,
      message: "Test email sent successfully",
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error,
      },
      { status: 500 }
    );
  }
}
