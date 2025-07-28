import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    // Check if user is admin
    const isAdmin =
      session?.user?.email === "chris@trenkas.com" ||
      session?.user?.email === "carringtoncenno180@gmail.com" ||
      session?.user?.email === "ranrev.info@gmail.com";
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent admins from deleting themselves
    if (user.email === session.user.email) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Delete the user (this will cascade delete related records due to foreign key constraints)
    await prisma.user.delete({
      where: { id: userId },
    });

    console.log(`Admin ${session.user.email} deleted user: ${user.email}`);

    return NextResponse.json({
      success: true,
      message: `User ${user.email} has been deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
