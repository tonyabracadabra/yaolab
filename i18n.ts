import { createNavigation } from "next-intl/navigation";
import { defineRouting, Pathnames } from "next-intl/routing";
import { getRequestConfig } from "next-intl/server";

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

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  // Validate that the incoming `locale` parameter is valid
  if (!routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    timeZone: "UTC",
  };
});
