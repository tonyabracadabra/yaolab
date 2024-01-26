"use client";

import { MainNav } from "@/components/main-nav";
import { MobileNav } from "@/components/mobile-nav";
import { ModeToggle } from "@/components/mode-toggle";
import { useAuth, useUser } from "@clerk/nextjs";
import Avatar from "boring-avatars";
import { useConvexAuth } from "convex/react";
import Link from "next/link";
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
  const { isAuthenticated } = useConvexAuth();

  return (
    <header className="font-sans sticky mb-4 top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <MainNav />
        <MobileNav />
        <div className="flex gap-2 flex-1 items-center justify-between space-x-2 md:justify-end">
          {isSignedIn && isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <div className="flex items-center justify-center gap-4 text-white">
                  <Avatar
                    size={25}
                    name={user?.username || ""}
                    variant="marble"
                  />
                  <div>{user?.username}</div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => signOut()}>
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/sign-in">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
          <nav className="flex items-center">
            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
