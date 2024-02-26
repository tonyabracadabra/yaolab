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
  regex: RegExp;
  items?: never;
};

interface WorkspaceNavProps {
  items: SidebarNavItem[];
}

export function WorkspaceNav({ items }: WorkspaceNavProps) {
  const path = usePathname();

  if (!items?.length) {
    return null;
  }

  return (
    <nav className="flex flex-col items-start gap-2 h-full border-r-secondary pr-4">
      {items.map((item, index) => {
        return (
          item.href && (
            <Link key={index} href={item.disabled ? "/" : item.href}>
              <span
                className={cn(
                  "group w-[170px] flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  item.regex.test(path) ? "bg-accent" : "transparent",
                  item.disabled && "cursor-not-allowed opacity-80"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5",
                    item.regex.test(path) ? "opacity-100" : "opacity-60"
                  )}
                />
                <span
                  className={cn(
                    "whitespace-nowrap",
                    item.regex.test(path) ? "text-primary" : "text-primary/60"
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
