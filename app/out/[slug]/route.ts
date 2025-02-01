import { prisma } from "@/prisma";
import { auth } from "@/auth";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await auth();
    const alertId = params.slug;

    // Find the alert
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
      include: {
        casino: true,
      },
    });

    if (!alert) {
      console.error("Alert not found:", alertId);
      return new Response("Alert not found", { status: 404 });
    }

    // Get user details if logged in
    let userGeo = null;
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { geo: true, name: true },
      });
      userGeo = user?.geo || null;
    }

    // Record the click
    await prisma.alertClick.create({
      data: {
        alertId: alert.id,
        userId: session?.user?.id || null,
        userEmail: session?.user?.email || null,
        username: session?.user?.name || null,
        geo: userGeo,
      },
    });

    // Log the click for analytics
    console.log("Alert click recorded:", {
      alertId: alert.id,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      username: session?.user?.name,
      geo: userGeo,
      timestamp: new Date(),
    });

    // Determine redirect URL
    let redirectUrl: string;

    if (alert.customUrl) {
      // Use custom URL if provided
      redirectUrl = alert.customUrl;
    } else if (alert.casino?.url) {
      // Use the casino's direct URL
      redirectUrl = alert.casino.url;
    } else {
      // If no URLs available, redirect to homepage
      redirectUrl = "/";
    }

    // Log the redirect for debugging
    console.log("Redirecting to:", {
      url: redirectUrl,
      alertId: alert.id,
      casinoId: alert.casinoId,
      userGeo,
      hasCustomUrl: !!alert.customUrl,
      hasCasino: !!alert.casino,
      casinoUrl: alert.casino?.url,
    });

    // Perform the redirect
    return Response.redirect(redirectUrl);
  } catch (error) {
    console.error("Error processing alert click:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
