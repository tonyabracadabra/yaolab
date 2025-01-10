"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
    <nav className="flex flex-col items-start gap-1">
      {items.map((item, index) => {
        const isActive = item.regex.test(path);

        return (
          item.href && (
            <Link
              key={index}
              href={item.disabled ? "/" : item.href}
              className="w-full"
            >
              <span
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  "hover:bg-accent/50 hover:text-accent-foreground",
                  isActive && "bg-accent/60 text-accent-foreground",
                  !isActive && "text-muted-foreground",
                  item.disabled && "cursor-not-allowed opacity-60"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-4 w-4 transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground/70",
                    "group-hover:text-foreground"
                  )}
                />
                <span className="truncate">{item.title}</span>
              </span>
            </Link>
          )
        );
      })}
    </nav>
  );
}
