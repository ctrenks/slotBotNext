import { auth } from "@/auth";

import { redirect } from "next/navigation";

import { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return <>{children}</>;
}
