"use client";

import { DashboardNav } from "@/components/nav";
import { useConvexAuth } from "convex/react";
import { BarChart2, Database, File, Loader2, Plus } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useConvexAuth();

  return (
    <div className="w-full flex h-full">
      <DashboardNav
        items={[
          {
            title: "New Analysis",
            icon: Plus,
            href: "/dashboard/new",
          },
          {
            title: "All analysis",
            icon: BarChart2,
            href: "/dashboard/analysis",
          },
          {
            title: "Raw files",
            icon: File,
            href: "/dashboard/files",
          },
          {
            title: "Reaction Databases",
            icon: Database,
            href: "/dashboard/reaction-databases",
          },
        ]}
      />
      {isAuthenticated ? (
        <div className="w-full">{children}</div>
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          <Loader2 className="animate-spin" />
        </div>
      )}
    </div>
  );
}
