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
  href: string;
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
    <nav className="grid items-start gap-2 px-2 h-full">
      {items.map((item, index) => {
        return (
          item.href && (
            <Link key={index} href={item.disabled ? "/" : item.href}>
              <span
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  path === item.href ? "bg-accent" : "transparent",
                  item.disabled && "cursor-not-allowed opacity-80"
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">{item.title}</span>
              </span>
            </Link>
          )
        );
      })}
    </nav>
  );
}
