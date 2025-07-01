import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import imageType, { minimumBytes } from "image-type";

export const runtime = "nodejs";

export async function GET(
  _: NextRequest,
  props: { params: Promise<{ filename: string }> }
) {
  try {
    const params = await props.params;
    const filename = decodeURIComponent(params.filename);

    // Find the slot win record with this filename in the imageUrl
    const slotWin = await prisma.slotWin.findFirst({
      where: {
        imageUrl: {
          contains: filename,
        },
        approved: true, // Only serve approved images
      },
      select: {
        imageUrl: true,
      },
    });

    if (!slotWin?.imageUrl) {
      return new NextResponse("Image not found", { status: 404 });
    }

    // Fetch the image from the blob storage
    const response = await fetch(slotWin.imageUrl);
    if (!response.ok) {
      return new NextResponse("Failed to fetch image", { status: 404 });
    }

    const blob = await response.blob();
    const headers = new Headers();

    // Detect the image type
    const detect = blob.slice(0, minimumBytes);
    const detectedType = await imageType(
      Buffer.from(await detect.arrayBuffer())
    );
    headers.set("Content-Type", detectedType ? detectedType.mime : "image/*");

    // Set cache headers for better performance
    headers.set(
      "cache-control",
      "s-maxage=3600, stale-while-revalidate=31560000"
    );

    return new NextResponse(blob, { status: 200, statusText: "OK", headers });
  } catch (error) {
    console.error("Error serving image:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
