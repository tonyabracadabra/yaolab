"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export type SidebarNavItem = {
  title: string;
  disabled?: boolean;
  external?: boolean;
  icon: LucideIcon;
} & {
  hrefs: string[];
  items?: never;
};

interface DashboardNavProps {
  items: SidebarNavItem[];
}

export function DashboardNav({ items }: DashboardNavProps) {
  const path = usePathname();

  if (!items?.length) {
    return null;
  }

  return (
    <nav className="flex flex-col items-start gap-2 h-full border-r-secondary pr-6">
      {items.map((item, index) => {
        return (
          item.hrefs && (
            <Link key={index} href={item.disabled ? "/" : item.hrefs[0]}>
              <span
                className={cn(
                  "group w-[180px] flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  item.hrefs.includes(path) ? "bg-accent" : "transparent",
                  item.disabled && "cursor-not-allowed opacity-80"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5",
                    item.hrefs.includes(path) ? "opacity-100" : "opacity-60"
                  )}
                />
                <span
                  className={cn(
                    "whitespace-nowrap",
                    item.hrefs.includes(path)
                      ? "text-primary"
                      : "text-primary/60"
                  )}
                >
                  {item.title}
                </span>
              </span>
            </Link>
          )
        );
      })}
    </nav>
  );
}
