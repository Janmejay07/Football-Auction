import type { ReactNode } from "react";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { ProtectedPage } from "@/components/common/ProtectedPage";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ProtectedPage>
      <div className="min-h-screen">
        <DashboardNav />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</div>
      </div>
    </ProtectedPage>
  );
}
