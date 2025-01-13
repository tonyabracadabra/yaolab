"use client";

// ====================================================================
// Imports
// ====================================================================

// Core & Utils
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Auth
import { useAuth, useUser } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";

// Components
import Avatar from "boring-avatars";
import { Logo } from "./logo";

// UI Components
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "./ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

// Icons
import {
  ArrowLeftToLine,
  ArrowRightToLine,
  Atom,
  ChevronDown,
  FileArchive,
  ListPlus,
  LogOut,
  LucideIcon,
  Settings2,
  Waypoints,
} from "lucide-react";

// ====================================================================
// Types
// ====================================================================

export type AppSidebarItem = {
  title: string;
  href: string;
  regex: RegExp;
  icon: LucideIcon;
};

// ====================================================================
// Component
// ====================================================================

export function AppSidebar() {
  // ====================================================================
  // Hooks & State
  // ====================================================================
  const path = usePathname();
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuth();
  const { user } = useUser();
  const t = useTranslations("New");
  const { toggleSidebar, state } = useSidebar();

  // ====================================================================
  // Navigation Items
  // ====================================================================
  const createItems = [
    {
      title: t("new-analysis"),
      icon: ListPlus,
      href: "/workspace/new",
      regex: /\/workspace(\/new)?$/,
    },
  ];

  const analysisItems = [
    {
      title: t("all-analysis"),
      icon: Waypoints,
      href: "/workspace/analysis",
      regex: /\/workspace\/analysis(\/.*)?$/,
    },
  ];

  const resourceItems = [
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
  ];

  if (!isAuthenticated) {
    return null;
  }

  // ====================================================================
  // Render Helper
  // ====================================================================
  const renderNavigationItems = (items: AppSidebarItem[]) => {
    return items.map((item, index) => {
      const isActive = item.regex.test(path);
      return (
        <SidebarMenuItem key={index}>
          <SidebarMenuButton asChild isActive={isActive}>
            <Link href={item.href}>
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });
  };

  // ====================================================================
  // Render
  // ====================================================================
  return (
    <Sidebar collapsible="icon">
      {/* Header Section */}
      <SidebarHeader>
        <div
          className={cn(
            "flex items-center justify-between h-10",
            state === "expanded" ? "px-3" : "px-0"
          )}
        >
          {state === "expanded" ? (
            <>
              <Link
                href="/"
                className="flex items-center gap-2 hover:opacity-80"
              >
                <Logo className="size-5 shrink-0" />
                <span className="font-semibold">Yaolab@JNU</span>
              </Link>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={toggleSidebar}
                    >
                      <ArrowLeftToLine className="h-4 w-4" />
                      <span className="sr-only">Toggle Sidebar</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Collapse sidebar</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          ) : (
            <div className="w-full flex justify-center">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={toggleSidebar}
                    >
                      <ArrowRightToLine className="h-4 w-4" />
                      <span className="sr-only">Expand Sidebar</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Expand sidebar</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Navigation Section */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Create</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavigationItems(createItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Analysis</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavigationItems(analysisItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Resources</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavigationItems(resourceItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer Section */}
      <SidebarFooter className="border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton>
              <div className="flex items-center justify-center w-full gap-3">
                <Avatar
                  size={32}
                  name={user?.username || ""}
                  variant="marble"
                />
                {state === "expanded" && (
                  <>
                    <div className="flex flex-col items-start gap-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user?.primaryEmailAddress?.emailAddress}
                      </p>
                    </div>
                    <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />
                  </>
                )}
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuItem asChild>
              <Link
                href="/workspace/settings"
                className="flex items-center gap-2"
              >
                <Settings2 className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => signOut()}
              className="text-red-500 focus:text-red-500"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Log Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
