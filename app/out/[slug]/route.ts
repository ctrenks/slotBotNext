import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { type NextRequest } from "next/server";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    // Ensure params are properly handled
    const { slug } = await props.params;
    const alertId = slug;

    const session = await auth();

    // Find the alert and its associated casino
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
      include: {
        casino: {
          select: {
            id: true,
            url: true,
            clean_name: true,
          },
        },
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
    //console.log("WRITING CLICK", alert.id);
    // Record the click
    const click = await prisma.alertClick.create({
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
      clickId: click.id,
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
      redirectUrl = "https://www.allfreechips.com";
    }

    // Log the redirect for debugging
    console.log("Redirecting to:", {
      url: redirectUrl,
      alertId: alert.id,
      casinoId: alert.casinoId,
      casinoName: alert.casino?.clean_name,
      userGeo,
      hasCustomUrl: !!alert.customUrl,
      hasCasino: !!alert.casino,
      casinoUrl: alert.casino?.url,
    });

    // Ensure the URL is valid and has a protocol
    if (!redirectUrl.startsWith("http")) {
      redirectUrl = "https://" + redirectUrl;
    }

    // Perform the redirect using the new Response.redirect
    return Response.redirect(new URL(redirectUrl));
  } catch (error) {
    console.error("Error processing alert click:", error);
    return new Response("Internal Server Error", { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
