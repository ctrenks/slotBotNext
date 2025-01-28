import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/prisma";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const emailTemplate = (params: { url: string; host: string }) => {
  const { url, host } = params;

  return {
    subject: `Sign in to ${host}`,
    html: `
      <body style="background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #1E3A8A; margin-bottom: 20px;">Sign in to Beat Online Slots</h1>
          <p style="margin-bottom: 20px;">Click the button below to sign in to your account.</p>
          <a href="${url}"
             style="display: inline-block; background-color: #1E3A8A; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 4px; margin-bottom: 20px;">
            Sign In
          </a>
          <p style="color: #666; font-size: 14px;">
            If you didn't request this email, you can safely ignore it.
          </p>
          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #888; font-size: 12px;">
            This link will expire in 24 hours.
          </p>
        </div>
      </body>
    `,
    text: `Sign in to ${host}\n${url}\n\n`,
  };
};

export const config = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      from: process.env.EMAIL_FROM!,
      async sendVerificationRequest({
        identifier: email,
        url,
        provider: { from },
      }) {
        const { host } = new URL(url);
        const emailContent = emailTemplate({ url, host });

        try {
          const result = await resend.emails.send({
            from,
            to: email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
          });

          if (!result.id) {
            throw new Error("Failed to send verification email");
          }

          console.log("Verification email sent:", result);
        } catch (error) {
          console.error("Error sending verification email:", error);
          throw new Error("Failed to send verification email");
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};

export const { auth, signIn, signOut } = NextAuth(config);
export const { GET, POST } = NextAuth(config).handlers;
