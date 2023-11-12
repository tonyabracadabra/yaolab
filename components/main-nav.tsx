"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icons } from "@/components/icons";
import { siteConfig } from "@/config/site";

export function MainNav() {
  const pathname = usePathname();

  return (
    <div className="mr-4 hidden md:flex">
      <Link href="/" className="font-urban mr-6 flex items-center space-x-2">
        <Icons.logo className="h-6 w-6" />
        <div className="relative -ml-[1px] text-xl flex items-center justify-center">
          <span className="font-bold">{siteConfig.name}</span>
          <span className="font-thin">{siteConfig.suffix}</span>
        </div>
      </Link>
    </div>
  );
}
