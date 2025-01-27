'use server'

import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { revalidatePath } from "next/cache";

export async function updateName(formData: FormData) {
  const session = await auth();
  if (!session || !session.user?.email) {
    return { success: false, message: "Not authenticated" };
  }

  const name = formData.get('name') as string;
  if (!name) {
    return { success: false, message: "Name is required" };
  }

  // Update the user's name
  await prisma.user.update({
    where: { email: session.user.email },
    data: { name },
  });

  revalidatePath('/myprofile');
  return { success: true, message: "Name updated successfully" };
}