import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { headers } from "next/headers";
import GlobalAlertDisplay from "@/app/components/GlobalAlertDisplay";

export const metadata: Metadata = {
  title: "Slot Bot",
  description: "Access the slot bot system.",
};

export default async function SlotBot() {
  const session = await auth();

  // Check if user is logged in
  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  // Get country from request headers if not set in user profile
  const headersList = await headers();
  const visitorCountry = headersList.get("x-vercel-ip-country") || "US";

  // Update user geo if not already set
  if (!session.user.geo) {
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        geo: visitorCountry,
      },
    });
  }

  // Get user data and alerts
  const now = new Date();
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      alerts: {
        include: {
          alert: true,
        },
      },
    },
  });

  // Check if user has access
  const hasValidTrial = user?.trial ? new Date(user.trial) > now : false;
  const hasPaidAccess = user?.paid === true;

  if (!hasValidTrial && !hasPaidAccess) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <div className="text-lg border-y border-green-900 py-4">
          <p className="mb-4">
            You need either an active trial or a paid membership to access this
            page.
          </p>
          <p>
            Please visit our{" "}
            <a
              href="/pricing"
              className="text-green-700 hover:text-green-900 underline"
            >
              pricing page
            </a>{" "}
            to learn more about our membership options.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 mt-8">Welcome to the Slot Bot</h1>
      <div className="text-lg border-y border-green-900 py-4">
        <p>
          You have access to the slot bot system. Content will be added here.
        </p>
      </div>
      <GlobalAlertDisplay />
    </div>
  );
}
