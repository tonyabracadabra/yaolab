"use client";

import { MainNav } from "@/components/main-nav";
import { MobileNav } from "@/components/mobile-nav";
import { ModeToggle } from "@/components/mode-toggle";
import { useAuth, useUser } from "@clerk/nextjs";
import Avatar from "boring-avatars";
import { LayoutDashboard, LogOut, Settings2 } from "lucide-react";
import Link from "next/link";
import { LangToggle } from "./lang-toggle";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function SiteHeader() {
  const { user, isSignedIn } = useUser();
  const { signOut } = useAuth();

  return (
    <header className="font-sans sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <MainNav />
        <MobileNav />
        <div className="flex gap-2 flex-1 items-center justify-between space-x-2 md:justify-end">
          {isSignedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative flex items-center gap-2 h-9 px-2 py-1.5"
                >
                  <Avatar
                    size={28}
                    name={user?.username || ""}
                    variant="marble"
                  />
                  <span className="text-sm font-medium">{user?.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user?.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </div>
                <DropdownMenuItem asChild className="w-full cursor-pointer">
                  <Link
                    href="/workspace"
                    className="flex w-full items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Workspace</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="w-full cursor-pointer">
                  <Link
                    href="/workspace/settings"
                    className="flex w-full items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Settings2 className="h-4 w-4" />
                      <span>Settings</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="w-full cursor-pointer text-red-500 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950"
                  onClick={() => signOut()}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      <span>Log Out</span>
                    </div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/sign-in">
              <Button size="sm" className="px-4">
                Sign In
              </Button>
            </Link>
          )}
          <nav className="flex items-center gap-2">
            <ModeToggle />
            <LangToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
