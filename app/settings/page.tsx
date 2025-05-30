import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/prisma";
import { Metadata } from "next";
import EmailNotificationSettings from "@/app/components/EmailNotificationSettings";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings and preferences",
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  // Get user's current settings
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      emailNotifications: true as any, // Type assertion until Prisma types are updated
    },
  });

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

        <div className="space-y-8">
          {/* User Information */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {user.name || "Not set"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Email Notification Settings */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Email Notifications</h2>
            <EmailNotificationSettings
              userId={user.id}
              currentSetting={(user as any).emailNotifications ?? true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
