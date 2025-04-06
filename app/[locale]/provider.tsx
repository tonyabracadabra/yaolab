"use client";

import * as clerkLocalizations from "@clerk/localizations";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { ReactNode, useEffect, useState } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

const convex = new ConvexReactClient(convexUrl);

export default function ConvexClerkClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const locale = useLocale();
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!publishableKey) {
    throw new Error("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set");
  }

  // Define explicit color variables for light and dark themes
  const lightColors = {
    colorPrimary: "hsl(222.2, 47.4%, 11.2%)",
    colorText: "hsl(222.2, 84%, 4.9%)",
    colorTextOnPrimaryBackground: "hsl(210, 40%, 98%)",
    colorBackground: "hsl(0, 0%, 100%)",
    colorInputBackground: "hsl(0, 0%, 100%)",
    colorInputText: "hsl(222.2, 84%, 4.9%)",
    colorDanger: "hsl(0, 84.2%, 60.2%)",
  };

  const darkColors = {
    colorPrimary: "hsl(210, 40%, 98%)",
    colorText: "hsl(210, 40%, 98%)",
    colorTextOnPrimaryBackground: "hsl(222.2, 47.4%, 11.2%)",
    colorBackground: "hsl(222.2, 84%, 4.9%)",
    colorInputBackground: "hsl(222.2, 84%, 4.9%)",
    colorInputText: "hsl(210, 40%, 98%)",
    colorDanger: "hsl(0, 62.8%, 30.6%)",
  };

  // Select the appropriate theme colors
  const themeColors =
    mounted && resolvedTheme === "dark" ? darkColors : lightColors;

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{
        variables: themeColors,
        elements: {
          formButtonPrimary: {
            fontSize: "14px",
            fontWeight: "500",
            textTransform: "none",
          },
          card: {
            boxShadow: "none",
            borderRadius: "var(--radius)",
          },
        },
      }}
      localization={
        (Object.values(clerkLocalizations).find(
          (l) => l.locale?.startsWith(locale) || l.locale === locale
        ) || clerkLocalizations.enUS) as any
      }
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
