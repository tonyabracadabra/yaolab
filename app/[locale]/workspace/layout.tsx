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
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-[240px] shrink-0 flex-col border-r border-border/40 bg-gradient-to-b from-background to-background/95">
          <div className="flex flex-col gap-2 p-5">
            <div className="mb-2">
              <h2 className="px-3 text-sm font-medium text-muted-foreground">
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
        <div className="flex-1 overflow-y-auto bg-background/50">
          {isAuthenticated ? (
            children
          ) : (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
