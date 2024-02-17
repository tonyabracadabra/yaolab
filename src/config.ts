import { Pathnames } from "next-intl/navigation";

export const locales = ["en", "zh"] as const;
export const localesLabels = {
  en: "English",
  zh: "中文 （待完善）",
};

export const pathnames = {
  "/": "/",
} satisfies Pathnames<typeof locales>;

// Use the default: `always`
export const localePrefix = undefined;

export type AppPathnames = keyof typeof pathnames;
