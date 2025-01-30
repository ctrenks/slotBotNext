import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/prisma";
import AlertManager from "@/app/components/AlertManager";
import { Metadata } from "next";
import { Alert, AlertRecipient } from "@prisma/client";

export const metadata: Metadata = {
  title: "Alert Management",
  description: "Manage system alerts and notifications",
};

interface AlertWithRecipients extends Alert {
  recipients: AlertRecipient[];
}

export default async function AlertManagementPage() {
  const session = await auth();

  // Check if user is logged in and is an admin
  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  // Get all alerts for display
  const alerts = (await prisma.alert.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      recipients: true,
    },
  })) as AlertWithRecipients[];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Alert Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <AlertManager />
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Existing Alerts</h2>
          <div className="space-y-4">
            {alerts.map((alert: AlertWithRecipients) => (
              <div key={alert.id} className="border rounded-lg p-4">
                <p className="font-medium">{alert.message}</p>
                <div className="mt-2 text-sm text-gray-500">
                  <p>Start: {new Date(alert.startTime).toLocaleString()}</p>
                  <p>End: {new Date(alert.endTime).toLocaleString()}</p>
                  <p>Recipients: {alert.recipients.length}</p>
                  <p>Geo Targets: {alert.geoTargets.join(", ") || "All"}</p>
                  <p>
                    Referral Codes: {alert.referralCodes.join(", ") || "All"}
                  </p>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <p className="text-gray-500">No alerts created yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
