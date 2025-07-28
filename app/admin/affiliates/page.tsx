import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import AffiliateSettingsManager from "@/app/components/AffiliateSettingsManager";

export const metadata: Metadata = {
  title: "Affiliate Settings",
  description: "Manage affiliate tracking settings and postback URLs",
};

export default async function AffiliateSettingsPage() {
  const session = await auth();

  // Check if user is admin
  // Check if user is admin
  const isAdmin =
    session?.user?.email === "chris@trenkas.com" ||
    session?.user?.email === "carringtoncenno180@gmail.com" ||
    session?.user?.email === "ranrev.info@gmail.com";

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Affiliate Settings</h1>

      <div className="grid grid-cols-1 gap-8">
        <div>
          <AffiliateSettingsManager />
        </div>
      </div>
    </div>
  );
}
