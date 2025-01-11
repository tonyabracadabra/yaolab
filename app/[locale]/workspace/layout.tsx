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
    <div className="flex flex-1 h-full">
      {/* Fixed Left Navigation */}
      <aside className="flex w-[200px] shrink-0 flex-col border-r border-border/40 dark:bg-gray-800/30 bg-gray-100/30">
        <div className="flex flex-col gap-2 px-2 py-4">
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
      </aside>

      {/* Scrollable Main Content */}
      <main className="flex flex-1 bg-background/50 w-full overflow-hidden h-full">
        {isAuthenticated ? (
          children
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </main>
    </div>
  );
}
