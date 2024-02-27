"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "next-intl";
import { useTransition } from "react";
import { locales, localesLabels } from "../config";
import { usePathname, useRouter } from "../navigation";
import { Button } from "./ui/button";

export function LangToggle() {
  const currLocale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          {localesLabels[currLocale as "en" | "zh"]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="font-sans">
        {locales.map((locale) => (
          <DropdownMenuItem
            disabled={locale === currLocale || isPending}
            key={locale}
            onSelect={() => {
              startTransition(() => {
                router.replace(pathname, {
                  locale: locale,
                });
              });
            }}
          >
            {localesLabels[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
