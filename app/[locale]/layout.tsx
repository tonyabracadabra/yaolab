import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/react";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Inter, Urbanist } from "next/font/google";
import "./globals.css";
import ConvexClerkClientProvider from "./provider";

const inter = Inter({ subsets: ["latin"] });
const urbanist = Urbanist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YaoLab@JNU",
  description: "Discovering the unknowns",
};

export default async function LocaleLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;

  const { locale } = params;

  const { children } = props;

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <body
          className={`h-full ${GeistSans.variable} ${GeistMono.variable} ${inter.className} ${urbanist.className}`}
          suppressHydrationWarning
        >
          <ConvexClerkClientProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
              storageKey="yaolab-theme"
            >
              <SiteHeader />
              <TooltipProvider>
                <main className="h-[calc(100vh-68px)] overflow-auto">
                  {children}
                </main>
              </TooltipProvider>
              <Toaster position="top-center" />
            </ThemeProvider>
            <Analytics />
          </ConvexClerkClientProvider>
        </body>
      </NextIntlClientProvider>
    </html>
  );
}
