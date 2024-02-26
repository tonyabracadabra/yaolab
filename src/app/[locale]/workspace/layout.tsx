"use client";

import { WorkspaceNav } from "@/src/components/nav";
import { useConvexAuth } from "convex/react";
import { Atom, FileArchive, ListPlus, Loader2, Waypoints } from "lucide-react";
import { useTranslations } from "next-intl";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useConvexAuth();
  const t = useTranslations("New");

  return (
    <div className="w-full flex h-full">
      <div className="pl-8 pt-4 flex items-center justify-center gap-6 border-r-[1px] h-full">
        <WorkspaceNav
          items={[
            {
              title: t("new-analysis"),
              icon: ListPlus,
              href: "/workspace/new",
              regex: /\/workspace(\/new)?$/,
            },
            {
              title: t("all-analysis"),
              icon: Waypoints,
              href: "/workspace/analysis",
              regex: /\/workspace\/analysis(\/.*)?$/,
            },
            {
              title: t("all-rawfiles"),
              icon: FileArchive,
              href: "/workspace/raw",
              regex: /\/workspace\/raw(\/.*)?$/,
            },
            {
              title: t("all-reaction-dbs"),
              icon: Atom,
              href: "/workspace/reactions",
              regex: /\/workspace\/reactions(\/.*)?$/,
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
