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
    console.log("🔍 hasRole: Checking role for required level:", requiredRole);

    const session = await auth();
    console.log(
      "🔍 hasRole: Session data:",
      session ? { email: session.user?.email, hasUser: !!session.user } : null
    );

    if (!session?.user?.email) {
      console.log("🔍 hasRole: No session or email, returning false");
      return false;
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    console.log("🔍 hasRole: User from DB:", user);

    if (!user) {
      console.log("🔍 hasRole: User not found in database, returning false");
      return false;
    }

    const hasRequiredRole = user.role >= requiredRole;
    console.log(
      "🔍 hasRole: User role",
      user.role,
      ">=",
      requiredRole,
      "?",
      hasRequiredRole
    );

    return hasRequiredRole;
  } catch (error) {
    console.error("🔍 hasRole: Error checking user role:", error);
    return false;
  }
}

/**
 * Check if the current user is an admin (role 9)
 */
export async function isAdmin(): Promise<boolean> {
  const stack = new Error().stack;
  console.log(
    "🔍 isAdmin: Starting admin check - Called from:",
    stack?.split("\n")[2]?.trim()
  );
  const result = await hasRole(UserRole.ADMIN);
  console.log("🔍 isAdmin: Final result:", result);
  return result;
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
