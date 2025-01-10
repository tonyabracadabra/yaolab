"use client";

import { WorkspaceNav } from "@/components/nav";
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
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-[240px] border-r border-border/40 bg-gradient-to-b from-background to-background/95">
        <div className="flex flex-col gap-2 p-5">
          <div className="mb-2">
            <h2 className="text-sm font-medium text-muted-foreground px-3">
              Workspace
            </h2>
          </div>
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
      </div>

      <div className="flex-1 overflow-auto bg-background/50">
        {isAuthenticated ? (
          <div className="h-full p-6">{children}</div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
