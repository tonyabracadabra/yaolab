"use client";

import { DashboardNav } from "@/src/components/nav";
import { useConvexAuth } from "convex/react";
import { ListPlus, Loader2, Waypoints } from "lucide-react";
import { useTranslations } from "next-intl";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useConvexAuth();
  const t = useTranslations("New");

  return (
    <div className="w-full flex h-full">
      <div className="pl-16 pt-8 flex items-center justify-center gap-6 border-r-[1px] h-full">
        <DashboardNav
          items={[
            {
              title: t("new-analysis"),
              icon: ListPlus,
              href: "/dashboard/new",
              regex: /\/dashboard(\/new)?$/,
            },
            {
              title: t("all-analysis"),
              icon: Waypoints,
              href: "/dashboard/analysis",
              regex: /\/dashboard\/analysis(\/.*)?$/,
            },
          ]}
        />
      </div>

      {isAuthenticated ? (
        <>{children}</>
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          <Loader2 className="animate-spin" />
        </div>
      )}
    </div>
  );
}
