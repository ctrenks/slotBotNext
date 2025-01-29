"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function redeemCoupon(formData: FormData) {
  const session = await auth();
  const code = formData.get("code") as string;

  if (!session?.user?.email) {
    return { error: "You must be logged in to redeem a coupon code" };
  }

  if (!code) {
    return { error: "Please provide a coupon code" };
  }

  try {
    // Check if code exists as an affiliate code
    const affiliateUser = await prisma.user.findFirst({
      where: {
        affiliate: code,
      },
    });

    if (!affiliateUser) {
      return { error: "Invalid coupon code" };
    }

    // Update current user with referral and trial
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    await prisma.user.update({
      where: {
        email: session.user.email,
      },
      data: {
        refferal: code,
        trial: oneYearFromNow,
      },
    });

    revalidatePath("/");
    return { success: true, message: "Coupon code successfully redeemed!" };
  } catch (error) {
    console.error("Error redeeming coupon:", error);
    return { error: "An error occurred while redeeming the coupon" };
  }
}
