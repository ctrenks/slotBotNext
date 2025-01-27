import { auth } from "@/auth";
import { prisma } from "@/prisma";
import ProfileForm from "@/app/components/ProfileForm";

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
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      <ProfileForm user={user} />
    </div>
  );
}
