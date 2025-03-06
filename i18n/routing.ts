import { createNavigation } from "next-intl/navigation";
import { defineRouting, Pathnames } from "next-intl/routing";

export type Locale = "en" | "zh";

export const localesLabels: Record<Locale, string> = {
  en: "English",
  zh: "中文",
};

export const routing = defineRouting({
  locales: Object.keys(localesLabels) as Locale[],
  defaultLocale: "en",
});

export const pathnames = {
  "/": "/",
} satisfies Pathnames<typeof routing.locales>;

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
