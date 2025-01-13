"use client";

import { cn } from "@/lib/utils";
import { useAuth, useUser } from "@clerk/nextjs";
import Avatar from "boring-avatars";
import { useConvexAuth } from "convex/react";
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
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
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

export type AppSidebarItem = {
  title: string;
  href: string;
  regex: RegExp;
  icon: LucideIcon;
};

export function AppSidebar() {
  const path = usePathname();
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuth();
  const { user } = useUser();
  const t = useTranslations("New");
  const { toggleSidebar, state } = useSidebar();

  const items = [
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
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div
          className={cn(
            "flex items-center justify-between px-3 h-10",
            state === "expanded" ? "px-3" : "px-0"
          )}
        >
          {state === "expanded" ? (
            <>
              <div className="flex items-center gap-2">
                <Link href="/" className="shrink-0">
                  <Logo className="size-5" />
                </Link>
                <span className="font-semibold">Yaolab@JNU</span>
              </div>
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
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 mx-auto text-muted-foreground hover:text-foreground"
                    onClick={toggleSidebar}
                  >
                    <ArrowRightToLine className="h-4 w-4" />
                    <span className="sr-only">Expand Sidebar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Expand sidebar</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item, index) => {
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
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
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
