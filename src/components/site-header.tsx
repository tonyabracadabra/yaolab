"use client";

import { MainNav } from "@/src/components/main-nav";
import { MobileNav } from "@/src/components/mobile-nav";
import { ModeToggle } from "@/src/components/mode-toggle";
import { useAuth, useUser } from "@clerk/nextjs";
import Avatar from "boring-avatars";
import { LogOut, Settings2 } from "lucide-react";
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
    <header className="font-sans sticky mb-2 top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <MainNav />
        <MobileNav />
        <div className="flex gap-2 flex-1 items-center justify-between space-x-2 md:justify-end">
          {isSignedIn ? (
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
              <DropdownMenuContent className="-ml-20">
                <DropdownMenuItem>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 justify-center"
                  >
                    <Settings2 size={12} />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  <div className="text-red-500 flex items-center gap-2 justify-center">
                    <LogOut size={12} />
                    Log Out
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/sign-in">
              <Button size="sm">Sign In</Button>
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
