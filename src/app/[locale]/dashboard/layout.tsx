"use client";

import { DashboardNav } from "@/src/components/nav";
import { useConvexAuth } from "convex/react";
import { Atom, FileArchive, ListPlus, Loader2, Waypoints } from "lucide-react";
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
      <div className="pl-8 pt-4 flex items-center justify-center gap-6 border-r-[1px] h-full">
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
            {
              title: t("all-rawfiles"),
              icon: FileArchive,
              href: "/dashboard/raw",
              regex: /\/dashboard\/raw(\/.*)?$/,
            },
            {
              title: t("all-reaction-dbs"),
              icon: Atom,
              href: "/dashboard/reactions",
              regex: /\/dashboard\/reactions(\/.*)?$/,
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
