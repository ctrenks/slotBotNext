import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { NextResponse } from "next/server";
import { isAdmin } from "@/app/utils/auth";

// Get all slot wins for admin (including unapproved)
export async function GET() {
  try {
    if (!(await isAdmin())) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const wins = await prisma.slotWin.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
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
    console.error("Error fetching slot wins for admin:", error);
    return new NextResponse("Error fetching slot wins", { status: 500 });
  }
}

// Update slot win (approve, feature, etc.)
export async function PATCH(request: Request) {
  try {
    if (!(await isAdmin())) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id, approved, featured, displayName } = await request.json();

    if (!id) {
      return new NextResponse("Slot win ID is required", { status: 400 });
    }

    const updatedWin = await prisma.slotWin.update({
      where: { id },
      data: {
        ...(approved !== undefined && { approved }),
        ...(featured !== undefined && { featured }),
        ...(displayName !== undefined && { displayName: displayName || null }),
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(updatedWin);
  } catch (error) {
    console.error("Error updating slot win:", error);
    return new NextResponse("Error updating slot win", { status: 500 });
  }
}

// Delete slot win
export async function DELETE(request: Request) {
  try {
    if (!(await isAdmin())) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Slot win ID is required", { status: 400 });
    }

    await prisma.slotWin.delete({
      where: { id },
    });

    return new NextResponse("Slot win deleted", { status: 200 });
  } catch (error) {
    console.error("Error deleting slot win:", error);
    return new NextResponse("Error deleting slot win", { status: 500 });
  }
}
