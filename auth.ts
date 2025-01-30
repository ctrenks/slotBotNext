import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/prisma";
import GoogleProvider from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

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
    async session({ session }) {
      // Get the user from database
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { image: true, name: true },
      });

      // Update session with database values
      if (user) {
        session.user.image = user.image;
        session.user.name = user.name;
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
