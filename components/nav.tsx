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
    <nav className="flex flex-col items-start gap-2 px-2">
      {items.map((item, index) => {
        const isActive = item.regex.test(path);

        return (
          item.href && (
            <Link
              key={index}
              href={item.disabled ? "/" : item.href}
              className={cn(
                "group relative w-full select-none rounded-lg",
                "transition-all duration-200 ease-in-out",
                "dark:hover:bg-zinc-800/50 hover:bg-zinc-100/80",
                item.disabled && "pointer-events-none opacity-60"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-accent/80 to-accent/20 opacity-20 dark:from-accent/40 dark:to-accent/10" />
              )}
              <span
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2",
                  "transition-all duration-200 ease-in-out",
                  "hover:bg-accent/40 dark:hover:bg-accent/20",
                  isActive
                    ? "bg-accent/30 text-foreground dark:bg-accent/20"
                    : "text-muted-foreground hover:text-foreground dark:hover:text-zinc-200",
                  "dark:shadow-sm dark:shadow-zinc-950/50",
                  "relative z-10"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    "transition-all duration-200",
                    isActive
                      ? "text-foreground dark:text-zinc-200"
                      : "text-muted-foreground/70 group-hover:text-foreground/90 dark:group-hover:text-zinc-300"
                  )}
                />
                <span className="truncate text-sm font-medium">
                  {item.title}
                </span>
                {item.external && (
                  <span className="ml-auto text-xs text-muted-foreground/50 dark:text-zinc-500">
                    ↗
                  </span>
                )}
              </span>
            </Link>
          )
        );
      })}
    </nav>
  );
}
