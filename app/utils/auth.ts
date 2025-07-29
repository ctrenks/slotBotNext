import { auth } from "@/auth";
import { prisma } from "@/prisma";

export enum UserRole {
  USER = 0,
  MOD = 1,
  ADMIN = 9,
}

/**
 * Check if the current user has the required role or higher
 */
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return false;
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!user) {
      return false;
    }

    return user.role >= requiredRole;
  } catch (error) {
    console.error("Error checking user role:", error);
    return false;
  }
}

/**
 * Check if the current user is an admin (role 9)
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole(UserRole.ADMIN);
}

/**
 * Check if the current user is a moderator or higher (role 1+)
 */
export async function isMod(): Promise<boolean> {
  return hasRole(UserRole.MOD);
}

/**
 * Check if the user has admin or mod privileges
 */
export async function hasAdminAccess(): Promise<boolean> {
  return await isAdmin();
}

/**
 * Check if the user has mod or higher privileges
 */
export async function hasModAccess(): Promise<boolean> {
  return await isMod();
}

/**
 * Get the current user's role
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    return user?.role ?? null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
}
