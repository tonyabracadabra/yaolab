"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { localesLabels, routing } from "@/i18n";
import { useLocale } from "next-intl";
import { useTransition } from "react";
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
        {routing.locales.map((locale) => (
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
