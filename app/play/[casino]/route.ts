import { PrismaClient } from "@prisma/client";
import { type NextRequest } from "next/server";
import { auth } from "@/auth";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ casino: string }> }
) {
  try {
    // Ensure params are properly handled
    const { casino } = await props.params;

    const session = await auth();

    // Find the casino by clean_name
    const casinoData = await prisma.casino_p_casinos.findFirst({
      where: {
        clean_name: casino,
        approved: 1,
        rogue: 0,
      },
      select: {
        id: true,
        url: true,
        clean_name: true,
      },
    });

    if (!casinoData || !casinoData.url) {
      return new Response("Casino not found", { status: 404 });
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

    // Generate a unique ID for this direct casino click
    const directClickId = `direct_${casinoData.id}_${randomUUID()}`;

    // Record the click
    const click = await prisma.alertClick.create({
      data: {
        alertId: directClickId,
        userId: session?.user?.id || null,
        userEmail: session?.user?.email || null,
        username: session?.user?.name || null,
        geo: userGeo,
      },
    });

    // Log the click for analytics
    console.log("Casino click recorded:", {
      clickId: click.id,
      casinoId: casinoData.id,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      username: session?.user?.name,
      geo: userGeo,
      timestamp: new Date(),
    });

    // Ensure the URL has a protocol
    let redirectUrl = casinoData.url;
    if (!redirectUrl.startsWith("http")) {
      redirectUrl = "https://" + redirectUrl;
    }

    // Log the redirect for debugging
    console.log("Redirecting to:", {
      url: redirectUrl,
      casinoId: casinoData.id,
      casinoName: casinoData.clean_name,
      userGeo,
    });

    // Perform the redirect
    return Response.redirect(new URL(redirectUrl));
  } catch (error) {
    console.error("Error processing casino redirect:", error);
    return new Response("Internal Server Error", { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
