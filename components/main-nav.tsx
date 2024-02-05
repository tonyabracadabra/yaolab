"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icons } from "@/components/icons";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function MainNav() {
  const pathname = usePathname();

  console.log("pathname", pathname);

  return (
    <div className="mr-4 hidden md:flex gap-8">
      <Link href="/" className="font-urban mr-6 flex items-center space-x-2">
        <Icons.logo className="h-6 w-6" />
        <div className="relative -ml-[1px] text-xl flex items-center justify-center">
          <span className="font-bold">{siteConfig.name}</span>
          <span className="font-thin">{siteConfig.suffix}</span>
        </div>
      </Link>
      <Link
        href="/dashboard"
        className="flex items-center font-urban mr-6 space-x-2 group"
      >
        <div className="flex flex-col gap-[1.5px] items-center justify-center">
          <div className="relative w-full text-md flex items-center justify-center group-hover:opacity-60">
            Dashboard
          </div>
          <div
            className={cn(
              "w-full h-[1px] bg-primary group-hover:opacity-100",
              pathname.startsWith("/dashboard") ? "opacity-100" : "opacity-0"
            )}
          />
        </div>
      </Link>
    </div>
  );
}
