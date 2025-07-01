import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const wins = await prisma.slotWin.findMany({
      where: {
        approved: true,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(wins);
  } catch (error) {
    console.error("Error fetching slot wins:", error);
    return new NextResponse("Error fetching slot wins", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const form = await request.formData();
    const title = form.get("title") as string;
    const description = form.get("description") as string;
    const winAmount = form.get("winAmount") as string;
    const slotGame = form.get("slotGame") as string;
    const casino = form.get("casino") as string;
    const file = form.get("screenshot") as File;

    if (!title || !winAmount) {
      return new NextResponse("Title and win amount are required", {
        status: 400,
      });
    }

    let imageUrl = null;

    // Handle file upload if provided
    if (file && file.size > 0) {
      // Only allow images
      if (!file.type.startsWith("image/")) {
        return new NextResponse("File must be an image", { status: 400 });
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return new NextResponse("File size must be under 5MB", { status: 400 });
      }

      // Create unique filename
      const fileExtension = file.name.split(".").pop();
      const timestamp = new Date().getTime();
      const uniqueFilename = `slot-wins/${process.env.SITE_ID}_win_${session.user.id}_${timestamp}.${fileExtension}`;

      const blob = await put(uniqueFilename, file, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN!,
        addRandomSuffix: false,
      });

      imageUrl = blob.url;
    }

    // Create the slot win record with automatic approval
    const slotWin = await prisma.slotWin.create({
      data: {
        userId: session.user.id!,
        title,
        description,
        winAmount,
        slotGame,
        casino,
        imageUrl,
        approved: true, // Auto-approve all submissions
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(slotWin);
  } catch (error) {
    console.error("Error creating slot win:", error);
    return new NextResponse("Error creating slot win", { status: 500 });
  }
}
