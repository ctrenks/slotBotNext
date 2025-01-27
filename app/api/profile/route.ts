import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await request.json();
    const { name, birthday, location, bio, image } = data;

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name,
        birthday: birthday ? new Date(birthday) : null,
        location,
        bio,
        image,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating profile:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
