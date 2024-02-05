"use client";

import { DashboardNav } from "@/components/nav";
import { useConvexAuth } from "convex/react";
import { ListPlus, Loader2, Waypoints } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useConvexAuth();

  return (
    <div className="w-full flex h-full">
      <div className="pl-16 pt-8 flex items-center justify-center gap-6 border-r-[1px] h-[100vh]">
        <DashboardNav
          items={[
            {
              title: "New Analysis",
              icon: ListPlus,
              href: "/dashboard/new",
              regex: /^\/dashboard(\/new)?$/,
            },
            {
              title: "All analysis",
              icon: Waypoints,
              href: "/dashboard/analysis",
              regex: /^\/dashboard\/analysis(\/.*)?$/,
            },
          ]}
        />
      </div>

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
