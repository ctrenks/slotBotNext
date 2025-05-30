import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/prisma";
import GoogleProvider from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

// Extend the built-in types
declare module "next-auth" {
  interface User {
    geo?: string | null;
    refferal?: string | null;
    clickId?: string | null;
    offerCode?: string | null;
  }

  interface Session {
    user: User & {
      id: string;
      email: string;
      image?: string | null;
      name?: string | null;
      geo?: string | null;
      refferal?: string | null;
      clickId?: string | null;
      offerCode?: string | null;
    };
  }
}

// List of routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/profile",
  "/settings",
  "/myprofile",
  "/slotbot",
];

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from: process.env.EMAIL_FROM!,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, ...params }) {
      try {
        // Check if there's a clickId in the params
        const clickId = (params as Record<string, unknown>).clickId as
          | string
          | undefined;

        // Check if there's an offerCode in the params
        const offerCode = (params as Record<string, unknown>).offerCode as
          | string
          | undefined;

        if (user.email) {
          const updateData: Record<string, string | null> = {};

          if (clickId) {
            console.log(`Storing clickId ${clickId} for user ${user.email}`);
            updateData.clickId = clickId;
          }

          if (offerCode) {
            console.log(
              `Storing offerCode ${offerCode} for user ${user.email}`
            );
            updateData.offerCode = offerCode;
          }

          // Only update if we have data to update
          if (Object.keys(updateData).length > 0) {
            try {
              // Store the data with the user
              const updatedUser = await prisma.user.update({
                where: { email: user.email },
                data: updateData,
              });

              // Update any click tracking records with this clickId to mark them as converted
              if (clickId) {
                await prisma.clickTrack.updateMany({
                  where: { clickId },
                  data: {
                    convertedToUser: true,
                    userId: updatedUser.id,
                  },
                });
              }
            } catch (error) {
              // Log the error but don't fail the sign-in
              console.error("Error updating user with tracking data:", error);
            }
          }
        }
      } catch (error) {
        // Log the error but don't fail the sign-in
        console.error("Error in signIn callback:", error);
      }

      // Always return true to allow sign-in to proceed
      return true;
    },
    async session({ session }) {
      try {
        // Get the user from database
        const user = await prisma.user.findUnique({
          where: { email: session.user.email! },
          select: {
            id: true,
            image: true,
            name: true,
            geo: true,
            refferal: true,
            clickId: true,
            offerCode: true,
            updatedAt: true,
          },
        });

        // Update session with database values
        if (user) {
          session.user.id = user.id;
          session.user.image = user.image;
          session.user.name = user.name;
          session.user.geo = user.geo;
          session.user.refferal = user.refferal;
          session.user.clickId = user.clickId;
          session.user.offerCode = user.offerCode;

          // Update user activity every 5 minutes to track active users
          const now = new Date();
          const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

          if (user.updatedAt < fiveMinutesAgo) {
            // Update the user's updatedAt field to track activity
            await prisma.user.update({
              where: { id: user.id },
              data: { updatedAt: now },
            });
          }
        }
      } catch (error) {
        // Log the error but don't fail the session
        console.error("Error in session callback:", error);
      }

      return session;
    },
    authorized({ request: { nextUrl, method }, auth }) {
      // Handle OPTIONS requests first
      if (method === "OPTIONS") {
        return true;
      }

      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith("/auth");
      const isProtectedRoute = protectedRoutes.some((route) =>
        nextUrl.pathname.startsWith(route)
      );

      // Redirect from auth pages if logged in
      if (isLoggedIn && isAuthPage) {
        return Response.redirect(new URL("/", nextUrl));
      }

      // Require auth only for protected routes
      if (isProtectedRoute) {
        return isLoggedIn;
      }

      // All other routes are public
      return true;
    },
  },
});
