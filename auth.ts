import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/prisma";

import GoogleProvider from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Nodemailer({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
});
