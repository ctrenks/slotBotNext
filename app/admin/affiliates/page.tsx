import { redirect } from "next/navigation";
import { Metadata } from "next";
import AffiliateSettingsManager from "@/app/components/AffiliateSettingsManager";
import { isAdmin } from "@/app/utils/auth";

export const metadata: Metadata = {
  title: "Affiliate Settings",
  description: "Manage affiliate tracking settings and postback URLs",
};

export default async function AffiliateSettingsPage() {
  // Check if user is admin
  if (!(await isAdmin())) {
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
