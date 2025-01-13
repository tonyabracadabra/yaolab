"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useConvexAuth } from "convex/react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useConvexAuth();
  const t = useTranslations("New");

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex flex-1 bg-background/50 w-full overflow-hidden h-screen">
        {isAuthenticated ? (
          children
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </main>
    </SidebarProvider>
  );
}
