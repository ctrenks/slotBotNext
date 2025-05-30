import { auth } from "@/auth";
import { prisma } from "@/prisma";
import ProfileForm from "@/app/components/ProfileForm";
import EmailNotificationSettings from "@/app/components/EmailNotificationSettings";

export default async function MyProfilePage() {
  const session = await auth();

  if (!session || !session.user) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Not authenticated</h1>
        <p>Please sign in to view your profile.</p>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      birthday: true,
      location: true,
      bio: true,
      emailNotifications: true as unknown as true,
    },
  });

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">User not found</h1>
        <p>There was an error loading your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      {/* Profile Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
        <ProfileForm user={user as any} />
      </div>

      {/* Email Notification Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Email Notifications</h2>
        <EmailNotificationSettings
          userId={user.id}
          currentSetting={
            (user as { emailNotifications: boolean }).emailNotifications ?? true
          }
        />
      </div>
    </div>
  );
}
